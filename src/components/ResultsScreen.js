import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AnswerOption from './ui/AnswerOption';
import ScreenHeader, { HeaderAction } from './ui/ScreenHeader';
import { colors, layout, radii, spacing, shadows } from '../theme';
import useAppInsets from '../hooks/useAppInsets';

const OPTION_FIELDS = {
  A: 'risposta_a',
  B: 'risposta_b',
  C: 'risposta_c',
  D: 'risposta_d',
};

function StatTile({ value, label, tone }) {
  return (
    <View style={styles.statTile}>
      <Text
        style={[
          styles.statValue,
          tone === 'success' && styles.statValueSuccess,
          tone === 'danger' && styles.statValueDanger,
          tone === 'muted' && styles.statValueMuted,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value, last }) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function ReviewItem({ question, type }) {
  const isWrong = type === 'wrong';
  const optionKeys = ['A', 'B', 'C', 'D'].slice(0, question.num_risposte || 2);

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewNumber}>
          <Text style={styles.reviewNumberText}>{question.questionIndex + 1}</Text>
        </View>
        <View
          style={[
            styles.reviewBadge,
            isWrong ? styles.reviewBadgeWrong : styles.reviewBadgeMuted,
          ]}
        >
          <Text
            style={[
              styles.reviewBadgeText,
              isWrong ? styles.reviewBadgeTextWrong : styles.reviewBadgeTextMuted,
            ]}
          >
            {isWrong ? 'Errata' : 'Non risposta'}
          </Text>
        </View>
      </View>

      <Text style={styles.reviewQuestion}>{question.domanda}</Text>
      {question.figura > 0 ? (
        <Text style={styles.reviewFigure}>Figura {question.figura}</Text>
      ) : null}

      <View style={styles.reviewOptions}>
        {optionKeys.map((key) => {
          const state =
            key === question.esatta
              ? 'correct'
              : isWrong && key === question.userAnswer
                ? 'wrong'
                : 'default';

          return (
            <AnswerOption
              key={key}
              label={key}
              text={question[OPTION_FIELDS[key]]}
              state={state}
              disabled
              accessibilityState={{ disabled: true }}
            />
          );
        })}
      </View>

      <View style={styles.reviewFooter}>
        {isWrong ? (
          <Text style={styles.reviewWrong}>
            La tua risposta: {question.userAnswer}
          </Text>
        ) : (
          <Text style={styles.reviewUnanswered}>Nessuna risposta</Text>
        )}
        <Text style={styles.reviewCorrect}>
          Corretta: {question.esatta}
        </Text>
      </View>
    </View>
  );
}

export default function ResultsScreen({
  examData,
  examResults,
  onReturnToMenu,
}) {
  const { bottom } = useAppInsets();
  const questions = examData || [];

  const risposteErrate = useMemo(
    () =>
      questions.filter(
        (q) => q.userAnswer !== 'X' && q.userAnswer !== q.esatta
      ),
    [questions]
  );

  const nonRisposte = useMemo(
    () => questions.filter((q) => q.userAnswer === 'X'),
    [questions]
  );

  const risposteDate = useMemo(
    () => questions.filter((q) => q.userAnswer !== 'X').length,
    [questions]
  );

  if (!examData || !examResults) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun risultato disponibile.</Text>
      </View>
    );
  }

  const totalErrors = risposteErrate.length + nonRisposte.length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Esito Esame"
        right={
          <HeaderAction label="Menu" onPress={onReturnToMenu} />
        }
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Esito */}
        <View
          style={[
            styles.resultHero,
            examResults.passed ? styles.resultPassed : styles.resultFailed,
          ]}
        >
          <View
            style={[
              styles.resultIcon,
              examResults.passed ? styles.resultIconPassed : styles.resultIconFailed,
            ]}
          >
            <Text
              style={[
                styles.resultIconGlyph,
                examResults.passed
                  ? styles.resultIconGlyphPassed
                  : styles.resultIconGlyphFailed,
              ]}
            >
              {examResults.passed ? '\u2713' : '\u2715'}
            </Text>
          </View>
          <Text style={styles.resultEyebrow}>ESITO FINALE</Text>
          <Text
            style={[
              styles.resultText,
              examResults.passed
                ? styles.resultTextPassed
                : styles.resultTextFailed,
            ]}
          >
            {examResults.passed ? 'IDONEO' : 'NON IDONEO'}
          </Text>
          <Text style={styles.resultHint}>
            {examResults.passed
              ? 'Hai superato la simulazione d\u2019esame.'
              : `Hai superato la soglia di ${examResults.maxErrors} errori consentiti.`}
          </Text>
        </View>

        {/* Statistiche */}
        <View style={styles.statsRow}>
          <StatTile
            value={examResults.corrette}
            label="Corrette"
            tone="success"
          />
          <StatTile value={examResults.errate} label="Errate" tone="danger" />
          <StatTile
            value={examResults.nonRisposte}
            label="Non risposte"
            tone="muted"
          />
        </View>

        {/* Riepilogo */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Riepilogo</Text>
          <SummaryRow label="Totale domande" value={examResults.total} />
          <SummaryRow
            label="Errori massimi consentiti"
            value={examResults.maxErrors}
          />
          <SummaryRow label="Risposte date" value={risposteDate} last />
        </View>

        {/* Revisione */}
        {totalErrors > 0 ? (
          <View style={styles.reviewSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Revisione</Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{totalErrors}</Text>
              </View>
            </View>

            {risposteErrate.map((question) => (
              <ReviewItem
                key={`err-${question.questionIndex}`}
                question={question}
                type="wrong"
              />
            ))}

            {nonRisposte.map((question) => (
              <ReviewItem
                key={`nr-${question.questionIndex}`}
                question={question}
                type="unanswered"
              />
            ))}
          </View>
        ) : (
          <View style={styles.perfectCard}>
            <Text style={styles.perfectTitle}>Nessun errore da rivedere</Text>
            <Text style={styles.perfectText}>
              Hai risposto correttamente a tutte le domande della simulazione.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPadding,
  },
  resultHero: {
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  resultPassed: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(18,128,92,0.28)',
  },
  resultFailed: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(217,45,32,0.24)',
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultIconPassed: {
    backgroundColor: 'rgba(18,128,92,0.14)',
  },
  resultIconFailed: {
    backgroundColor: 'rgba(217,45,32,0.12)',
  },
  resultIconGlyph: {
    fontSize: 25,
    fontWeight: '700',
  },
  resultIconGlyphPassed: {
    color: colors.success,
  },
  resultIconGlyphFailed: {
    color: colors.danger,
  },
  resultEyebrow: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
  },
  resultText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  resultTextPassed: {
    color: colors.success,
  },
  resultTextFailed: {
    color: colors.danger,
  },
  resultHint: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...(shadows.card || {}),
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statValueSuccess: {
    color: colors.success,
  },
  statValueDanger: {
    color: colors.danger,
  },
  statValueMuted: {
    color: colors.textSubtle,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    ...(shadows.card || {}),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 1,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewSection: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionCount: {
    minWidth: 24,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionCountText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.card || {}),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewNumberText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
  },
  reviewBadgeWrong: {
    backgroundColor: colors.dangerSoft,
  },
  reviewBadgeMuted: {
    backgroundColor: colors.surfaceAlt,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  reviewBadgeTextWrong: {
    color: colors.danger,
  },
  reviewBadgeTextMuted: {
    color: colors.textSubtle,
  },
  reviewQuestion: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  reviewFigure: {
    color: colors.textSubtle,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -spacing.xxs,
    marginBottom: spacing.sm,
  },
  reviewOptions: {
    marginTop: spacing.xxs,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewWrong: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewUnanswered: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCorrect: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  perfectCard: {
    marginTop: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(18,128,92,0.24)',
    padding: spacing.lg,
    alignItems: 'center',
  },
  perfectTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
  },
  perfectText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
