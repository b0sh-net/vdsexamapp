import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';

const TOP_PADDING = Platform.OS === 'android' ? 50 : 60;
const REPO_URL = 'https://github.com/b0sh-net/vdsexamapp';

export default function MainMenu({ onStart_exam, onShow_info }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>✈ VDS</Text>
        <Text style={styles.title}>Simulatore Esame VDS</Text>
        <Text style={styles.subtitle}>MULTIASSI - ALA FISSA</Text>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Simulazione Esame</Text>
        <Text style={styles.cardText}>
          L'esame consiste in 70 domande suddivise in 9 categorie.
        </Text>
        <View style={styles.catList}>
          <Text style={styles.catItem}>• Aerodinamica: 10 domande</Text>
          <Text style={styles.catItem}>• Meteorologia: 10 domande</Text>
          <Text style={styles.catItem}>• Tecnologia e prestazioni: 12 domande</Text>
          <Text style={styles.catItem}>• Tecnica di pilotaggio: 12 domande</Text>
          <Text style={styles.catItem}>• Operazioni di emergenza: 4 domande</Text>
          <Text style={styles.catItem}>• Norme di circolazione e fonia: 4 domande</Text>
          <Text style={styles.catItem}>• Navigazione Aerea: 6 domande</Text>
          <Text style={styles.catItem}>• Legislazione aeronautica: 6 domande</Text>
          <Text style={styles.catItem}>• Sicurezza del volo: 6 domande</Text>
        </View>
        <Text style={styles.cardText}>
          Per essere IDONEO, il numero di errori non deve superare 7 su 70.
        </Text>
      </View>

      {/* Start button */}
      <TouchableOpacity style={styles.startButton} onPress={onStart_exam}>
        <Text style={styles.startButtonText}>SIMULA ESAME</Text>
      </TouchableOpacity>

      {/* Footer actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={onShow_info}>
          <Text style={styles.footerButtonText}>ℹ️ Informazioni</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => Linking.openURL(REPO_URL)}
        >
          <Text style={styles.footerButtonText}>🔗 GitHub</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4d7a',
    paddingTop: TOP_PADDING,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0c8e0',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d7a',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  catList: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  catItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 3,
  },
  startButton: {
    alignSelf: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    width: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 30,
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});
