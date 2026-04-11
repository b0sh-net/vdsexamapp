import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';

const REPO_URL = 'https://github.com/b0sh-net/vdsexamapp';
const TOP_PADDING = Platform.OS === 'android' ? 50 : 60;

export default function InfoScreen({ onReturnToMenu }) {
  const openRepo = () => {
    Linking.openURL(REPO_URL);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onReturnToMenu}>
          <Text style={styles.backButtonText}>{'\u2039'} INDIETRO</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informazioni</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progetto */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Simulatore Esame VDS</Text>
          <Text style={styles.cardSubtitle}>MULTIASSI — ALA FISSA</Text>
          <Text style={styles.cardText}>
            Applicazione open-source per la simulazione dell'esame VDS (Volo da
            Diporto o Sportivo). Le 882 domande sono state estratte
            dall'applicazione Java originale e organizzate in 9 categorie.
          </Text>
          <Text style={styles.cardText}>
            Totale: 70 domande per simulazione, distribuite come segue:
            10+10+12+12+4+4+6+6+6. Soglia di superamento: massimo 7 errori
            (≤10%).
          </Text>
        </View>

        {/* Repository */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Codice Sorgente</Text>
          <Text style={styles.cardText}>
            Il progetto è pubblicato su GitHub. Puoi consultare il codice
            sorgente, segnalare problemi o contribuire direttamente.
          </Text>
          <TouchableOpacity style={styles.repoButton} onPress={openRepo}>
            <Text style={styles.repoButtonText}>🔗 github.com/b0sh-net/vdsexamapp</Text>
          </TouchableOpacity>
        </View>

        {/* Licenza */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Licenza</Text>
          <Text style={styles.cardText}>
            Questo software è distribuito con licenza{' '}
            <Text style={styles.bold}>GNU General Public License v3.0</Text>.
          </Text>
          <Text style={styles.cardText}>
            Sei libero di usare, modificare e distribuire il software, a
            condizione che qualsiasi opera derivata venga rilasciata con la
            stessa licenza. È necessario includere una copia della licenza e
            documentare le modifiche apportate.
          </Text>
        </View>

        {/* No-profit */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progetto No-Profit</Text>
          <Text style={styles.cardText}>
            Questo progetto è realizzato e distribuito <Text style={styles.bold}>senza
            scopo di lucro</Text>. Non vi è alcuna finalità commerciale e non
            viene raccolto alcun compenso per il suo utilizzo.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={[styles.card, styles.disclaimerCard]}>
          <Text style={styles.disclaimerTitle}>⚠️ Avviso Importante</Text>
          <Text style={styles.disclaimerText}>
            Questo software viene fornito <Text style={styles.bold}>"COSÌ COM'È"</Text>,
            senza alcuna garanzia, esplicita o implicita, sul suo buon
            funzionamento, accuratezza delle domande o idoneità a uno scopo
            particolare.
          </Text>
          <Text style={styles.disclaimerText}>
            Gli autori e i contributori non si assumono alcuna responsabilità
            per eventuali errori, omissioni o malfunzionamenti. L'utilizzo
            dell'applicazione è a esclusivo rischio dell'utente. Si consiglia
            di verificare sempre le informazioni con fonti ufficiali ENAC /
            ENAV.
          </Text>
        </View>

        <Text style={styles.footer}>Versione 1.0.0 — 2026</Text>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d7a',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#a0c8e0',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  repoButton: {
    alignSelf: 'center',
    backgroundColor: '#f0f4f8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1a4d7a',
  },
  repoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a4d7a',
  },
  disclaimerCard: {
    backgroundColor: '#fff8e1',
    borderColor: '#f9a825',
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
  },
});
