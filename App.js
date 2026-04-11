import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState, useCallback } from 'react';
import MainMenu from './src/components/MainMenu';
import ExamScreen from './src/components/ExamScreen';
import ResultsScreen from './src/components/ResultsScreen';
import InfoScreen from './src/components/InfoScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [examData, setExamData] = useState(null);
  const [examResults, setExamResults] = useState(null);

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
    setCurrentScreen('menu');
  }, []);

  const handleShow_info = useCallback(() => {
    setCurrentScreen('info');
  }, []);

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
    default:
      return (
        <View style={styles.container}>
          <MainMenu onStart_exam={handleStart_exam} onShow_info={handleShow_info} />
          <StatusBar style="light" />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4d7a',
  },
});
