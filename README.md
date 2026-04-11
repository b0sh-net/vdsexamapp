# VDS Exam Simulator

Un'applicazione React Native per simulare l'esame VDS Multiassi - Ala Fissa, con 882 domande organizzate in 9 categorie.

## 📋 Descrizione

Questa applicazione replica la funzionalità dell'originale applicazione Java VDS exam, permettendo agli utenti di:
- Simulare l'esame completo con 70 domande randomizzate
- Rispondere a domande a scelta multipla
- Ricevere un esito finale (IDONEO/NON IDONEO)
- Revisionare le risposte errate

### Esame Multiassi - ALA FISSA
- **Totale domande**: 70
- **Suddivisione per categoria**: 10+10+12+12+4+4+6+6+6
- **Soglia di passaggio**: massimo 7 risposte errate (≤10% errori)

## 🚀 Come Avviare

### Prerequisiti
- **Node.js** (versione 16 o superiore)
- **npm** o **yarn**
- **Expo Go** installato sul telefono (disponibile su [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) o [App Store](https://apps.apple.com/app/expo-go/id982107779))
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

## 📁 Struttura del Progetto

```
vdsexamapp/
├── App.js                          # Entry point con navigazione
├── index.js                        # Punto di registrazione Expo
├── app.json                        # Configurazione Expo SDK 54
├── package.json                    # Dipendenze e script
├── assets/                         # Icone e splash screen
└── src/
    ├── components/
    │   ├── MainMenu.js             # Schermata iniziale con info esame
    │   ├── ExamScreen.js           # Simulazione esame (domanda per domanda)
    │   └── ResultsScreen.js        # Esito IDONEO/NON IDONEO + revisione
    ├── data/
    │   └── questions.json          # 882 domande in 9 categorie
    ├── utils/
    │   └── questionSelector.js     # Selezione casuale e calcolo risultati
    └── assets/                     # Figure esame (28 immagini)
```

## 🛠️ Stack Tecnologico

- **React Native**: 0.81.5
- **Expo SDK**: 54.0.33
- **JavaScript (ES6+)**

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

1. **Schermata Principale**: Visualizza le informazioni sull'esame e il numero totale di domande
2. **Simulazione Esame**: 
   - Leggi la domanda
   - Seleziona una delle 4 risposte (A, B, C, D)
   - Naviga tra le domande con i pulsanti Precedente/Successivo
3. **Risultati**: 
   - Visualizza l'esito finale
   - Rivedi tutte le domande e le tue risposte
   - Identifica gli errori per migliorare

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
- ✅ Configurazione Expo SDK 54
- ✅ Conversione a functional components con React hooks
- ✅ Integrazione di 28 figure esame
- ✅ Logica di randomizzazione e calcolo risultati

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: 2026
