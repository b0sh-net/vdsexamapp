import questionsData from '../../data/questions.json';
import {
  LEARNING_GROUPS,
  TOTAL_WEIGHT,
  REVIEW_INTERVAL,
  buildQuestionIndex,
  createSession,
  drawNextQuestion,
  answerCurrent,
  getSessionSummary,
  getQuestionOptions,
  getGroupLabel,
  normalizeCoverage,
  computeCoverageSummary,
} from '../learningEngine';
import {
  createSeededRng,
  createFakeClock,
  makeBank,
  makeQuestion,
  makePendingEntry,
  makeCoverageEntry,
} from './helpers';

const EXPECTED_WEIGHTS = {
  aerodinamica: 20,
  meteo: 20,
  tecnico: 10,
  pilotaggio: 30,
  emergenza: 10,
  circolazione: 10,
  sicurezza: 10,
};

function draw(session) {
  return drawNextQuestion(session).session;
}

function answerCorrect(session) {
  return answerCurrent(session, session.current.question.esatta).session;
}

function answerWrong(session) {
  const options = getQuestionOptions(session.current.question);
  const wrong = options.find(
    (option) => option.key !== session.current.question.esatta
  );
  return answerCurrent(session, wrong.key).session;
}

function simulateCorrectAnswers(session, count) {
  let current = session;
  for (let i = 0; i < count; i += 1) {
    current = draw(current);
    current = answerCorrect(current);
  }
  return current;
}

describe('learningEngine - foundational', () => {
  test('costruisce un indice con 882 chiavi univoche e nessuna domanda invalida', () => {
    const index = buildQuestionIndex(questionsData);

    expect(index.byKey.size).toBe(882);
    expect(index.invalid).toHaveLength(0);

    let grouped = 0;
    index.byGroup.forEach((questions) => {
      grouped += questions.length;
    });
    expect(grouped).toBe(882);

    const keys = new Set(Array.from(index.byKey.keys()));
    expect(keys.size).toBe(882);
  });

  test('scarta le domande invalide e le raccoglie in invalid senza lanciare eccezioni', () => {
    const bank = {
      meteo: [
        makeQuestion(0),
        makeQuestion(1, { domanda: '   ' }),
        makeQuestion(2, { esatta: 'Z' }),
        makeQuestion(3, { num_risposte: 5 }),
        makeQuestion(4, { num_risposte: 2, esatta: 'D' }),
        makeQuestion(5, { risposta_a: '' }),
        makeQuestion(6, { id: 'sette' }),
      ],
      categoriaSconosciuta: [makeQuestion(0)],
    };

    const index = buildQuestionIndex(bank);

    expect(index.byKey.size).toBe(1);
    expect(index.byKey.has('meteo:0')).toBe(true);
    expect(index.invalid).toHaveLength(6);
    index.invalid.forEach((entry) => {
      expect(entry.sourceKey).toBe('meteo');
      expect(typeof entry.reason).toBe('string');
    });
  });

  test('restituisce un indice vuoto per archivi non validi', () => {
    expect(buildQuestionIndex(null).byKey.size).toBe(0);
    expect(buildQuestionIndex(undefined).byGroup.size).toBe(LEARNING_GROUPS.length);
    expect(buildQuestionIndex('non-un-oggetto').invalid).toEqual([]);
  });
});

describe('learningEngine - gruppi e opzioni', () => {
  test('espone i sette gruppi con pesi e sorgenti richiesti', () => {
    expect(LEARNING_GROUPS).toHaveLength(7);
    expect(TOTAL_WEIGHT).toBe(110);
    expect(REVIEW_INTERVAL).toBe(3);

    LEARNING_GROUPS.forEach((group) => {
      expect(group.weight).toBe(EXPECTED_WEIGHTS[group.key]);
      expect(group.label.length).toBeGreaterThan(0);
    });

    const somma = LEARNING_GROUPS.reduce((sum, group) => sum + group.weight, 0);
    expect(somma).toBe(TOTAL_WEIGHT);

    const circolazione = LEARNING_GROUPS.find(
      (group) => group.key === 'circolazione'
    );
    expect(circolazione.sourceKeys).toEqual([
      'norme',
      'navigazione',
      'legislazione',
    ]);
  });

  test('restituisce le etichette italiane dei gruppi', () => {
    expect(getGroupLabel('aerodinamica')).toBe('Aerodinamica');
    expect(getGroupLabel('meteo')).toBe('Meteorologia');
    expect(getGroupLabel('tecnico')).toBe('Tecnologia');
    expect(getGroupLabel('pilotaggio')).toBe('Tecnica di pilotaggio');
    expect(getGroupLabel('emergenza')).toBe('Operazioni e Emergenza');
    expect(getGroupLabel('circolazione')).toBe('Circolazione aerea');
    expect(getGroupLabel('sicurezza')).toBe('Sicurezza');
    expect(getGroupLabel('sconosciuto')).toBe('sconosciuto');
  });

  test('restituisce solo le opzioni disponibili per 2, 3 e 4 risposte', () => {
    const due = getQuestionOptions(makeQuestion(0, { num_risposte: 2 }));
    const tre = getQuestionOptions(makeQuestion(0, { num_risposte: 3 }));
    const quattro = getQuestionOptions(makeQuestion(0, { num_risposte: 4 }));

    expect(due.map((option) => option.key)).toEqual(['A', 'B']);
    expect(tre.map((option) => option.key)).toEqual(['A', 'B', 'C']);
    expect(quattro.map((option) => option.key)).toEqual(['A', 'B', 'C', 'D']);

    const conTestoMancante = getQuestionOptions(
      makeQuestion(0, { num_risposte: 3, risposta_c: '  ' })
    );
    expect(conTestoMancante.map((option) => option.key)).toEqual(['A', 'B']);

    expect(getQuestionOptions(null)).toEqual([]);
  });
});

describe('learningEngine - inizializzazione sessione', () => {
  test('inizializza una sessione vuota e non estrae la prima domanda', () => {
    const now = createFakeClock(1000);
    const session = createSession({ bank: makeBank(), now });

    expect(session.current).toBeNull();
    expect(session.phase).toBe('answering');
    expect(session.seenKeys.size).toBe(0);
    expect(session.newSinceReview).toBe(0);
    expect(session.records.size).toBe(0);
    expect(session.answeredCount).toBe(0);
    expect(session.pendingRevision).toBe(0);
    expect(session.startedAt).toBe(1000);
    expect(session.storageWarning).toBeNull();
    expect(session.pending).toEqual([]);
    expect(typeof session.rng).toBe('function');
    expect(typeof session.now).toBe('function');
  });

  test('deduplica e ripara l arretrato, escludendo le chiavi in attesa dai pool', () => {
    const now = createFakeClock(5000);
    const pending = [
      makePendingEntry({ questionKey: 'norme:0', wrongCount: 1 }),
      makePendingEntry({
        questionKey: 'norme:0',
        wrongCount: 3,
        lastWrongAt: 900,
        lastProposedAt: 950,
      }),
      makePendingEntry({
        questionKey: 'meteo:0',
        sourceKey: 'meteo',
        groupKey: 'meteo',
        questionId: 0,
        firstWrongAt: undefined,
        lastWrongAt: undefined,
        lastProposedAt: undefined,
      }),
      makePendingEntry({ questionKey: 'inesistente:99' }),
      makePendingEntry({
        questionKey: 'norme:1',
        groupKey: 'meteo',
        sourceKey: 'norme',
        questionId: 1,
      }),
    ];

    const session = createSession({ bank: makeBank(), pending, now });

    expect(session.pending).toHaveLength(3);
    const norme = session.pending.find((entry) => entry.questionKey === 'norme:0');
    expect(norme.wrongCount).toBe(3);
    expect(norme.lastWrongAt).toBe(900);
    expect(norme.lastProposedAt).toBe(950);

    const recuperata = session.pending.find(
      (entry) => entry.questionKey === 'norme:1'
    );
    expect(recuperata.groupKey).toBe('circolazione');
    expect(recuperata.sourceKey).toBe('norme');

    const meteo = session.pending.find((entry) => entry.questionKey === 'meteo:0');
    expect(meteo.firstWrongAt).toBe(5000);
    expect(meteo.lastWrongAt).toBe(5000);
    expect(meteo.lastProposedAt).toBe(5000);

    const poolKeys = [];
    session.pools.forEach((pool) => {
      pool.forEach((entry) => poolKeys.push(entry.questionKey));
    });
    expect(poolKeys).not.toContain('norme:0');
    expect(poolKeys).not.toContain('norme:1');
    expect(poolKeys).not.toContain('meteo:0');
    expect(poolKeys).toContain('aerodinamica:0');
    expect(new Set(poolKeys).size).toBe(poolKeys.length);
  });

  test('restituisce una sessione esaurita senza eccezioni per archivi non validi', () => {
    const session = createSession({ bank: null });

    expect(session.phase).toBe('exhausted');
    expect(session.current).toBeNull();
    expect(session.invalid).toEqual([]);
    expect(session.error).toBe('INVALID_BANK');

    const drawn = drawNextQuestion(session);
    expect(drawn.current).toBeNull();
    expect(drawn.session.phase).toBe('exhausted');
  });

  test('non muta l oggetto sessione di input', () => {
    const session = createSession({
      bank: makeBank(),
      rng: createSeededRng(42),
      now: createFakeClock(),
    });
    const snapshot = {
      phase: session.phase,
      current: session.current,
      seen: session.seenKeys.size,
    };

    const drawn = drawNextQuestion(session);

    expect(session.phase).toBe(snapshot.phase);
    expect(session.current).toBe(snapshot.current);
    expect(session.seenKeys.size).toBe(snapshot.seen);
    expect(drawn.session).not.toBe(session);
    expect(drawn.session.current).not.toBeNull();
  });
});

describe('learningEngine - proporzioni (US2)', () => {
  test('le 300 nuove estrazioni rispettano i pesi normalizzati entro 5 punti percentuali', () => {
    const rng = createSeededRng(20261031);
    let session = createSession({ bank: questionsData, rng });
    const counts = {};

    session = draw(session);
    for (let i = 0; i < 300; i += 1) {
      expect(session.current.source).toBe('new');
      counts[session.current.groupKey] =
        (counts[session.current.groupKey] || 0) + 1;
      session = answerCorrect(session);
      session = draw(session);
    }

    expect(
      Object.keys(counts).reduce((sum, key) => sum + counts[key], 0)
    ).toBe(300);

    LEARNING_GROUPS.forEach((group) => {
      const expected = group.weight / TOTAL_WEIGHT;
      const observed = (counts[group.key] || 0) / 300;
      expect(Math.abs(observed - expected)).toBeLessThanOrEqual(0.05);
    });
  });

  test('circolazione aerea attinge solo da norme, navigazione e legislazione', () => {
    const rng = createSeededRng(7);
    let session = createSession({ bank: questionsData, rng });
    const sources = new Set();

    session = draw(session);
    for (let i = 0; i < 120; i += 1) {
      if (session.current.groupKey === 'circolazione') {
        sources.add(session.current.questionKey.split(':')[0]);
      }
      session = answerCorrect(session);
      session = draw(session);
    }

    expect(sources.size).toBeGreaterThan(1);
    sources.forEach((sourceKey) => {
      expect(['norme', 'navigazione', 'legislazione']).toContain(sourceKey);
    });
  });

  test('non propone mai due volte la stessa domanda come nuova', () => {
    const rng = createSeededRng(99);
    let session = createSession({ bank: questionsData, rng });
    const seen = new Set();

    session = draw(session);
    for (let i = 0; i < 250; i += 1) {
      const key = session.current.questionKey;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(session.seenKeys.has(key)).toBe(true);
      session = answerCorrect(session);
      session = draw(session);
    }

    expect(seen.size).toBe(250);
  });

  test('esclude i gruppi esauriti, rinormalizza i pesi residui e termina in exhausted', () => {
    const bank = {
      meteo: [makeQuestion(0)],
      sicurezza: [makeQuestion(0)],
    };

    let session = createSession({ bank, rng: createSeededRng(3) });
    const groups = [];

    session = draw(session);
    for (let i = 0; i < 2; i += 1) {
      groups.push(session.current.groupKey);
      session = answerCorrect(session);
      session = draw(session);
    }

    expect(groups.sort()).toEqual(['meteo', 'sicurezza']);
    expect(session.current).toBeNull();
    expect(session.phase).toBe('exhausted');

    const again = drawNextQuestion(session);
    expect(again.current).toBeNull();
    expect(again.session.phase).toBe('exhausted');
  });
});

describe('learningEngine - risposta (US1)', () => {
  test('registra un esito corretto con tutti i campi del feedback', () => {
    const now = createFakeClock(100);
    const session = draw(
      createSession({ bank: makeBank(), rng: createSeededRng(1), now })
    );
    const question = session.current.question;

    const result = answerCurrent(session, question.esatta);

    expect(result.error).toBeUndefined();
    expect(result.feedback).toEqual(
      expect.objectContaining({
        correct: true,
        correctAnswer: question.esatta,
        selectedAnswer: question.esatta,
        wasPending: false,
        pendingCount: 0,
      })
    );
    expect(result.feedback.correctAnswerText.length).toBeGreaterThan(0);
    expect(result.feedback.selectedAnswerText).toBe(
      result.feedback.correctAnswerText
    );
    expect(result.session.phase).toBe('feedback');
    expect(result.session.answeredCount).toBe(1);
    expect(result.session.current.selectedAnswer).toBe(question.esatta);
    expect(result.session.pending).toHaveLength(0);
    expect(result.pendingRevisionChanged).toBe(false);

    const record = result.session.records.get(session.current.questionKey);
    expect(record.answerCount).toBe(1);
    expect(record.firstAnswerCorrect).toBe(true);
    expect(record.wrongInSession).toBe(false);
  });

  test('registra un esito errato, espone la risposta corretta e inserisce in arretrato', () => {
    const now = createFakeClock(200);
    const session = draw(
      createSession({ bank: makeBank(), rng: createSeededRng(2), now })
    );
    const question = session.current.question;
    const wrong = getQuestionOptions(question).find(
      (option) => option.key !== question.esatta
    );

    const result = answerCurrent(session, wrong.key);

    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.correctAnswer).toBe(question.esatta);
    expect(result.feedback.correctAnswerText).toBe(
      question[`risposta_${question.esatta.toLowerCase()}`]
    );
    expect(result.feedback.selectedAnswer).toBe(wrong.key);
    expect(result.feedback.wasPending).toBe(false);
    expect(result.feedback.pendingCount).toBe(1);
    expect(result.pendingRevisionChanged).toBe(true);

    expect(result.session.pending).toHaveLength(1);
    const entry = result.session.pending[0];
    expect(entry.questionKey).toBe(session.current.questionKey);
    expect(entry.wrongCount).toBe(1);
    expect(entry.firstWrongAt).toBe(202);
    expect(entry.lastWrongAt).toBe(202);
    expect(entry.lastProposedAt).toBe(202);

    const record = result.session.records.get(session.current.questionKey);
    expect(record.firstAnswerCorrect).toBe(false);
    expect(record.wrongInSession).toBe(true);
    expect(record.correctedInSession).toBe(false);
  });

  test('blocca una seconda risposta sulla stessa domanda', () => {
    let session = draw(
      createSession({ bank: makeBank(), rng: createSeededRng(4) })
    );
    session = answerCorrect(session);
    const snapshotPending = JSON.stringify(session.pending);
    const snapshotRecords = session.records.size;

    const second = answerCurrent(session, 'A');

    expect(second.error).toBe('INVALID_PHASE');
    expect(second.session).toBeUndefined();
    expect(JSON.stringify(session.pending)).toBe(snapshotPending);
    expect(session.records.size).toBe(snapshotRecords);
  });

  test('rifiuta risposte non disponibili e risposte senza domanda corrente', () => {
    const session = draw(
      createSession({ bank: { meteo: [makeQuestion(0, { num_risposte: 2 })] } })
    );

    expect(answerCurrent(session, 'D').error).toBe('INVALID_ANSWER');
    expect(answerCurrent(session, 'Z').error).toBe('INVALID_ANSWER');

    const empty = createSession({ bank: makeBank() });
    expect(answerCurrent(empty, 'A').error).toBe('NO_CURRENT_QUESTION');
  });

  test('passa da feedback alla domanda successiva con drawNextQuestion', () => {
    let session = draw(
      createSession({ bank: makeBank(), rng: createSeededRng(5) })
    );
    const firstKey = session.current.questionKey;
    session = answerCorrect(session);

    const drawn = drawNextQuestion(session);

    expect(drawn.session.phase).toBe('answering');
    expect(drawn.current).not.toBeNull();
    expect(drawn.current.questionKey).not.toBe(firstKey);
    expect(drawn.session.answeredCount).toBe(1);
  });
});

describe('learningEngine - ripasso e persistenza (US3)', () => {
  test('propone un ripasso dopo 3 nuove domande', () => {
    let session = draw(
      createSession({
        bank: makeBank(),
        rng: createSeededRng(11),
        now: createFakeClock(1000),
      })
    );

    session = answerWrong(session);
    const pendingKey = session.pending[0].questionKey;
    expect(session.newSinceReview).toBe(1);
    expect(session.pending[0].newSinceWrong).toBe(0);

    session = simulateCorrectAnswers(session, 2);
    expect(session.newSinceReview).toBe(3);
    expect(session.pending[0].newSinceWrong).toBe(2);

    // Dopo solo 2 nuove domande il ripasso non deve ancora comparire.
    const notYet = drawNextQuestion(session);
    expect(notYet.current.source).toBe('new');
    expect(notYet.current.questionKey).not.toBe(pendingKey);

    session = answerCorrect(notYet.session);
    expect(session.pending[0].newSinceWrong).toBe(3);

    const drawn = drawNextQuestion(session);

    expect(drawn.current.source).toBe('review');
    expect(drawn.current.questionKey).toBe(pendingKey);
    expect(drawn.current.pendingAtPresentation).toBe(true);
    expect(drawn.session.newSinceReview).toBe(0);
    expect(drawn.pendingRevisionChanged).toBe(true);
  });

  test('con più voci in attesa sceglie quella proposta meno di recente', () => {
    const bank = {
      norme: [makeQuestion(0), makeQuestion(1)],
    };
    const pending = [
      makePendingEntry({
        questionKey: 'norme:0',
        questionId: 0,
        lastProposedAt: 900,
        firstWrongAt: 100,
      }),
      makePendingEntry({
        questionKey: 'norme:1',
        questionId: 1,
        lastProposedAt: 500,
        firstWrongAt: 800,
      }),
    ];

    const drawn = drawNextQuestion(
      createSession({ bank, pending, now: createFakeClock(2000) })
    );

    expect(drawn.current.questionKey).toBe('norme:1');
    expect(drawn.current.source).toBe('review');
    const entry = drawn.session.pending.find(
      (item) => item.questionKey === 'norme:1'
    );
    expect(entry.lastProposedAt).toBe(2001);
  });

  test('a parità di lastProposedAt usa firstWrongAt e poi la chiave', () => {
    const bank = { norme: [makeQuestion(0), makeQuestion(1)] };
    const pending = [
      makePendingEntry({
        questionKey: 'norme:1',
        questionId: 1,
        lastProposedAt: 500,
        firstWrongAt: 200,
      }),
      makePendingEntry({
        questionKey: 'norme:0',
        questionId: 0,
        lastProposedAt: 500,
        firstWrongAt: 200,
      }),
    ];

    const drawn = drawNextQuestion(
      createSession({ bank, pending, now: createFakeClock(3000) })
    );

    expect(drawn.current.questionKey).toBe('norme:0');
  });

  test('una risposta corretta al ripasso rimuove la voce e incrementa la revisione', () => {
    const bank = { norme: [makeQuestion(0)] };
    const pending = [makePendingEntry({ questionKey: 'norme:0' })];

    let session = draw(
      createSession({ bank, pending, now: createFakeClock(10) })
    );
    expect(session.pending).toHaveLength(1);
    const revisionBefore = session.pendingRevision;
    expect(session.current.source).toBe('review');

    const result = answerCurrent(session, session.current.question.esatta);

    expect(result.feedback.wasPending).toBe(true);
    expect(result.feedback.correct).toBe(true);
    expect(result.session.pending).toHaveLength(0);
    expect(result.session.pendingRevision).toBe(revisionBefore + 1);
    expect(result.pendingRevisionChanged).toBe(true);

    const record = result.session.records.get('norme:0');
    expect(record.firstAnswerCorrect).toBe(false);
    expect(record.correctedInSession).toBe(true);
  });

  test('una risposta errata al ripasso non duplica la voce e incrementa wrongCount', () => {
    const bank = { norme: [makeQuestion(0)] };
    const pending = [
      makePendingEntry({ questionKey: 'norme:0', wrongCount: 2 }),
    ];

    let session = draw(
      createSession({ bank, pending, now: createFakeClock(20) })
    );
    const result = answerCurrent(
      session,
      getQuestionOptions(session.current.question).find(
        (option) => option.key !== session.current.question.esatta
      ).key
    );

    expect(result.session.pending).toHaveLength(1);
    expect(result.session.pending[0].wrongCount).toBe(3);
    expect(result.session.pending[0].lastWrongAt).toBe(22);
    expect(result.session.pending[0].lastProposedAt).toBe(22);
    expect(result.session.pending[0].newSinceWrong).toBe(0);
    expect(result.session.pendingRevision).toBe(2);
  });

  test('dopo un errore al ripasso servono altre 3 nuove domande', () => {
    const bank = {
      norme: [makeQuestion(0)],
      meteo: Array.from({ length: 6 }, (_, index) => makeQuestion(index)),
    };
    const pending = [makePendingEntry({ questionKey: 'norme:0' })];
    const rng = createSeededRng(77);

    let session = createSession({ bank, pending, rng });

    // La voce è già matura, ma con nuove domande disponibili si aspettano
    // comunque 3 nuove estrazioni prima del ripasso.
    for (let i = 0; i < 3; i += 1) {
      session = draw(session);
      session = answerCorrect(session);
    }

    session = draw(session);
    expect(session.current.questionKey).toBe('norme:0');
    expect(session.current.source).toBe('review');

    // Errore al ripasso: il contatore riparte da zero.
    session = answerWrong(session);
    expect(session.pending[0].newSinceWrong).toBe(0);

    // Con 3 nuove domande ancora disponibili, dopo le prime due non torna.
    session = draw(session);
    session = answerCorrect(session);
    session = draw(session);
    session = answerCorrect(session);
    session = draw(session);
    expect(session.current.source).toBe('new');
    expect(session.current.questionKey).not.toBe('norme:0');
    session = answerCorrect(session);

    // Solo dopo la terza nuova domanda la voce è di nuovo riproponibile.
    session = draw(session);
    expect(session.current.questionKey).toBe('norme:0');
    expect(session.current.source).toBe('review');
  });

  test('con nuove domande esaurite continua con i ripassi', () => {
    const bank = { norme: [makeQuestion(0)] };
    const pending = [makePendingEntry({ questionKey: 'norme:0' })];

    const drawn = drawNextQuestion(
      createSession({ bank, pending, now: createFakeClock(30) })
    );

    expect(drawn.session.phase).toBe('answering');
    expect(drawn.current.source).toBe('review');
    expect(drawn.current.questionKey).toBe('norme:0');
  });

  test('senza nuove domande e senza ripassi termina in exhausted', () => {
    const bank = { norme: [makeQuestion(0)] };
    let session = createSession({ bank, rng: createSeededRng(1) });
    session = draw(session);
    session = answerCorrect(session);
    session = drawNextQuestion(session).session;

    expect(session.phase).toBe('exhausted');
    expect(session.current).toBeNull();
  });

  test('una domanda corretta al primo tentativo non entra mai in arretrato', () => {
    let session = draw(
      createSession({ bank: makeBank(), rng: createSeededRng(15) })
    );
    session = answerCorrect(session);

    expect(session.pending).toHaveLength(0);
    expect(session.pendingRevision).toBe(0);
  });
});

describe('learningEngine - riepilogo (US4)', () => {
  test('conta le metriche su un mix noto di risposte', () => {
    let session = draw(
      createSession({
        bank: makeBank(),
        rng: createSeededRng(21),
        now: createFakeClock(100),
      })
    );

    // 1 nuova corretta
    session = answerCorrect(session);
    // 1 nuova sbagliata
    session = draw(session);
    session = answerWrong(session);
    const wrongKey = session.current.questionKey;
    // 3 nuove corrette: solo ora la domanda sbagliata può essere riproposta
    session = draw(session);
    session = answerCorrect(session);
    session = draw(session);
    session = answerCorrect(session);
    session = draw(session);
    session = answerCorrect(session);
    session = draw(session);
    expect(session.current.questionKey).toBe(wrongKey);
    expect(session.current.source).toBe('review');
    session = answerCorrect(session);
    // 1 nuova sbagliata e mai corretta
    session = draw(session);
    session = answerWrong(session);

    const summary = getSessionSummary(session, () => 999);

    expect(summary.totalUnique).toBe(6);
    expect(summary.firstAttemptCorrect).toBe(4);
    expect(summary.laterCorrected).toBe(1);
    expect(summary.stillPending).toBe(1);
    expect(summary.answeredCount).toBe(7);
    expect(summary.startedAt).toBe(100);
    expect(summary.endedAt).toBe(999);
    expect(summary.storageWarning).toBeNull();
  });

  test('con zero risposte restituisce zeri e il backlog preesistente', () => {
    const pending = [
      makePendingEntry({ questionKey: 'norme:0' }),
      makePendingEntry({
        questionKey: 'meteo:0',
        sourceKey: 'meteo',
        groupKey: 'meteo',
        questionId: 0,
      }),
      makePendingEntry({
        questionKey: 'sicurezza:0',
        sourceKey: 'sicurezza',
        groupKey: 'sicurezza',
        questionId: 0,
      }),
    ];

    const session = createSession({
      bank: makeBank(),
      pending,
      now: createFakeClock(1000),
    });
    const summary = getSessionSummary(session, () => 2000);

    expect(summary).toEqual({
      totalUnique: 0,
      firstAttemptCorrect: 0,
      laterCorrected: 0,
      stillPending: 3,
      answeredCount: 0,
      startedAt: 1000,
      endedAt: 2000,
      storageWarning: null,
      coverage: {
        seenCount: 0,
        totalCount: 24,
        remainingCount: 24,
        percentage: 0,
      },
    });
  });

  test('una domanda dall arretrato corretta conta solo come successivamente corretta', () => {
    const bank = { norme: [makeQuestion(0)] };
    const pending = [makePendingEntry({ questionKey: 'norme:0' })];

    let session = draw(
      createSession({ bank, pending, now: createFakeClock(10) })
    );
    session = answerCorrect(session);

    const summary = getSessionSummary(session, () => 20);

    expect(summary.totalUnique).toBe(1);
    expect(summary.firstAttemptCorrect).toBe(0);
    expect(summary.laterCorrected).toBe(1);
    expect(summary.stillPending).toBe(0);
    expect(summary.answeredCount).toBe(1);
  });

  test('rispetta l uguaglianza firstAttemptCorrect + laterCorrected + sbagliate di sessione', () => {
    let session = draw(
      createSession({
        bank: makeBank(),
        rng: createSeededRng(33),
        now: createFakeClock(),
      })
    );

    session = answerCorrect(session);
    session = draw(session);
    session = answerWrong(session);
    session = draw(session);

    const summary = getSessionSummary(session);
    const sbagliateNonCorrette = Array.from(session.records.values()).filter(
      (record) => record.wrongInSession && !record.correctedInSession
    ).length;

    expect(
      summary.firstAttemptCorrect + summary.laterCorrected + sbagliateNonCorrette
    ).toBe(summary.totalUnique);
    expect(summary.stillPending).toBeGreaterThanOrEqual(sbagliateNonCorrette);
  });

  test('non muta la sessione e gestisce una sessione assente', () => {
    let session = draw(createSession({ bank: makeBank() }));
    session = answerCorrect(session);
    const revision = session.pendingRevision;

    getSessionSummary(session, () => 1);

    expect(session.pendingRevision).toBe(revision);

    expect(getSessionSummary(null)).toEqual({
      totalUnique: 0,
      firstAttemptCorrect: 0,
      laterCorrected: 0,
      stillPending: 0,
      answeredCount: 0,
      startedAt: 0,
      endedAt: 0,
      storageWarning: null,
      coverage: {
        seenCount: 0,
        totalCount: 0,
        remainingCount: 0,
        percentage: 0,
      },
    });
  });
});

describe('learningEngine - copertura', () => {
  test('normalizza le voci scartando orfane e correggendo i campi derivati', () => {
    const index = buildQuestionIndex(makeBank());
    const normalized = normalizeCoverage(
      [
        makeCoverageEntry({ questionKey: 'inesistente:0' }),
        makeCoverageEntry({
          questionKey: 'meteo:0',
          sourceKey: 'meteo',
          questionId: 0,
          groupKey: 'aerodinamica',
        }),
        makeCoverageEntry({
          questionKey: 'norme:0',
          sourceKey: 'aerodinamica',
        }),
      ],
      index,
      () => 500
    );

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toEqual({
      questionKey: 'meteo:0',
      sourceKey: 'meteo',
      groupKey: 'meteo',
      questionId: 0,
      firstSeenAt: 100,
      lastSeenAt: 100,
      timesSeen: 1,
    });
  });

  test('ripara i timestamp mancanti e unisce i duplicati in modo monotono', () => {
    const index = buildQuestionIndex(makeBank());
    const normalized = normalizeCoverage(
      [
        makeCoverageEntry({
          questionKey: 'norme:0',
          firstSeenAt: 100,
          lastSeenAt: 200,
          timesSeen: 2,
        }),
        makeCoverageEntry({
          questionKey: 'norme:0',
          firstSeenAt: 50,
          lastSeenAt: 300,
          timesSeen: 5,
        }),
        makeCoverageEntry({
          questionKey: 'norme:1',
          questionId: 1,
          firstSeenAt: undefined,
          lastSeenAt: undefined,
          timesSeen: 0,
        }),
      ],
      index,
      () => 777
    );

    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toEqual(
      makeCoverageEntry({
        questionKey: 'norme:0',
        firstSeenAt: 50,
        lastSeenAt: 300,
        timesSeen: 5,
      })
    );
    expect(normalized[1]).toEqual(
      makeCoverageEntry({
        questionKey: 'norme:1',
        questionId: 1,
        firstSeenAt: 777,
        lastSeenAt: 777,
        timesSeen: 1,
      })
    );
  });

  test('ordina le voci per questionKey', () => {
    const index = buildQuestionIndex(makeBank());
    const normalized = normalizeCoverage(
      [
        makeCoverageEntry({ questionKey: 'norme:1', questionId: 1 }),
        makeCoverageEntry({ questionKey: 'meteo:0', sourceKey: 'meteo', questionId: 0 }),
      ],
      index
    );

    expect(normalized.map((entry) => entry.questionKey)).toEqual([
      'meteo:0',
      'norme:1',
    ]);
  });

  test('calcola il riepilogo della copertura con arrotondamento', () => {
    const coverage = new Map([
      ['a', makeCoverageEntry({ questionKey: 'a' })],
      ['b', makeCoverageEntry({ questionKey: 'b' })],
      ['c', makeCoverageEntry({ questionKey: 'c' })],
    ]);

    expect(computeCoverageSummary(coverage, 7)).toEqual({
      seenCount: 3,
      totalCount: 7,
      remainingCount: 4,
      percentage: 43,
    });
    expect(computeCoverageSummary([], 0)).toEqual({
      seenCount: 0,
      totalCount: 0,
      remainingCount: 0,
      percentage: 0,
    });
    expect(computeCoverageSummary(coverage, 2)).toEqual({
      seenCount: 2,
      totalCount: 2,
      remainingCount: 0,
      percentage: 100,
    });
  });

  test('registra la copertura quando viene disegnata una domanda nuova', () => {
    const result = drawNextQuestion(
      createSession({ bank: makeBank(), rng: createSeededRng(2), now: createFakeClock(500) })
    );

    expect(result.coverageChanged).toBe(true);
    const entry = result.session.coverage.get(result.current.questionKey);
    expect(entry).toBeDefined();
    expect(entry.timesSeen).toBe(1);
    expect(entry.firstSeenAt).toBe(entry.lastSeenAt);
  });

  test('registra il ripasso senza contare due volte la stessa domanda', () => {
    const bank = { norme: [makeQuestion(0)] };
    const pending = [makePendingEntry({ questionKey: 'norme:0' })];

    const first = drawNextQuestion(
      createSession({ bank, pending, now: createFakeClock(10) })
    );
    expect(first.current.source).toBe('review');
    expect(first.coverageChanged).toBe(true);
    expect(first.session.coverage.size).toBe(1);

    const second = drawNextQuestion(first.session);
    expect(second.coverageChanged).toBe(false);
    expect(second.session.coverage.size).toBe(1);
  });

  test('imposta coverageChanged a false quando current e gia valorizzato', () => {
    const session = draw(createSession({ bank: makeBank() }));
    const result = drawNextQuestion(session);

    expect(result.coverageChanged).toBe(false);
    expect(result.current).toBe(session.current);
  });

  test('imposta coverageChanged a false quando la sessione e esaurita', () => {
    const bank = { norme: [makeQuestion(0)] };
    let session = drawNextQuestion(createSession({ bank })).session;
    session = answerCorrect(session);
    const exhausted = drawNextQuestion(session);
    expect(exhausted.session.phase).toBe('exhausted');

    const again = drawNextQuestion(exhausted.session);
    expect(again.coverageChanged).toBe(false);
    expect(again.session.coverage.size).toBe(1);
  });

  test('non modifica la copertura della sessione originale', () => {
    const session = createSession({ bank: makeBank() });
    expect(session.coverage.size).toBe(0);

    drawNextQuestion(session);

    expect(session.coverage.size).toBe(0);
  });

  test('answerCurrent non altera la copertura', () => {
    let session = draw(createSession({ bank: makeBank() }));
    const before = Array.from(session.coverage.entries());

    session = answerCorrect(session);

    expect(Array.from(session.coverage.entries())).toEqual(before);
  });

  test('il riepilogo espone la copertura della sessione', () => {
    const bank = { norme: [makeQuestion(0), makeQuestion(1)] };
    let session = draw(createSession({ bank, now: createFakeClock(10) }));
    session = answerCorrect(session);
    session = draw(session);

    const summary = getSessionSummary(session, () => 20);

    expect(summary.coverage).toEqual({
      seenCount: 2,
      totalCount: 2,
      remainingCount: 0,
      percentage: 100,
    });
  });
});
