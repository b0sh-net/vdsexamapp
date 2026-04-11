import questionsData from '../data/questions.json';

// Validazione dati JSON all'avvio
(function validateQuestions() {
  const validKeys = ['id', 'domanda', 'risposta_a', 'risposta_b', 'esatta', 'num_risposte'];
  Object.entries(questionsData).forEach(([catKey, questions]) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`⚠️ Categoria "${catKey}": nessuna domanda disponibile`);
      return;
    }
    questions.forEach((q, idx) => {
      const issues = [];
      if (!q.domanda || q.domanda.trim() === '') issues.push('domanda vuota');
      if (!q.esatta || q.esatta.length === 0) issues.push('risposta esatta mancante');
      if (q.num_risposte < 2) issues.push('numero risposte insufficiente (' + q.num_risposte + ')');
      if (!validKeys.every(k => k in q)) issues.push('campi mancanti');
      if (issues.length > 0) {
        console.error(`❌ ${catKey}[${idx}] (id ${q.id}): ${issues.join(', ')}`);
      }
    });
  });
})();

// Esame multiassi: 70 domande distribuite in 9 categorie
const EXAM_CONFIG = {
  categories: [
    { key: 'aerodinamica', numQuestions: 10, name: 'Aerodinamica' },
    { key: 'meteo', numQuestions: 10, name: 'Meteorologia' },
    { key: 'tecnico', numQuestions: 12, name: 'Tecnologia e prestazioni' },
    { key: 'pilotaggio', numQuestions: 12, name: 'Tecnica di pilotaggio' },
    { key: 'emergenza', numQuestions: 4, name: 'Operazioni di emergenza' },
    { key: 'norme', numQuestions: 4, name: 'Norme di circolazione e fonia' },
    { key: 'navigazione', numQuestions: 6, name: 'Navigazione Aerea' },
    { key: 'legislazione', numQuestions: 6, name: 'Legislazione aeronautica' },
    { key: 'sicurezza', numQuestions: 6, name: 'Sicurezza del volo' },
  ],
  totalQuestions: 70,
  maxErrors: 7, // 70 / 10 = 7
};

function generateRandomIndices(poolSize, numToSelect) {
  if (numToSelect > poolSize) {
    throw new Error(
      `Impossibile selezionare ${numToSelect} domande da un pool di ${poolSize}`
    );
  }
  const indices = [];
  for (let i = 0; i < numToSelect; i++) {
    let idx;
    do {
      idx = Math.floor(Math.random() * poolSize);
    } while (indices.includes(idx));
    indices.push(idx);
  }
  return indices;
}

export function generateRandomExam() {
  const examQuestions = [];

  EXAM_CONFIG.categories.forEach((category) => {
    const allQuestions = questionsData[category.key];
    if (!allQuestions) return;

    const selectedIndices = generateRandomIndices(allQuestions.length, category.numQuestions);
    selectedIndices.forEach((idx) => {
      const q = allQuestions[idx];
      examQuestions.push({
        id: q.id,
        questionIndex: examQuestions.length,
        categoria: category.key,
        domanda: q.domanda,
        risposta_a: q.risposta_a,
        risposta_b: q.risposta_b,
        risposta_c: q.risposta_c || '',
        risposta_d: q.risposta_d || '',
        num_risposte: q.num_risposte,
        esatta: q.esatta,
        figura: q.figura,
        userAnswer: 'X', // X = non risposto (come nel sorgente Java)
      });
    });
  });

  return examQuestions;
}

export function generateExamReference() {
  const r = () => Math.floor(Math.random() * 999);
  return `rif. ${r()}-${r()}-${r()}`;
}

export function selectAnswer(examQuestions, questionIndex, answerKey) {
  const updated = [...examQuestions];
  updated[questionIndex] = { ...updated[questionIndex], userAnswer: answerKey };
  return updated;
}

export function calculateResults(examQuestions) {
  let corrette = 0;
  let errate = 0;
  let nonRisposte = 0;

  examQuestions.forEach((q) => {
    if (q.userAnswer === 'X' || q.userAnswer === null || q.userAnswer === undefined) {
      nonRisposte++;
    } else if (q.userAnswer === q.esatta) {
      corrette++;
    } else {
      errate++;
    }
  });

  // Come nel sorgente Java: errate <= numero_domande / 10
  const passed = errate <= EXAM_CONFIG.maxErrors;

  return {
    corrette,
    errate,
    nonRisposte,
    total: examQuestions.length,
    maxErrors: EXAM_CONFIG.maxErrors,
    passed,
    reference: generateExamReference(),
  };
}

export function getCategoryForIndex(questionIndex) {
  let count = 0;
  for (const cat of EXAM_CONFIG.categories) {
    if (questionIndex < count + cat.numQuestions) {
      return cat.name;
    }
    count += cat.numQuestions;
  }
  return 'Sconosciuta';
}

export function getCategoryColor(questionIndex) {
  let count = 0;
  let catIndex = 0;
  for (const cat of EXAM_CONFIG.categories) {
    if (questionIndex < count + cat.numQuestions) {
      return catIndex;
    }
    count += cat.numQuestions;
    catIndex++;
  }
  return 0;
}

export default {
  EXAM_CONFIG,
  generateRandomExam,
  generateExamReference,
  selectAnswer,
  calculateResults,
  getCategoryForIndex,
  getCategoryColor,
};
