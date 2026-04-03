import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function ResultsScreen({
  examData,
  examResults,
  onReturnToMenu,
}) {
  const risposteErrate = useMemo(
    () =>
      examData.filter(
        (q) => q.userAnswer !== 'X' && q.userAnswer !== q.esatta
      ),
    [examData]
  );

  const nonRisposte = useMemo(
    () => examData.filter((q) => q.userAnswer === 'X'),
    [examData]
  );

  const risposteDate = useMemo(
    () => examData.filter((q) => q.userAnswer !== 'X').length,
    [examData]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Esito Esame</Text>
        <TouchableOpacity style={styles.backButton} onPress={onReturnToMenu}>
          <Text style={styles.backButtonText}>MENU</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Risultato */}
        <View
          style={[
            styles.resultBox,
            examResults.passed
              ? { backgroundColor: '#e8f5e9', borderColor: '#4CAF50' }
              : { backgroundColor: '#ffebee', borderColor: '#f44336' },
          ]}
        >
          <Text
            style={[
              styles.resultText,
              examResults.passed
                ? { color: '#2E7D32' }
                : { color: '#C62828' },
            ]}
          >
            {examResults.passed ? 'IDONEO' : 'NON IDONEO'}
          </Text>
        </View>

        {/* Statistiche */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{examResults.corrette}</Text>
            <Text style={styles.statLabel}>Corrette</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{examResults.errate}</Text>
            <Text style={styles.statLabel}>Errate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{examResults.nonRisposte}</Text>
            <Text style={styles.statLabel}>Non risposte</Text>
          </View>
        </View>

        {/* Riepilogo */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            Totale domande: {examResults.total}
          </Text>
          <Text style={styles.summaryText}>
            Errori massimi consentiti: {examResults.maxErrors}
          </Text>
          <Text style={styles.summaryText}>
            Risposte date: {risposteDate}
          </Text>
        </View>

        {/* Revisione risposte errate */}
        {(risposteErrate.length > 0 || nonRisposte.length > 0) && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>
              Revisione risposte errate:
            </Text>

            {/* Risposte errate */}
            {risposteErrate.map((question, index) => (
              <View key={`err-${index}`} style={styles.reviewItem}>
                <Text style={styles.reviewQuestion}>
                  {question.questionIndex + 1}) {question.domanda}
                </Text>
                {question.figura > 0 && (
                  <Text style={styles.reviewFigure}>
                    [Figura {question.figura}]
                  </Text>
                )}
                <Text style={styles.reviewOptions}>
                  A) {question.risposta_a}{'\n'}
                  B) {question.risposta_b}{'\n'}
                  {question.num_risposte >= 3 &&
                    `C) ${question.risposta_c}\n`}
                  {question.num_risposte === 4 &&
                    `D) ${question.risposta_d}\n`}
                </Text>
                <Text style={styles.reviewAnswer}>
                  Risposta data:{' '}
                  <Text style={styles.wrongAnswer}>
                    {question.userAnswer}
                  </Text>{' '}
                  - Risposta esatta:{' '}
                  <Text style={styles.correctAnswer}>
                    {question.esatta}
                  </Text>
                </Text>
              </View>
            ))}

            {/* Non risposte */}
            {nonRisposte.map((question, index) => (
              <View
                key={`nr-${index}`}
                style={[styles.reviewItem, { opacity: 0.7 }]}
              >
                <Text style={styles.reviewQuestion}>
                  {question.questionIndex + 1}) {question.domanda}
                </Text>
                <Text style={styles.unansweredText}>
                  Non risposta - Risposta esatta:{' '}
                  <Text style={styles.correctAnswer}>
                    {question.esatta}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultBox: {
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    marginHorizontal: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d7a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  reviewSection: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 15,
  },
  reviewItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reviewQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  reviewFigure: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 5,
  },
  reviewOptions: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
    lineHeight: 18,
  },
  reviewAnswer: {
    fontSize: 14,
  },
  wrongAnswer: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  correctAnswer: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  unansweredText: {
    fontSize: 14,
    color: '#999',
  },
});
