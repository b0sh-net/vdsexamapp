# VDS Exam Simulator

Un'applicazione React Native per simulare l'esame VDS Multiassi - Ala Fissa, con 882 domande organizzate in 9 categorie.

## 📋 Descrizione

Questa applicazione replica la funzionalità dell'originale applicazione Java VDS exam, permettendo agli utenti di:
- Simulare l'esame completo con 70 domande randomizzate
- Esercitarsi senza limiti con la modalità **Apprendimento**
- Rispondere a domande a scelta multipla
- Ricevere un esito finale (IDONEO/NON IDONEO)
- Revisionare le risposte errate

### Esame Multiassi - ALA FISSA
- **Totale domande**: 70
- **Suddivisione per categoria**: 10+10+12+12+4+4+6+6+6
- **Soglia di passaggio**: massimo 7 risposte errate (≤10% errori)

### Modalità Apprendimento
- Nessun numero prefissato di domande e nessun limite di tempo.
- Esito immediato dopo ogni risposta, con evidenza della risposta corretta in caso di errore.
- Nuove domande estratte dai sette gruppi con i pesi normalizzati:

| Gruppo | Peso | Quota |
|--------|------|-------|
| Aerodinamica | 20 | 18,2% |
| Meteorologia | 20 | 18,2% |
| Tecnologia | 10 | 9,1% |
| Tecnica di pilotaggio | 30 | 27,3% |
| Operazioni e Emergenza | 10 | 9,1% |
| Circolazione aerea (norme + navigazione + legislazione) | 10 | 9,1% |
| Sicurezza | 10 | 9,1% |

- Le domande sbagliate vengono salvate **solo sul dispositivo** e riproposte dopo ogni 3 nuove domande, finché non ricevono la risposta corretta.
- L'arretrato sopravvive alla chiusura e riapertura dell'app (chiave storage `@vds/learning/pending/v1`).
- Alla fine della sessione il riepilogo mostra: domande totali uniche, corrette al primo tentativo, sbagliate successivamente corrette e sbagliate non ancora corrette (intero arretrato persistente).

## 🚀 Come Avviare

### Prerequisiti
- **Node.js** (versione 20 LTS o superiore)
- **npm** o **yarn**
- **Expo Go** installato sul telefono, aggiornato a una versione compatibile con **Expo SDK 58** (disponibile su [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) o [App Store](https://apps.apple.com/app/expo-go/id982107779)). Expo Go supporta solo l'SDK con cui è compilato: se il progetto e l'app non coincidono, la scansione del QR fallisce con `Failed to download remote update`.
- Telefono e PC sulla **stessa rete WiFi**

### Installazione e Avvio

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd vdsexamapp
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Avvia l'applicazione**
   ```bash
   npx expo start
   ```

4. **Accedi all'app**
   - Scansiona il **QR code** visualizzato nel terminale con la fotocamera del telefono
   - Oppure apri l'app **Expo Go** e seleziona il progetto dalla lista

### Risoluzione dei problemi di avvio

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| `Failed to download remote update` dopo la scansione del QR | Expo Go e progetto usano SDK diversi (Expo Go supporta un solo SDK) | Allinea le versioni: il progetto è su **SDK 58**, quindi serve una Expo Go per SDK 58. Trova l'SDK di Expo Go nell'app e confrontalo con `npx expo --version`. |
| Stesso errore ma con SDK allineati | Firewall di Windows che blocca la porta 8081 | In PowerShell **come amministratore**: `New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private,Public` |
| Il QR non connette e telefono/PC sono su reti diverse (o Wi-Fi con isolamento client) | Il telefono non raggiunge il PC | `npx expo start --tunnel` (nessuna modifica alla rete locale), oppure USB con `adb reverse tcp:8081 tcp:8081` e `npx expo start --localhost` |
| Verifica rapida della raggiungibilità | — | Apri `http://<IP-del-PC>:8081` dal browser del telefono: se compare il JSON del manifest la rete è a posto e il problema è lato Expo Go |

Per verificare la coerenza delle dipendenze dopo un aggiornamento SDK:

```bash
npx expo install --check
npx expo-doctor
```

## 📁 Struttura del Progetto

```
vdsexamapp/
├── App.js                          # Entry point con navigazione
├── index.js                        # Punto di registrazione Expo
├── app.json                        # Configurazione Expo SDK 58
├── eas.json                        # Configurazione EAS Build (APK)
├── package.json                    # Dipendenze e script
├── assets/                         # Icone e splash screen
└── src/
    ├── components/
    │   ├── MainMenu.js             # Schermata iniziale con info esame e Apprendimento
    │   ├── ExamScreen.js           # Simulazione esame (domanda per domanda)
    │   ├── ResultsScreen.js        # Esito IDONEO/NON IDONEO + revisione
    │   ├── InfoScreen.js           # Info progetto, licenza e disclaimer
    │   ├── LearningScreen.js       # Sessione Apprendimento con feedback immediato
    │   ├── LearningSummaryScreen.js# Riepilogo delle quattro statistiche
    │   └── __tests__/              # Test UI (Jest + React Native Testing Library)
    ├── data/
    │   └── questions.json          # 882 domande in 9 categorie
    ├── utils/
    │   ├── questionSelector.js     # Selezione casuale esame e calcolo risultati
    │   ├── learningEngine.js       # Motore puro: pesi, ripassi, statistiche
    │   ├── learningStorage.js      # Persistenza locale dell'arretrato
    │   ├── figureMap.js            # Mappa condivisa delle figure 1-24
    │   └── __tests__/              # Test di motore, storage e regressione esame
    └── assets/                     # Figure esame (28 immagini)
```

## 🛠️ Stack Tecnologico

- **React Native**: 0.88.1
- **React**: 19.3.0
- **Expo SDK**: 58.0.22
- **JavaScript (ES6+)**
- **AsyncStorage**: `@react-native-async-storage/async-storage` per l'arretrato locale
- **Test**: Jest, jest-expo, React Native Testing Library

## 📚 Categorie di Domande

Le 882 domande sono organizzate in 9 categorie:
1. **Aerodinamica** (m1_a)
2. **Meteorologia** (m2_a)
3. **Tecnica** (m3_a)
4. **Pilotaggio** (m4_a)
5. **Emergenze** (m5_a)
6. **Norme** (m6_a)
7. **Navigazione** (m7_a)
8. **Legislazione** (m8_a)
9. **Sicurezza** (m9_a)

## 🎮 Come Usare l'App

1. **Schermata Principale**: Visualizza le informazioni sull'esame e il numero totale di domande. In fondo alla schermata trovi i pulsanti per le **Informazioni** sul progetto e il link al **repository GitHub**.
2. **Simulazione Esame**:
   - Leggi la domanda
   - Seleziona una delle 4 risposte (A, B, C, D)
   - Naviga tra le domande con i pulsanti Precedente/Successivo
3. **Risultati**:
   - Visualizza l'esito finale
   - Rivedi tutte le domande e le tue risposte
   - Identifica gli errori per migliorare
4. **Apprendimento**:
   - Tocca **Apprendimento** nel menu principale
   - Rispondi alle domande senza un totale prefissato: l'esito appare subito e la risposta resta bloccata
   - Usa **Avanti** per proseguire e **Termina** per chiudere la sessione (con conferma se hai già risposto)
   - Le domande sbagliate vengono riproposte automaticamente dopo 3 nuove domande e restano salvate sul dispositivo
   - Alla fine vedi il riepilogo con le quattro statistiche richieste
5. **Informazioni**: Schermata con dettagli sul progetto, licenza GPL v3, natura no-profit e disclaimer.

## 🧪 Test Automatici

I test coprono il motore di apprendimento, lo storage locale, le schermate e la regressione dell'esame.

```bash
# Intera suite
npm test -- --runInBand

# Con copertura (motore e storage ≥90% delle righe)
npm test -- --coverage --runInBand

# Solo i test di una storia o area
npm test -- --runInBand -t "US1"
npm test -- --runInBand -t "proporzioni"
npm test -- --runInBand -t "ripasso|storage"
npm test -- --runInBand -t "riepilogo|summary"
```

### Validazione manuale rapida

1. Avvia l'app e apri **Apprendimento**: compare una domanda con gruppo, figura (se presente) e 2-4 opzioni.
2. Rispondi correttamente: banner verde **Corretto** e opzioni bloccate.
3. Rispondi male: banner rosso **Sbagliato** con la risposta corretta; il contatore **Da ripassare** aumenta.
4. Prosegui con **Avanti** per 3 nuove domande: la successiva è etichettata **Ripasso**.
5. Correggi la domanda di ripasso: il contatore diminuisce.
6. Sbaglia di nuovo, chiudi e riapri l'app: la domanda è ancora in arretrato.
7. Termina la sessione: verifica le quattro card del riepilogo e i pulsanti **Nuova sessione** / **Torna al menu**.
8. Dal menu verifica che **SIMULA ESAME** continui a generare 70 domande in 9 categorie.

## 📦 Download APK

L'ultimo APK Android compilato è disponibile nella sezione [**Releases**](https://github.com/b0sh-net/vdsexamapp/releases) del repository. Puoi installarlo direttamente sul tuo dispositivo Android senza bisogno di Expo Go.

### Compilare l'APK in autonomia

Se desideri generare tu stesso l'APK:

```bash
npx eas build --platform android --profile preview
```

Richiede un account [Expo](https://expo.dev) e la CLI `eas` configurata. La build viene eseguita sui server Expo cloud.

## 📄 Licenza

Questo progetto è distribuito sotto la licenza **GNU GPL v3**.

Consulta il file [LICENSE](LICENSE) per i dettagli completi.

### Riepilogo GNU GPL v3
- ✅ Puoi usare, modificare e distribuire il software
- ✅ Devi includere una copia della licenza
- ✅ Devi documentare le modifiche apportate
- ⚠️ Qualsiasi software derivato deve essere distribuito con la stessa licenza

## 🤝 Contributi

I contributi sono benvenuti! Se desideri contribuire:
1. Fai un fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📧 Supporto

Per segnalare bug o richiedere funzionalità, apri un issue nel repository.

## 🔄 Aggiornamenti

L'applicazione è stata completamente sviluppata con:
- ✅ Estrazione di 882 domande dal codice Java originale
- ✅ Configurazione Expo SDK 58
- ✅ Aggiornamento a Expo SDK 58 (React Native 0.88.1, React 19.3.0)
- ✅ Conversione a functional components con React hooks
- ✅ Integrazione di 28 figure esame
- ✅ Logica di randomizzazione e calcolo risultati
- ✅ Correzione domande corrotte (categorie con dati mancanti dal sorgente Java)
- ✅ Validazione dati JSON all'avvio
- ✅ Modalità Apprendimento con estrazione pesata, feedback immediato, ripasso automatico e persistenza locale
- ✅ Riepilogo di sessione con quattro statistiche e arretrato persistente
- ✅ Suite di test automatici (Jest + React Native Testing Library) e regressione dell'esame
- ✅ Schermata Informazioni con licenza, disclaimer no-profit e link repository
- ✅ Build APK tramite EAS Build (Expo cloud)

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: 2026-10-31
