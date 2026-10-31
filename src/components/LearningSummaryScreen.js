import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';

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

export default function LearningSummaryScreen({
  summary,
  onReturnToMenu,
  onStartNewSession,
}) {
  const hasSummary = summary && typeof summary === 'object';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riepilogo Apprendimento</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onReturnToMenu}
          testID="summary-header-menu"
          accessibilityRole="button"
        >
          <Text style={styles.menuButtonText}>MENU</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {hasSummary ? (
          <>
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

            <TouchableOpacity
              style={styles.newSessionButton}
              onPress={onStartNewSession}
              testID="summary-new-session"
              accessibilityRole="button"
            >
              <Text style={styles.newSessionButtonText}>Nuova sessione</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nessun riepilogo disponibile</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.returnButton}
          onPress={onReturnToMenu}
          testID="summary-return-menu"
          accessibilityRole="button"
        >
          <Text style={styles.returnButtonText}>Torna al menu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a4d7a',
    paddingTop: Platform.OS === 'android' ? 35 : 45,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
  },
  menuButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  body: {
    padding: 15,
    paddingBottom: Platform.OS === 'android' ? 25 : 15,
  },
  cardsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  highlightCard: {
    backgroundColor: '#fff8e7',
    borderColor: '#f39c12',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a4d7a',
    marginBottom: 6,
  },
  highlightValue: {
    color: '#b9770e',
  },
  cardLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    lineHeight: 16,
  },
  note: {
    backgroundColor: '#e8f4fc',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    marginBottom: 18,
  },
  noteText: {
    fontSize: 13,
    color: '#1a4d7a',
    lineHeight: 19,
    textAlign: 'center',
  },
  newSessionButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  newSessionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  returnButton: {
    backgroundColor: '#1a4d7a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
});
