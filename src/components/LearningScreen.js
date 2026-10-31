import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import questionsData from '../data/questions.json';
import figureMap from '../utils/figureMap';
import learningStorage, { STORAGE_WARNING } from '../utils/learningStorage';
import {
  createSession,
  drawNextQuestion,
  answerCurrent,
  getSessionSummary,
  getQuestionOptions,
} from '../utils/learningEngine';

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
      let warning = null;
      try {
        const stored = await storageAdapter.loadPending(questionBank);
        if (stored) {
          if (Array.isArray(stored.pending)) pending = stored.pending;
          warning = stored.warning || null;
        }
      } catch (error) {
        warning = STORAGE_WARNING;
      }

      if (cancelled) return;

      const base = createSession({ bank: questionBank, pending });
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
  }, [session, storageWarning, persistPending]);

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
          <ActivityIndicator size="large" color="#1a4d7a" />
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
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Apprendimento</Text>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
            testID="learning-finish-button"
            accessibilityRole="button"
            accessibilityLabel="Termina la sessione di apprendimento"
          >
            <Text style={styles.finishButtonText}>Termina</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.answeredCount}>
            {'Domande affrontate: '}
            {session.answeredCount}
          </Text>
          <Text style={styles.pendingCount} testID="learning-pending-count">
            {'Da ripassare: '}
            {session.pending.length}
          </Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.groupLabel}>
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
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {storageWarning && (
          <View style={styles.warningBanner} testID="learning-storage-warning">
            <Text style={styles.warningText}>{storageWarning}</Text>
          </View>
        )}

        {session.phase === 'exhausted' || !current ? (
          <View style={styles.exhaustedBox}>
            <Text style={styles.exhaustedTitle}>Archivio esaurito</Text>
            <Text style={styles.exhaustedText} testID="learning-exhausted">
              {EXHAUSTED_MESSAGE}
            </Text>
          </View>
        ) : (
          <>
            {current.question.figura > 0 &&
              figureMap[current.question.figura] && (
                <View style={styles.figureContainer}>
                  <Image
                    source={figureMap[current.question.figura]}
                    style={styles.figureImage}
                    resizeMode="contain"
                  />
                </View>
              )}

            <Text style={styles.questionText} testID="learning-question-text">
              {current.question.domanda}
            </Text>

            <View style={styles.answersContainer}>
              {options.map((option) => {
                const isCorrectOption =
                  isFeedback && option.key === feedback.correctAnswer;
                const isWrongSelection =
                  isFeedback &&
                  !feedback.correct &&
                  option.key === feedback.selectedAnswer;

                return (
                  <TouchableOpacity
                    key={option.key}
                    testID={`learning-option-${option.key}`}
                    style={[
                      styles.answerOption,
                      isCorrectOption && styles.correctOption,
                      isWrongSelection && styles.wrongOption,
                    ]}
                    onPress={() => handleSelect(option.key)}
                    disabled={isFeedback}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.key}) ${option.text}`}
                    accessibilityState={{ disabled: isFeedback }}
                  >
                    <Text
                      style={[
                        styles.answerLabel,
                        isCorrectOption && styles.correctOptionText,
                        isWrongSelection && styles.wrongOptionText,
                      ]}
                    >
                      {option.key}
                    </Text>
                    <Text
                      style={[
                        styles.answerText,
                        isCorrectOption && styles.correctOptionText,
                        isWrongSelection && styles.wrongOptionText,
                      ]}
                    >
                      {option.text}
                    </Text>
                  </TouchableOpacity>
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
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {session.phase === 'feedback' ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            testID="learning-next-button"
            accessibilityRole="button"
          >
            <Text style={styles.nextButtonText}>Avanti</Text>
          </TouchableOpacity>
        ) : session.phase === 'exhausted' ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleFinish}
            testID="learning-finish-session-button"
            accessibilityRole="button"
          >
            <Text style={styles.nextButtonText}>Termina sessione</Text>
          </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#1a4d7a',
  },
  header: {
    backgroundColor: '#1a4d7a',
    paddingTop: Platform.OS === 'android' ? 35 : 45,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  finishButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  answeredCount: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  pendingCount: {
    fontSize: 14,
    color: '#f5c542',
    fontWeight: '500',
  },
  groupLabel: {
    fontSize: 13,
    color: '#a0c8e0',
    fontStyle: 'italic',
  },
  reviewBadge: {
    backgroundColor: '#f39c12',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  reviewBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 15,
  },
  warningBanner: {
    backgroundColor: '#fdf3d8',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    padding: 10,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 6,
  },
  warningText: {
    color: '#8a6d1b',
    fontSize: 13,
    lineHeight: 18,
  },
  exhaustedBox: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  exhaustedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d7a',
    marginBottom: 10,
  },
  exhaustedText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  figureContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e8f4fc',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  figureImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    fontWeight: '500',
  },
  answersContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  answerOption: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  correctOption: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2ecc71',
    borderWidth: 2,
  },
  wrongOption: {
    backgroundColor: '#fdecea',
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 20,
    marginRight: 10,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  correctOptionText: {
    color: '#1e7e34',
    fontWeight: '500',
  },
  wrongOptionText: {
    color: '#a93226',
    fontWeight: '500',
  },
  feedbackBanner: {
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    padding: 14,
  },
  feedbackCorrect: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 5,
    borderLeftColor: '#2ecc71',
  },
  feedbackWrong: {
    backgroundColor: '#fdecea',
    borderLeftWidth: 5,
    borderLeftColor: '#e74c3c',
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  correctAnswerText: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 25 : 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    backgroundColor: '#1a4d7a',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerHint: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerHintText: {
    fontSize: 13,
    color: '#999',
  },
});
