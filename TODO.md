# TODO List for VDS Exam Simulator (Expo SDK 54)

## Status: ✅ COMPLETO

### Struttura del progetto
```
vdsexamapp/
├── App.js                          # Entry point con navigazione (state-based)
├── index.js                        # registerRootComponent (Expo)
├── app.json                        # Configurazione Expo SDK 54
├── package.json                    # expo ~54.0.33, react-native 0.81.5
├── metro.config.js                 # Metro bundler config
├── assets/                         # Icone Expo (adaptive-icon, splash, favicon)
└── src/
    ├── components/
    │   ├── MainMenu.js             # Schermata iniziale con info esame
    │   ├── ExamScreen.js           # Simulazione esame (domanda x domanda)
    │   └── ResultsScreen.js        # Esito IDONEO/NON IDONEO + revisione
    ├── data/
    │   └── questions.json          # 882 domande in 9 categorie
    ├── utils/
    │   └── questionSelector.js     # Selezione casuale, calcolo risultati
    └── assets/                     # 24 figure esame (fig1-fig24)
```

### Funzionalità completate
- [x] Estrazione 882 domande da Esame_VDS.java (125+107+142+243+34+49+81+25+76)
- [x] Expo SDK 54 (expo ~54.0.33, react-native 0.81.5, React 19.1.0)
- [x] Functional components con React hooks (useState, useCallback, useMemo)
- [x] Selezione casuale domande senza duplicati (come Generazione_casuale.java)
- [x] Navigazione Precedente/Successivo con pulsanti cliccabili
- [x] Visualizzazione immagini figure (figureMap statica con require())
- [x] Fix SafeAreaView deprecato → View + Platform.OS padding
- [x] Fix Android nav bar (paddingBottom: 25px su Android, 15px su iOS)
- [x] Risultati con IDONEO/NON IDONEO e revisione errori/non risposte
- [x] Test completo su dispositivo fisico (70 domande → OK)

### Configurazione esame (Multiassi - ALA FISSA)
- 70 domande totali: 10+10+12+12+4+4+6+6+6
- Soglia passaggio: errate <= 7 (≤10%)

### Avvio
```bash
npx expo start
```
Poi scansiona il QR code con **Expo Go** sul telefono (stessa rete WiFi del PC).
