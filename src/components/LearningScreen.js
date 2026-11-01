import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import questionsData from '../data/questions.json';
import figureMap from '../utils/figureMap';
import learningStorage, {
  STORAGE_WARNING,
  COVERAGE_WARNING,
} from '../utils/learningStorage';
import {
  createSession,
  drawNextQuestion,
  answerCurrent,
  getSessionSummary,
  getQuestionOptions,
} from '../utils/learningEngine';
import AnswerOption from './ui/AnswerOption';
import AppButton from './ui/AppButton';
import ScreenHeader, { HeaderAction } from './ui/ScreenHeader';
import { colors, layout, radii, spacing, shadows } from '../theme';
import useAppInsets from '../hooks/useAppInsets';

const EXHAUSTED_MESSAGE =
  'Nessuna domanda disponibile. Termina la sessione per vedere il riepilogo.';

export default function LearningScreen({
  onFinish_learning,
  questionBank = questionsData,
  storageAdapter = learningStorage,
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageWarning, setStorageWarning] = useState(null);
  const { bottom } = useAppInsets();
  const answerLock = useRef(false);
  const finishedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let pending = [];
      let coverage = [];
      let warning = null;

      const pendingLoad = (async () => {
        try {
          const stored = await storageAdapter.loadPending(questionBank);
          if (stored) {
            if (Array.isArray(stored.pending)) pending = stored.pending;
            if (stored.warning) warning = stored.warning;
          }
        } catch (error) {
          warning = STORAGE_WARNING;
        }
      })();

      const coverageLoad = (async () => {
        if (typeof storageAdapter.loadCoverage !== 'function') return;
        try {
          const stored = await storageAdapter.loadCoverage(questionBank);
          if (stored) {
            if (Array.isArray(stored.coverage)) coverage = stored.coverage;
            if (stored.warning && !warning) warning = stored.warning;
          }
        } catch (error) {
          if (!warning) warning = COVERAGE_WARNING;
        }
      })();

      await Promise.all([pendingLoad, coverageLoad]);

      if (cancelled) return;

      const base = createSession({ bank: questionBank, pending, coverage });
      const drawn = drawNextQuestion(base);
      answerLock.current = false;

      if (drawn.pendingRevisionChanged) {
        storageAdapter
          .savePending(drawn.session.pending)
          .then((result) => {
            if (!cancelled && result && result.warning) {
              setStorageWarning(result.warning);
            }
          })
          .catch(() => {
            if (!cancelled) setStorageWarning(STORAGE_WARNING);
          });
      }

      if (drawn.coverageChanged && typeof storageAdapter.saveCoverage === 'function') {
        storageAdapter
          .saveCoverage(Array.from(drawn.session.coverage.values()))
          .then((result) => {
            if (!cancelled && result && result.warning) {
              setStorageWarning(result.warning);
            }
          })
          .catch(() => {
            if (!cancelled) setStorageWarning(COVERAGE_WARNING);
          });
      }

      setStorageWarning(warning);
      setSession({ ...drawn.session, storageWarning: warning });
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [questionBank, storageAdapter]);

  const persistPending = useCallback(
    async (pending) => {
      try {
        const result = await storageAdapter.savePending(pending);
        if (!mountedRef.current) return;
        if (result && result.warning) setStorageWarning(result.warning);
      } catch (error) {
        if (mountedRef.current) setStorageWarning(STORAGE_WARNING);
      }
    },
    [storageAdapter]
  );

  const persistCoverage = useCallback(
    async (coverage) => {
      if (typeof storageAdapter.saveCoverage !== 'function') return;
      try {
        const result = await storageAdapter.saveCoverage(coverage);
        if (!mountedRef.current) return;
        if (result && result.warning) setStorageWarning(result.warning);
      } catch (error) {
        if (mountedRef.current) setStorageWarning(COVERAGE_WARNING);
      }
    },
    [storageAdapter]
  );

  const handleSelect = useCallback(
    (answerKey) => {
      if (answerLock.current || !session) return;
      if (session.phase !== 'answering') return;

      answerLock.current = true;
      const result = answerCurrent(session, answerKey);

      if (result.error) {
        answerLock.current = false;
        return;
      }

      setSession({ ...result.session, storageWarning });
      if (result.pendingRevisionChanged) {
        persistPending(result.session.pending);
      }
    },
    [session, storageWarning, persistPending]
  );

  const handleNext = useCallback(() => {
    if (!session || session.phase !== 'feedback') return;

    const result = drawNextQuestion(session);
    answerLock.current = false;
    setSession({ ...result.session, storageWarning });

    if (result.pendingRevisionChanged) {
      persistPending(result.session.pending);
    }
    if (result.coverageChanged) {
      persistCoverage(Array.from(result.session.coverage.values()));
    }
  }, [session, storageWarning, persistPending, persistCoverage]);

  const finish = useCallback(() => {
    if (!session || finishedRef.current) return;
    finishedRef.current = true;

    const summary = getSessionSummary(session);
    onFinish_learning({ ...summary, storageWarning: storageWarning || null });
  }, [session, storageWarning, onFinish_learning]);

  const handleFinish = useCallback(() => {
    if (!session) return;

    if (session.answeredCount === 0) {
      finish();
      return;
    }

    Alert.alert(
      'Terminare la sessione di apprendimento?',
      'Il riepilogo mostrera i risultati della sessione.',
      [
        { text: 'ANNULLA', style: 'cancel' },
        { text: 'TERMINA', style: 'destructive', onPress: finish },
      ]
    );
  }, [session, finish]);

  if (loading || !session) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox} testID="learning-loading">
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </View>
    );
  }

  const current = session.current;
  const options = current ? getQuestionOptions(current.question) : [];
  const feedback = current ? current.feedback : null;
  const isFeedback = session.phase === 'feedback' && feedback !== null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Apprendimento"
        right={
          <HeaderAction
            label="Termina"
            onPress={handleFinish}
            testID="learning-finish-button"
            accessibilityLabel="Termina la sessione di apprendimento"
            tone="danger"
          />
        }
      >
        <View style={styles.countersRow}>
          <View style={styles.counterChip}>
            <Text style={styles.counterText}>
              {`Domande affrontate: ${session.answeredCount}`}
            </Text>
          </View>
          <View style={[styles.counterChip, styles.pendingChip]}>
            <Text style={styles.pendingText} testID="learning-pending-count">
              {'Da ripassare: '}
              {session.pending.length}
            </Text>
          </View>
        </View>

        <View style={styles.groupRow}>
          <Text style={styles.groupLabel} numberOfLines={1}>
            {current ? current.groupLabel : 'Sessione conclusa'}
          </Text>
          {current && current.source === 'review' && (
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText} testID="learning-review-label">
                Ripasso
              </Text>
            </View>
          )}
        </View>
      </ScreenHeader>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {storageWarning && (
          <View style={styles.warningBanner} testID="learning-storage-warning">
            <Text style={styles.warningIcon}>!</Text>
            <Text style={styles.warningText}>{storageWarning}</Text>
          </View>
        )}

        {session.phase === 'exhausted' || !current ? (
          <View style={styles.exhaustedCard}>
            <View style={styles.exhaustedIcon}>
              <Text style={styles.exhaustedIconGlyph}>{'\u2713'}</Text>
            </View>
            <Text style={styles.exhaustedTitle}>Archivio esaurito</Text>
            <Text style={styles.exhaustedText} testID="learning-exhausted">
              {EXHAUSTED_MESSAGE}
            </Text>
          </View>
        ) : (
          <>
            {current.question.figura > 0 &&
              figureMap[current.question.figura] && (
                <View style={styles.figureCard}>
                  <Image
                    source={figureMap[current.question.figura]}
                    style={styles.figureImage}
                    resizeMode="contain"
                  />
                </View>
              )}

            <View style={styles.questionCard}>
              <Text style={styles.questionText} testID="learning-question-text">
                {current.question.domanda}
              </Text>
            </View>

            <View style={styles.answersContainer}>
              {options.map((option) => {
                const isCorrectOption =
                  isFeedback && option.key === feedback.correctAnswer;
                const isWrongSelection =
                  isFeedback &&
                  !feedback.correct &&
                  option.key === feedback.selectedAnswer;

                return (
                  <AnswerOption
                    key={option.key}
                    testID={`learning-option-${option.key}`}
                    label={option.key}
                    text={option.text}
                    state={
                      isCorrectOption
                        ? 'correct'
                        : isWrongSelection
                          ? 'wrong'
                          : 'default'
                    }
                    onPress={() => handleSelect(option.key)}
                    disabled={isFeedback}
                    accessibilityLabel={`${option.key}) ${option.text}`}
                    accessibilityState={{ disabled: isFeedback }}
                  />
                );
              })}
            </View>

            {isFeedback && (
              <View
                style={[
                  styles.feedbackBanner,
                  feedback.correct
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong,
                ]}
                testID="learning-feedback"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                <View
                  style={[
                    styles.feedbackIcon,
                    feedback.correct
                      ? styles.feedbackIconCorrect
                      : styles.feedbackIconWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.feedbackIconGlyph,
                      feedback.correct
                        ? styles.feedbackIconGlyphCorrect
                        : styles.feedbackIconGlyphWrong,
                    ]}
                  >
                    {feedback.correct ? '\u2713' : '\u2715'}
                  </Text>
                </View>
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackTitle}>
                    {feedback.correct ? 'Corretto' : 'Sbagliato'}
                  </Text>
                  {!feedback.correct && (
                    <Text
                      style={styles.correctAnswerText}
                      testID="learning-correct-answer"
                    >
                      {'Risposta corretta: '}
                      {feedback.correctAnswer}) {feedback.correctAnswerText}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom }]}>
        {session.phase === 'feedback' ? (
          <AppButton
            label="Avanti"
            variant="primary"
            onPress={handleNext}
            testID="learning-next-button"
            icon={'\u203A'}
          />
        ) : session.phase === 'exhausted' ? (
          <AppButton
            label="Termina sessione"
            variant="primary"
            onPress={handleFinish}
            testID="learning-finish-session-button"
          />
        ) : (
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>
              Seleziona una risposta per continuare
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
  },
  countersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  counterChip: {
    flex: 1,
    backgroundColor: colors.onBrandFaint,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pendingChip: {
    backgroundColor: 'rgba(224,138,0,0.20)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  counterText: {
    color: colors.onBrand,
    fontSize: 12,
    fontWeight: '600',
  },
  pendingText: {
    color: '#FFD08A',
    fontSize: 12,
    fontWeight: '700',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  groupLabel: {
    flexShrink: 1,
    color: colors.onBrandMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  reviewBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.warningStrong,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  reviewBadgeText: {
    color: colors.onBrand,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPadding,
    paddingBottom: spacing.xl,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: 'rgba(185,119,14,0.24)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningIcon: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '800',
    marginRight: spacing.sm,
    marginTop: -1,
  },
  warningText: {
    flex: 1,
    color: '#7A5410',
    fontSize: 13,
    lineHeight: 19,
  },
  exhaustedCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...(shadows.card || {}),
  },
  exhaustedIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  exhaustedIconGlyph: {
    color: colors.success,
    fontSize: 23,
    fontWeight: '700',
  },
  exhaustedTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  exhaustedText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  figureCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  figureImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  questionText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  answersContainer: {
    marginTop: spacing.xxs,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.xxs,
  },
  feedbackCorrect: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(18,128,92,0.26)',
  },
  feedbackWrong: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(217,45,32,0.24)',
  },
  feedbackIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  feedbackIconCorrect: {
    backgroundColor: 'rgba(18,128,92,0.16)',
  },
  feedbackIconWrong: {
    backgroundColor: 'rgba(217,45,32,0.14)',
  },
  feedbackIconGlyph: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackIconGlyphCorrect: {
    color: colors.success,
  },
  feedbackIconGlyphWrong: {
    color: colors.danger,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  correctAnswerText: {
    marginTop: spacing.xxs,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerHint: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerHintText: {
    fontSize: 13,
    color: colors.textSubtle,
  },
});
