import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import {
  generateRandomExam,
  calculateResults,
  getCategoryForIndex,
} from '../utils/questionSelector';
import figureMap from '../utils/figureMap';

export default function ExamScreen({ onFinish_exam }) {
  const [examQuestions, setExamQuestions] = useState(generateRandomExam);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = useMemo(
    () => examQuestions[currentQuestionIndex],
    [examQuestions, currentQuestionIndex]
  );

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 100, fontSize: 18, color: '#333' }}>
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
      <TouchableOpacity
        key={key}
        style={[styles.answerOption, isSelected && styles.selectedAnswer]}
        onPress={() => handleAnswerSelect(key)}
      >
        <Text
          style={[styles.answerLabel, isSelected && styles.selectedAnswerLabel]}
        >
          {key}
        </Text>
        <Text style={[styles.answerText, isSelected && styles.selectedAnswerText]}>
          {answerText}
        </Text>
      </TouchableOpacity>
    );
  };

  const category = getCategoryForIndex(currentQuestionIndex);
  const answeredCount = useMemo(
    () => examQuestions.filter((q) => q.userAnswer !== 'X').length,
    [examQuestions]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Esame VDS</Text>
          <Text style={styles.answeredCount}>
            Risposte: {answeredCount}/{totalQuestions}
          </Text>
        </View>
        <View style={styles.questionInfo}>
          <Text style={styles.questionNumber}>
            Domanda {currentQuestionIndex + 1}/{totalQuestions}
          </Text>
          <Text style={styles.questionCategory}>{category}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.questionContainer}>
        {currentQuestion.figura > 0 && figureMap[currentQuestion.figura] && (
          <View style={styles.figureContainer}>
            <Image
              source={figureMap[currentQuestion.figura]}
              style={styles.figureImage}
              resizeMode="contain"
            />
          </View>
        )}

        <Text style={styles.questionText}>{currentQuestion.domanda}</Text>

        <View style={styles.answersContainer}>
          {renderAnswerOption('A', currentQuestion.risposta_a)}
          {renderAnswerOption('B', currentQuestion.risposta_b)}
          {currentQuestion.num_risposte >= 3 &&
            renderAnswerOption('C', currentQuestion.risposta_c)}
          {currentQuestion.num_risposte === 4 &&
            renderAnswerOption('D', currentQuestion.risposta_d)}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={styles.navButtonText}>{'\u2039'} PRECEDENTE</Text>
        </TouchableOpacity>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>SUCCESSIVA {'\u203A'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitExam}
          >
            <Text style={styles.submitButtonText}>TERMINA ESAME</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#1a4d7a',
    paddingTop: 20,
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
  answeredCount: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  questionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  questionCategory: {
    fontSize: 13,
    color: '#a0c8e0',
    fontStyle: 'italic',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 2,
  },
  questionContainer: {
    flex: 1,
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
  figureLabel: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
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
  selectedAnswer: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 20,
    marginRight: 10,
  },
  selectedAnswerLabel: {
    color: '#2E7D32',
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  selectedAnswerText: {
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 25 : 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    backgroundColor: '#1a4d7a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#b0c4d8',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1.2,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
