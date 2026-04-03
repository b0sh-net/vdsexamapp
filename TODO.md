# TODO List for VDS Exam Simulator (Expo SDK 54)

## Status: ✅ COMPLETO

### Struttura completa
```
vdsexamapp/
├── App.js                          # Entry point con navigazione (state-based)
├── index.js                        # registerRootComponent (Expo)
├── app.json                        # Configurazione Expo SDK 54
├── package.json                    # expo ~54.0.33, react-native 0.81.5
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
    └── assets/                     # Figure esame (28 immagini)
```

### Cosa è già stato fatto
- [x] Estrazione 882 domande da Esame_VDS.java
- [x] Configurazione Expo SDK 54
- [x] Conversione da class a functional components (React hooks)
- [x] Fix bug userAnswer 'X' vs null (coerente con sorgente Java)
- [x] Fix import/export tra component
- [x] Copia immagini figure
- [x] Expo avviato e verificato su http://localhost:8081

### Esame Multiassi - ALA FISSA
- Totale: 70 domande
- Suddivisione: 10+10+12+12+4+4+6+6+6
- Soglia passaggi: errate <= 7

### Come avviare
```bash
cd E:\WORK\PROVE_VARIE\Esavds\vdsexamapp
npx expo start
```
Poi scansiona il QR code con l'app **Expo Go** sul telefono.

### Requisiti telefono
- Installare **Expo Go** da Google Play Store / App Store
- Telefono e PC sulla stessa rete WiFi
