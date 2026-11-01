import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {
  generateRandomExam,
  calculateResults,
  getCategoryForIndex,
} from '../utils/questionSelector';
import figureMap from '../utils/figureMap';
import AnswerOption from './ui/AnswerOption';
import AppButton from './ui/AppButton';
import ScreenHeader from './ui/ScreenHeader';
import { colors, layout, radii, spacing } from '../theme';
import useAppInsets from '../hooks/useAppInsets';

export default function ExamScreen({ onFinish_exam }) {
  const [examQuestions, setExamQuestions] = useState(generateRandomExam);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { bottom } = useAppInsets();

  const currentQuestion = useMemo(
    () => examQuestions[currentQuestionIndex],
    [examQuestions, currentQuestionIndex]
  );

  if (!currentQuestion) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nessuna domanda disponibile. Verificare i dati dell'esame.
        </Text>
      </View>
    );
  }

  const totalQuestions = examQuestions.length;

  const handleAnswerSelect = useCallback(
    (answerKey) => {
      setExamQuestions((prev) => {
        const updated = [...prev];
        const currentQ = { ...updated[currentQuestionIndex] };

        if (currentQ.userAnswer === answerKey) {
          currentQ.userAnswer = 'X'; // Toggle off = non risposto
        } else {
          currentQ.userAnswer = answerKey;
        }

        updated[currentQuestionIndex] = currentQ;
        return updated;
      });
    },
    [currentQuestionIndex]
  );

  const handleNext = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const handlePrevious = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const finishExam = useCallback(() => {
    const results = calculateResults(examQuestions);
    onFinish_exam(examQuestions, results);
  }, [examQuestions, onFinish_exam]);

  const handleSubmitExam = useCallback(() => {
    const unanswered = examQuestions.filter(
      (q) => q.userAnswer === 'X'
    ).length;

    if (unanswered > 0) {
      Alert.alert(
        'ATTENZIONE',
        `Hai ${unanswered} domanda/e senza risposta. Vuoi terminare comunque?`,
        [
          { text: 'ANNULLA', style: 'cancel' },
          {
            text: 'TERMINA',
            onPress: finishExam,
            style: 'destructive',
          },
        ]
      );
    } else {
      finishExam();
    }
  }, [examQuestions, finishExam]);

  const renderAnswerOption = (key, answerText) => {
    const isSelected = currentQuestion.userAnswer === key;
    return (
      <AnswerOption
        key={key}
        label={key}
        text={answerText}
        state={isSelected ? 'selected' : 'default'}
        onPress={() => handleAnswerSelect(key)}
      />
    );
  };

  const category = getCategoryForIndex(currentQuestionIndex);
  const answeredCount = useMemo(
    () => examQuestions.filter((q) => q.userAnswer !== 'X').length,
    [examQuestions]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Esame VDS"
        right={
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {`Risposte: ${answeredCount}/${totalQuestions}`}
            </Text>
          </View>
        }
      >
        <View style={styles.metaRow}>
          <Text style={styles.questionNumber}>
            {`Domanda ${currentQuestionIndex + 1}/${totalQuestions}`}
          </Text>
          <Text style={styles.questionCategory} numberOfLines={1}>
            {category}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              },
            ]}
          />
        </View>
      </ScreenHeader>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {currentQuestion.figura > 0 && figureMap[currentQuestion.figura] && (
          <View style={styles.figureCard}>
            <Image
              source={figureMap[currentQuestion.figura]}
              style={styles.figureImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.domanda}</Text>
        </View>

        <View style={styles.answersContainer}>
          {renderAnswerOption('A', currentQuestion.risposta_a)}
          {renderAnswerOption('B', currentQuestion.risposta_b)}
          {currentQuestion.num_risposte >= 3 &&
            renderAnswerOption('C', currentQuestion.risposta_c)}
          {currentQuestion.num_risposte === 4 &&
            renderAnswerOption('D', currentQuestion.risposta_d)}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom }]}>
        <AppButton
          label="Precedente"
          icon={'\u2039'}
          variant="secondary"
          size="md"
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          style={styles.footerButton}
        />

        {currentQuestionIndex < totalQuestions - 1 ? (
          <AppButton
            label="Successiva"
            variant="primary"
            size="md"
            onPress={handleNext}
            style={styles.footerButton}
          />
        ) : (
          <AppButton
            label="Termina esame"
            variant="danger"
            size="md"
            onPress={handleSubmitExam}
            style={styles.footerButton}
          />
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
    lineHeight: 24,
  },
  counterPill: {
    backgroundColor: colors.onBrandFaint,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  counterText: {
    color: colors.onBrand,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  questionNumber: {
    color: colors.onBrand,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  questionCategory: {
    flexShrink: 1,
    marginLeft: spacing.md,
    color: colors.onBrandMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5CB3FF',
    borderRadius: radii.pill,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: layout.screenPadding,
    paddingBottom: spacing.xl,
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
  footer: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
