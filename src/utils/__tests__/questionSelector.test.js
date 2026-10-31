import questionSelector, {
  generateRandomExam,
  calculateResults,
  getCategoryForIndex,
} from '../questionSelector';

const { EXAM_CONFIG } = questionSelector;

const EXPECTED_COUNTS = {
  aerodinamica: 10,
  meteo: 10,
  tecnico: 12,
  pilotaggio: 12,
  emergenza: 4,
  norme: 4,
  navigazione: 6,
  legislazione: 6,
  sicurezza: 6,
};

function makeQuestions(correct, wrong, unanswered) {
  const questions = [];
  for (let i = 0; i < correct; i += 1) {
    questions.push({ esatta: 'A', userAnswer: 'A' });
  }
  for (let i = 0; i < wrong; i += 1) {
    questions.push({ esatta: 'A', userAnswer: 'B' });
  }
  for (let i = 0; i < unanswered; i += 1) {
    questions.push({ esatta: 'A', userAnswer: 'X' });
  }
  return questions;
}

describe('questionSelector - regressione simulazione esame', () => {
  test('genera 70 domande nelle 9 categorie con le quantita attese', () => {
    const exam = generateRandomExam();

    expect(exam).toHaveLength(70);
    expect(EXAM_CONFIG.totalQuestions).toBe(70);
    expect(EXAM_CONFIG.maxErrors).toBe(7);

    const counts = {};
    exam.forEach((question) => {
      counts[question.categoria] = (counts[question.categoria] || 0) + 1;
    });

    Object.entries(EXPECTED_COUNTS).forEach(([category, expected]) => {
      expect(counts[category]).toBe(expected);
    });
    expect(Object.keys(counts)).toHaveLength(9);
  });

  test('non seleziona due volte la stessa domanda nella stessa categoria', () => {
    const exam = generateRandomExam();
    const perCategory = {};

    exam.forEach((question) => {
      if (!perCategory[question.categoria]) {
        perCategory[question.categoria] = new Set();
      }
      expect(perCategory[question.categoria].has(question.id)).toBe(false);
      perCategory[question.categoria].add(question.id);
    });
  });

  test('mantiene maxErrors = 7 e il comportamento idoneo/non idoneo', () => {
    const perfect = calculateResults(makeQuestions(70, 0, 0));
    expect(perfect.corrette).toBe(70);
    expect(perfect.errate).toBe(0);
    expect(perfect.nonRisposte).toBe(0);
    expect(perfect.total).toBe(70);
    expect(perfect.maxErrors).toBe(7);
    expect(perfect.passed).toBe(true);
    expect(typeof perfect.reference).toBe('string');

    const limite = calculateResults(makeQuestions(63, 7, 0));
    expect(limite.errate).toBe(7);
    expect(limite.passed).toBe(true);

    const oltreLimite = calculateResults(makeQuestions(62, 8, 0));
    expect(oltreLimite.errate).toBe(8);
    expect(oltreLimite.passed).toBe(false);
  });

  test('conta le risposte non date come non risposte', () => {
    const results = calculateResults(makeQuestions(50, 5, 15));

    expect(results.corrette).toBe(50);
    expect(results.errate).toBe(5);
    expect(results.nonRisposte).toBe(15);
    expect(results.total).toBe(70);
    expect(results.passed).toBe(true);

    const senzaRisposte = calculateResults(makeQuestions(0, 0, 70));
    expect(senzaRisposte.nonRisposte).toBe(70);
    expect(senzaRisposte.passed).toBe(true);
  });

  test('mappa correttamente gli indici alle categorie', () => {
    expect(getCategoryForIndex(0)).toBe('Aerodinamica');
    expect(getCategoryForIndex(9)).toBe('Aerodinamica');
    expect(getCategoryForIndex(10)).toBe('Meteorologia');
    expect(getCategoryForIndex(29)).toBe('Tecnologia e prestazioni');
    expect(getCategoryForIndex(69)).toBe('Sicurezza del volo');
  });
});
