import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AppButton from './ui/AppButton';
import ScreenHeader, { HeaderAction } from './ui/ScreenHeader';
import { colors, layout, radii, spacing, shadows } from '../theme';
import useAppInsets from '../hooks/useAppInsets';

function formatValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return String(Math.trunc(numeric));
}

function SummaryCard({ testID, value, label, highlight }) {
  return (
    <View
      style={[styles.card, highlight && styles.highlightCard]}
      testID={`${testID}-card`}
    >
      <View
        style={[styles.cardDot, highlight && styles.highlightDot]}
        accessibilityElementsHidden
      />
      <Text
        style={[styles.cardValue, highlight && styles.highlightValue]}
        testID={testID}
      >
        {formatValue(value)}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

function CoverageSection({ coverage }) {
  const seenCount = Number(coverage.seenCount) || 0;
  const totalCount = Number(coverage.totalCount) || 0;
  const remainingCount = Number(coverage.remainingCount) || 0;
  const rawPercentage = Number(coverage.percentage) || 0;
  const percentage = Math.max(0, Math.min(100, Math.round(rawPercentage)));

  return (
    <View style={styles.coverageCard} testID="summary-coverage">
      <Text style={styles.coverageEyebrow}>COPERTURA ADDESTRAMENTO</Text>
      <Text style={styles.coverageTitle}>Copertura addestramento</Text>
      <Text
        style={styles.coverageValue}
        testID="summary-coverage-percentage"
        accessibilityLabel={`Copertura addestramento: ${percentage} per cento`}
      >
        {`${percentage}%`}
      </Text>
      <Text style={styles.coverageLabel}>
        Copertura dell&apos;archivio domande
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[styles.coverageFill, { width: `${percentage}%` }]}
          testID="summary-coverage-bar"
        />
      </View>

      <View style={styles.coverageStatsRow}>
        <View style={styles.coverageStat}>
          <Text style={styles.coverageStatValue} testID="summary-coverage-seen">
            {formatValue(seenCount)}
          </Text>
          <Text style={styles.coverageStatLabel}>Incontrate</Text>
        </View>
        <View style={styles.coverageStat}>
          <Text style={styles.coverageStatValue} testID="summary-coverage-total">
            {formatValue(totalCount)}
          </Text>
          <Text style={styles.coverageStatLabel}>Totale</Text>
        </View>
        <View style={styles.coverageStat}>
          <Text
            style={styles.coverageStatValue}
            testID="summary-coverage-remaining"
          >
            {formatValue(remainingCount)}
          </Text>
          <Text style={styles.coverageStatLabel}>Da vedere</Text>
        </View>
      </View>
    </View>
  );
}

export default function LearningSummaryScreen({
  summary,
  onReturnToMenu,
  onStartNewSession,
}) {
  const { bottom } = useAppInsets();
  const hasSummary = summary && typeof summary === 'object';

  const totalUnique = hasSummary ? Number(summary.totalUnique) || 0 : 0;
  const firstAttempt = hasSummary
    ? Number(summary.firstAttemptCorrect) || 0
    : 0;
  const accuracy =
    totalUnique > 0
      ? Math.round((firstAttempt / totalUnique) * 100)
      : 0;

  const coverage =
    hasSummary &&
    summary.coverage &&
    typeof summary.coverage === 'object' &&
    Number.isFinite(Number(summary.coverage.totalCount))
      ? summary.coverage
      : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Riepilogo Apprendimento"
        right={
          <HeaderAction
            label="Menu"
            onPress={onReturnToMenu}
            testID="summary-header-menu"
          />
        }
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {hasSummary ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>SESSIONE COMPLETATA</Text>
              <Text style={styles.heroValue}>{accuracy}%</Text>
              <Text style={styles.heroLabel}>
                Risposte corrette al primo tentativo
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${accuracy}%` }]}
                />
              </View>
            </View>

            <View style={styles.cardsRow}>
              <SummaryCard
                testID="summary-total-unique"
                value={summary.totalUnique}
                label="Domande totali (uniche)"
              />
              <SummaryCard
                testID="summary-first-attempt"
                value={summary.firstAttemptCorrect}
                label="Corrette al primo tentativo (uniche)"
              />
            </View>
            <View style={styles.cardsRow}>
              <SummaryCard
                testID="summary-later-corrected"
                value={summary.laterCorrected}
                label="Sbagliate successivamente corrette"
              />
              <SummaryCard
                testID="summary-still-pending"
                value={summary.stillPending}
                label="Sbagliate non ancora corrette"
                highlight={Number(summary.stillPending) > 0}
              />
            </View>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                Le domande non ancora corrette restano salvate sul dispositivo e
                verranno riproposte nelle prossime sessioni.
              </Text>
            </View>

            {coverage && <CoverageSection coverage={coverage} />}

            <AppButton
              label="Nuova sessione"
              variant="accent"
              size="lg"
              onPress={onStartNewSession}
              testID="summary-new-session"
            />
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nessun riepilogo disponibile</Text>
          </View>
        )}

        <AppButton
          label="Torna al menu"
          variant="secondary"
          size="md"
          onPress={onReturnToMenu}
          testID="summary-return-menu"
          style={styles.returnButton}
        />
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...(shadows.card || {}),
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...(shadows.card || {}),
  },
  highlightCard: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningStrong,
  },
  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginBottom: spacing.sm,
  },
  highlightDot: {
    backgroundColor: colors.warningStrong,
  },
  cardValue: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: -0.8,
    marginBottom: spacing.xxs,
  },
  highlightValue: {
    color: colors.warning,
  },
  cardLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '500',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.brand,
    lineHeight: 19,
  },
  coverageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...(shadows.card || {}),
  },
  coverageEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  coverageTitle: {
    marginTop: spacing.xxs,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  coverageValue: {
    marginTop: spacing.sm,
    color: colors.brand,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  coverageLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  coverageFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.success,
  },
  coverageStatsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  coverageStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  coverageStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand,
  },
  coverageStatLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  returnButton: {
    marginTop: spacing.sm,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
