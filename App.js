import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState, useCallback } from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import MainMenu from './src/components/MainMenu';
import ExamScreen from './src/components/ExamScreen';
import ResultsScreen from './src/components/ResultsScreen';
import InfoScreen from './src/components/InfoScreen';
import LearningScreen from './src/components/LearningScreen';
import LearningSummaryScreen from './src/components/LearningSummaryScreen';
import { colors } from './src/theme';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [examData, setExamData] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [learningSummary, setLearningSummary] = useState(null);

  const handleStart_exam = useCallback(() => {
    setCurrentScreen('exam');
  }, []);

  const handleFinish_exam = useCallback((data, results) => {
    setExamData(data);
    setExamResults(results);
    setCurrentScreen('results');
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setExamData(null);
    setExamResults(null);
    setLearningSummary(null);
    setCurrentScreen('menu');
  }, []);

  const handleShow_info = useCallback(() => {
    setCurrentScreen('info');
  }, []);

  const handleStart_learning = useCallback(() => {
    setLearningSummary(null);
    setCurrentScreen('learning');
  }, []);

  const handleFinish_learning = useCallback((summary) => {
    setLearningSummary(summary);
    setCurrentScreen('learning-summary');
  }, []);

  const handleStartNewLearningSession = useCallback(() => {
    setLearningSummary(null);
    setCurrentScreen('learning');
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'exam':
        return (
          <View style={styles.container}>
            <ExamScreen onFinish_exam={handleFinish_exam} />
            <StatusBar style="light" />
          </View>
        );
      case 'results':
        return (
          <View style={styles.container}>
            <ResultsScreen
              examData={examData}
              examResults={examResults}
              onReturnToMenu={handleReturnToMenu}
            />
            <StatusBar style="light" />
          </View>
        );
      case 'info':
        return (
          <View style={styles.container}>
            <InfoScreen onReturnToMenu={handleReturnToMenu} />
            <StatusBar style="light" />
          </View>
        );
      case 'learning':
        return (
          <View style={styles.container}>
            <LearningScreen onFinish_learning={handleFinish_learning} />
            <StatusBar style="light" />
          </View>
        );
      case 'learning-summary':
        return (
          <View style={styles.container}>
            <LearningSummaryScreen
              summary={learningSummary}
              onReturnToMenu={handleReturnToMenu}
              onStartNewSession={handleStartNewLearningSession}
            />
            <StatusBar style="light" />
          </View>
        );
      default:
        return (
          <View style={styles.container}>
            <MainMenu
              onStart_exam={handleStart_exam}
              onStart_learning={handleStart_learning}
              onShow_info={handleShow_info}
            />
            <StatusBar style="light" />
          </View>
        );
    }
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {renderScreen()}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
