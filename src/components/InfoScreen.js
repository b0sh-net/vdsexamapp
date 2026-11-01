import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ScreenHeader from './ui/ScreenHeader';
import AppButton from './ui/AppButton';
import questionsData from '../data/questions.json';
import learningStorage from '../utils/learningStorage';
import trainingBackup from '../utils/trainingBackup';
import { colors, layout, radii, spacing, shadows } from '../theme';
import useAppInsets from '../hooks/useAppInsets';

const REPO_URL = 'https://github.com/b0sh-net/vdsexamapp';

const MESSAGES = {
  exportSuccess: {
    title: 'Esportazione completata',
    body: 'Il file con copertura e domande da recuperare è pronto per essere salvato o condiviso.',
  },
  sharingUnavailable: {
    title: 'Condivisione non disponibile',
    body: 'Questo dispositivo non supporta la condivisione di file.',
  },
  exportFailed: {
    title: 'Esportazione non riuscita',
    body: 'Impossibile esportare i dati. I dati sul dispositivo non sono stati modificati.',
  },
  invalidBackup: {
    title: 'Backup non valido',
    body: 'Il file selezionato non è un backup valido dell’addestramento.',
  },
  unsupportedVersion: {
    title: 'Versione non supportata',
    body: 'Il file è stato creato con una versione dell’app non supportata.',
  },
  incompatible: {
    title: 'Dati non compatibili',
    body: 'Il file contiene domande non presenti in questa versione dell’archivio.',
  },
  readFailed: {
    title: 'Lettura non riuscita',
    body: 'Impossibile leggere il file selezionato.',
  },
  importWriteFailed: {
    title: 'Importazione non completata',
    body: 'Impossibile salvare i dati sul dispositivo. La copertura potrebbe essere parzialmente aggiornata.',
  },
};

function importErrorMessage(code) {
  if (code === 'UNSUPPORTED_VERSION') return MESSAGES.unsupportedVersion;
  if (code === 'INVALID_ARCHIVE_DATA') return MESSAGES.incompatible;
  if (code === 'READ_FAILED') return MESSAGES.readFailed;
  if (code === 'WRITE_FAILED') return MESSAGES.importWriteFailed;
  return MESSAGES.invalidBackup;
}

function showMessage({ title, body }) {
  Alert.alert(title, body);
}

function SectionCard({ title, children, tone, style }) {
  return (
    <View
      style={[
        styles.card,
        tone === 'warning' && styles.cardWarning,
        style,
      ]}
    >
      <View
        style={[styles.sectionBar, tone === 'warning' && styles.sectionBarWarning]}
      />
      <Text
        style={[styles.cardTitle, tone === 'warning' && styles.cardTitleWarning]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function InfoScreen({
  onReturnToMenu,
  storageAdapter = learningStorage,
  backupAdapter = trainingBackup,
  questionBank = questionsData,
}) {
  const { bottom } = useAppInsets();
  const [status, setStatus] = useState('loading');
  const [snapshot, setSnapshot] = useState({
    coverage: [],
    pending: [],
    coverageSummary: {
      seenCount: 0,
      totalCount: 0,
      remainingCount: 0,
      percentage: 0,
    },
  });
  const [loadError, setLoadError] = useState(null);

  const canRead =
    backupAdapter && typeof backupAdapter.loadSnapshot === 'function';
  const canExport =
    canRead && typeof backupAdapter.exportData === 'function';
  const canImport = typeof backupAdapter.pickImportFile === 'function' &&
    typeof backupAdapter.importData === 'function';

  const refreshSnapshot = useCallback(async () => {
    if (!canRead) return null;
    try {
      const next = await backupAdapter.loadSnapshot(questionBank, storageAdapter);
      if (next) {
        setSnapshot({
          coverage: Array.isArray(next.coverage) ? next.coverage : [],
          pending: Array.isArray(next.pending) ? next.pending : [],
          coverageSummary:
            next.coverageSummary || {
              seenCount: 0,
              totalCount: 0,
              remainingCount: 0,
              percentage: 0,
            },
        });
        setLoadError(null);
      }
      return next;
    } catch (error) {
      setLoadError('Impossibile leggere i dati di addestramento.');
      return null;
    }
  }, [backupAdapter, canRead, questionBank, storageAdapter]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (canRead) {
        await refreshSnapshot();
      }
      if (!cancelled) setStatus('idle');
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [canRead, refreshSnapshot]);

  const openRepo = () => {
    Linking.openURL(REPO_URL);
  };

  const handleExport = useCallback(async () => {
    if (status !== 'idle' || !canExport) return;
    setStatus('exporting');
    try {
      const current =
        (await refreshSnapshot()) ||
        snapshot;
      const result = await backupAdapter.exportData({
        coverage: current.coverage,
        pending: current.pending,
        bank: questionBank,
      });
      if (result && result.ok) {
        showMessage(MESSAGES.exportSuccess);
      } else if (result && result.error === 'SHARING_UNAVAILABLE') {
        showMessage(MESSAGES.sharingUnavailable);
      } else {
        showMessage(MESSAGES.exportFailed);
      }
    } catch (error) {
      showMessage(MESSAGES.exportFailed);
    } finally {
      setStatus('idle');
    }
  }, [
    backupAdapter,
    canExport,
    questionBank,
    refreshSnapshot,
    snapshot,
    status,
  ]);

  const handleImport = useCallback(async () => {
    if (status !== 'idle' || !canImport) return;
    setStatus('importing');
    try {
      const picked = await backupAdapter.pickImportFile();
      if (!picked || picked.canceled) return;
      if (picked.error) {
        showMessage(importErrorMessage(picked.error));
        return;
      }

      const result = await backupAdapter.importData({
        text: picked.text,
        bank: questionBank,
        storage: storageAdapter,
      });

      if (result && result.ok) {
        const pendingTouched =
          (result.pendingAdded || 0) + (result.pendingUpdated || 0);
        const summary = result.coverageSummary || {
          seenCount: 0,
          totalCount: 0,
          percentage: 0,
        };
        Alert.alert(
          'Importazione completata',
          `Aggiunte ${result.coverageAdded || 0} domande alla copertura e ${pendingTouched} voci di ripasso. Copertura: ${summary.percentage || 0}% (${summary.seenCount || 0} di ${summary.totalCount || 0}).`
        );
        await refreshSnapshot();
      } else {
        showMessage(importErrorMessage(result && result.error));
      }
    } catch (error) {
      showMessage(MESSAGES.importWriteFailed);
    } finally {
      setStatus('idle');
    }
  }, [
    backupAdapter,
    canImport,
    questionBank,
    refreshSnapshot,
    status,
    storageAdapter,
  ]);

  const coverageSummary = snapshot.coverageSummary;
  const pendingCount = snapshot.pending.length;
  const busy = status === 'exporting' || status === 'importing';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Informazioni"
        subtitle="Simulatore Esame VDS · v2.0.0"
        onBack={onReturnToMenu}
        backLabel="Indietro"
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="Simulatore Esame VDS">
          <Text style={styles.cardSubtitle}>MULTIASSI — ALA FISSA</Text>
          <Text style={styles.cardText}>
            Applicazione open-source per la simulazione dell'esame VDS (Volo da
            Diporto o Sportivo). Le 882 domande sono state estratte
            dall'applicazione Java originale e organizzate in 9 categorie.
          </Text>
          <Text style={styles.cardText}>
            Totale: 70 domande per simulazione, distribuite come segue:
            10+10+12+12+4+4+6+6+6. Soglia di superamento: massimo 7 errori
            (≤10%).
          </Text>
        </SectionCard>

        <SectionCard title="Codice sorgente">
          <Text style={styles.cardText}>
            Il progetto è pubblicato su GitHub. Puoi consultare il codice
            sorgente, segnalare problemi o contribuire direttamente.
          </Text>
          <TouchableOpacity
            style={styles.repoButton}
            onPress={openRepo}
            accessibilityRole="link"
            accessibilityLabel="Apri il repository GitHub"
          >
            <Text style={styles.repoButtonText}>
              github.com/b0sh-net/vdsexamapp
            </Text>
            <Text style={styles.repoButtonArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Licenza">
          <Text style={styles.cardText}>
            Questo software è distribuito con licenza{' '}
            <Text style={styles.bold}>GNU General Public License v3.0</Text>.
          </Text>
          <Text style={styles.cardText}>
            Sei libero di usare, modificare e distribuire il software, a
            condizione che qualsiasi opera derivata venga rilasciata con la
            stessa licenza. È necessario includere una copia della licenza e
            documentare le modifiche apportate.
          </Text>
        </SectionCard>

        <SectionCard title="Progetto no-profit">
          <Text style={styles.cardText}>
            Questo progetto è realizzato e distribuito{' '}
            <Text style={styles.bold}>senza scopo di lucro</Text>. Non vi è
            alcuna finalità commerciale e non viene raccolto alcun compenso per
            il suo utilizzo.
          </Text>
        </SectionCard>

        <SectionCard title="Avviso importante" tone="warning">
          <Text style={styles.disclaimerText}>
            Questo software viene fornito{' '}
            <Text style={styles.bold}>"COSÌ COM'È"</Text>, senza alcuna
            garanzia, esplicita o implicita, sul suo buon funzionamento,
            accuratezza delle domande o idoneità a uno scopo particolare.
          </Text>
          <Text style={styles.disclaimerText}>
            Gli autori e i contributori non si assumono alcuna responsabilità
            per eventuali errori, omissioni o malfunzionamenti. L'utilizzo
            dell'applicazione è a esclusivo rischio dell'utente. Si consiglia
            di verificare sempre le informazioni con fonti ufficiali ENAC /
            ENAV.
          </Text>
        </SectionCard>

        <SectionCard title="Dati di addestramento">
          {status === 'loading' ? (
            <View style={styles.trainingLoading} testID="info-training-loading">
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={styles.trainingLoadingText}>Caricamento...</Text>
            </View>
          ) : loadError ? (
            <Text style={styles.trainingError} testID="info-training-error">
              {loadError}
            </Text>
          ) : (
            <>
              <Text style={styles.trainingText} testID="info-training-coverage">
                {`Copertura: ${coverageSummary.percentage || 0}% (${coverageSummary.seenCount || 0} di ${coverageSummary.totalCount || 0} domande)`}
              </Text>
              <Text style={styles.trainingText} testID="info-training-pending">
                {pendingCount === 1
                  ? 'Da recuperare: 1 domanda'
                  : `Da recuperare: ${pendingCount} domande`}
              </Text>
            </>
          )}

          <View style={styles.trainingButtonsRow}>
            <AppButton
              label={status === 'exporting' ? 'Esportazione...' : 'Esporta dati'}
              variant="secondary"
              size="sm"
              onPress={handleExport}
              disabled={busy || status === 'loading' || !canExport}
              testID="info-export-data"
              style={styles.trainingButton}
            />
            <AppButton
              label={status === 'importing' ? 'Importazione...' : 'Importa dati'}
              variant="secondary"
              size="sm"
              onPress={handleImport}
              disabled={busy || status === 'loading' || !canImport}
              testID="info-import-data"
              style={styles.trainingButton}
            />
          </View>

          <Text style={styles.trainingHint}>
            Esporta copertura e domande da recuperare in un file. Importa un
            file esportato da un altro dispositivo o da un backup.
          </Text>
        </SectionCard>

        <Text style={styles.footer}>Versione 2.0.0 — 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPadding,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.card || {}),
  },
  cardWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: 'rgba(185,119,14,0.28)',
  },
  sectionBar: {
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginBottom: spacing.sm,
  },
  sectionBarWarning: {
    backgroundColor: colors.warningStrong,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  cardTitleWarning: {
    color: '#8A5A0B',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.accent,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  repoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xxs,
  },
  repoButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand,
  },
  repoButtonArrow: {
    color: colors.textMuted,
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#6B4A10',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  trainingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trainingLoadingText: {
    marginLeft: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
  },
  trainingError: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  trainingText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.xxs,
  },
  trainingButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  trainingButton: {
    flex: 1,
  },
  trainingHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSubtle,
    lineHeight: 18,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
});
