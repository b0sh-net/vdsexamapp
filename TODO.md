# TODO List for VDS Exam Simulator (Expo SDK 54)

## Status: ✅ COMPLETO

### Struttura completa
```
vdsexamapp/
├── App.js                          # Entry point con navigazione (state-based)
├── index.js                        # registerRootComponent (Expo)
├── app.json                        # Configurazione Expo SDK 54
├── package.json                    # expo ~54.0.33, react-native 0.81.5
├── metro.config.js                 # Configurazione Metro bundler
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
    └── assets/                     # Figure esame (24 immagini, fig1-fig24)
```

### Cosa è già stato fatto
- [x] Estrazione 882 domande da Esame_VDS.java (125+107+142+243+34+49+81+25+76)
- [x] Configurazione Expo SDK 54 (expo ~54.0.33, react-native 0.81.5, React 19.1.0)
- [x] Conversione da class a functional components (React hooks: useState, useCallback, useMemo)
- [x] Fix bug userAnswer 'X' vs null (coerente con sorgente Java)
- [x] Fix import/export tra componenti
- [x] Copia immagini figure (24 immagini, fig1-fig24)
- [x] Visualizzazione immagini nelle domande con figura (figureMap statica)
- [x] Fix SafeAreaView deprecato → View + Platform.OS
- [x] Fix Android nav bar sovrapposizione (paddingBottom condizionale)
- [x] Expo testato e funzionante su dispositivo fisico

### Esame Multiassi - ALA FISSA
- Totale: 70 domande
- Suddivisione: 10+10+12+12+4+4+6+6+6
- Soglia passaggio: errate <= 7 (≤10%)

### Come avviare
```bash
cd E:\WORK\PROVE_VARIE\Esavds\vdsexamapp
npx expo start
```
Poi scansiona il QR code con l'app **Expo Go** sul telefono.

### Requisiti telefono
- Installare **Expo Go** da Google Play Store / App Store
- Telefono e PC sulla stessa rete WiFi
