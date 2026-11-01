export const REVIEW_INTERVAL = 3;
export const TOTAL_WEIGHT = 110;

export const LEARNING_GROUPS = [
  {
    key: 'aerodinamica',
    label: 'Aerodinamica',
    weight: 20,
    sourceKeys: ['aerodinamica'],
  },
  {
    key: 'meteo',
    label: 'Meteorologia',
    weight: 20,
    sourceKeys: ['meteo'],
  },
  {
    key: 'tecnico',
    label: 'Tecnologia',
    weight: 10,
    sourceKeys: ['tecnico'],
  },
  {
    key: 'pilotaggio',
    label: 'Tecnica di pilotaggio',
    weight: 30,
    sourceKeys: ['pilotaggio'],
  },
  {
    key: 'emergenza',
    label: 'Operazioni e Emergenza',
    weight: 10,
    sourceKeys: ['emergenza'],
  },
  {
    key: 'circolazione',
    label: 'Circolazione aerea',
    weight: 10,
    sourceKeys: ['norme', 'navigazione', 'legislazione'],
  },
  {
    key: 'sicurezza',
    label: 'Sicurezza',
    weight: 10,
    sourceKeys: ['sicurezza'],
  },
];

const GROUP_BY_KEY = new Map(LEARNING_GROUPS.map((g) => [g.key, g]));
const GROUP_BY_SOURCE = new Map();
LEARNING_GROUPS.forEach((group) => {
  group.sourceKeys.forEach((sourceKey) => GROUP_BY_SOURCE.set(sourceKey, group));
});

const ANSWER_KEYS = ['A', 'B', 'C', 'D'];

function getAnswerText(question, key) {
  if (key === 'A') return question.risposta_a || '';
  if (key === 'B') return question.risposta_b || '';
  if (key === 'C') return question.risposta_c || '';
  if (key === 'D') return question.risposta_d || '';
  return '';
}

function isValidQuestion(question) {
  if (!question || typeof question !== 'object') return false;
  if (!Number.isFinite(question.id)) return false;
  if (typeof question.domanda !== 'string' || question.domanda.trim() === '') {
    return false;
  }
  if (typeof question.risposta_a !== 'string' || question.risposta_a.trim() === '') {
    return false;
  }
  if (typeof question.risposta_b !== 'string' || question.risposta_b.trim() === '') {
    return false;
  }
  if (![2, 3, 4].includes(question.num_risposte)) return false;
  if (!ANSWER_KEYS.includes(question.esatta)) return false;
  if (question.num_risposte < 3 && question.esatta !== 'A' && question.esatta !== 'B') {
    return false;
  }
  if (question.num_risposte < 4 && question.esatta === 'D') return false;
  if (getAnswerText(question, question.esatta).trim() === '') return false;
  return true;
}

export function buildQuestionIndex(bank) {
  const byKey = new Map();
  const byGroup = new Map(LEARNING_GROUPS.map((group) => [group.key, []]));
  const invalid = [];

  if (!bank || typeof bank !== 'object') {
    return { byKey, byGroup, invalid };
  }

  LEARNING_GROUPS.forEach((group) => {
    group.sourceKeys.forEach((sourceKey) => {
      const questions = bank[sourceKey];
      if (!Array.isArray(questions)) return;

      questions.forEach((question, index) => {
        if (!isValidQuestion(question)) {
          invalid.push({
            sourceKey,
            index,
            reason: 'domanda non valida',
          });
          return;
        }

        const questionKey = `${sourceKey}:${question.id}`;
        if (byKey.has(questionKey)) {
          invalid.push({
            sourceKey,
            index,
            reason: 'chiave duplicata',
          });
          return;
        }

        const entry = {
          question,
          sourceKey,
          groupKey: group.key,
          questionKey,
        };
        byKey.set(questionKey, entry);
        byGroup.get(group.key).push(entry);
      });
    });
  });

  return { byKey, byGroup, invalid };
}

export function getQuestionOptions(question) {
  if (!question || typeof question !== 'object') return [];
  const total = Math.max(2, Math.min(4, Number(question.num_risposte) || 2));
  const options = [];

  for (let i = 0; i < total; i += 1) {
    const key = ANSWER_KEYS[i];
    const text = getAnswerText(question, key);
    if (typeof text === 'string' && text.trim() !== '') {
      options.push({ key, text });
    }
  }

  return options;
}

export function getGroupLabel(groupKey) {
  const group = GROUP_BY_KEY.get(groupKey);
  return group ? group.label : groupKey;
}

function cloneSession(session) {
  return {
    ...session,
    pools: new Map(
      Array.from(session.pools.entries()).map(([key, value]) => [key, [...value]])
    ),
    seenKeys: new Set(session.seenKeys),
    pending: session.pending.map((entry) => ({ ...entry })),
    coverage: new Map(
      Array.from((session.coverage || new Map()).entries()).map(
        ([key, value]) => [key, { ...value }]
      )
    ),
    records: new Map(
      Array.from(session.records.entries()).map(([key, value]) => [
        key,
        { ...value },
      ])
    ),
  };
}

function isTimestamp(value) {
  return Number.isFinite(value) && value >= 0;
}

function normalizeTimestamp(value, fallback) {
  return isTimestamp(value) ? value : fallback;
}

function normalizePending(pending, index, now) {
  if (!Array.isArray(pending)) return [];

  const merged = new Map();

  pending.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    if (typeof entry.questionKey !== 'string') return;

    const questionEntry = index.byKey.get(entry.questionKey);
    if (!questionEntry) return;

    const firstWrongAt = isTimestamp(entry.firstWrongAt)
      ? entry.firstWrongAt
      : now();
    const lastWrongAt = normalizeTimestamp(entry.lastWrongAt, firstWrongAt);
    const lastProposedAt = normalizeTimestamp(
      entry.lastProposedAt,
      lastWrongAt
    );
    const wrongCount = Number.isFinite(entry.wrongCount) && entry.wrongCount > 0
      ? Math.floor(entry.wrongCount)
      : 1;
    // Numero di nuove domande affrontate dopo l'ultimo errore.
    // Le voci provenienti da versioni precedenti (senza il campo) sono
    // considerate già mature e quindi subito riproponibili.
    const newSinceWrong =
      Number.isFinite(entry.newSinceWrong) && entry.newSinceWrong >= 0
        ? Math.floor(entry.newSinceWrong)
        : REVIEW_INTERVAL;

    const normalized = {
      questionKey: entry.questionKey,
      sourceKey: questionEntry.sourceKey,
      groupKey: questionEntry.groupKey,
      questionId: questionEntry.question.id,
      firstWrongAt,
      lastWrongAt,
      lastProposedAt,
      wrongCount,
      newSinceWrong,
    };

    const existing = merged.get(normalized.questionKey);
    if (!existing) {
      merged.set(normalized.questionKey, normalized);
      return;
    }

    merged.set(normalized.questionKey, {
      ...existing,
      firstWrongAt: Math.min(existing.firstWrongAt, normalized.firstWrongAt),
      lastWrongAt: Math.max(existing.lastWrongAt, normalized.lastWrongAt),
      lastProposedAt: Math.max(
        existing.lastProposedAt,
        normalized.lastProposedAt
      ),
      wrongCount: Math.max(existing.wrongCount, normalized.wrongCount),
      newSinceWrong: Math.max(
        existing.newSinceWrong,
        normalized.newSinceWrong
      ),
    });
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.lastProposedAt !== b.lastProposedAt) {
      return a.lastProposedAt - b.lastProposedAt;
    }
    if (a.firstWrongAt !== b.firstWrongAt) {
      return a.firstWrongAt - b.firstWrongAt;
    }
    return a.questionKey.localeCompare(b.questionKey);
  });
}

function normalizeCoverageEntry(entry, index, now) {
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.questionKey !== 'string' || entry.questionKey === '') {
    return null;
  }

  const questionEntry = index.byKey.get(entry.questionKey);
  if (!questionEntry) return null;
  if (
    entry.sourceKey !== undefined &&
    entry.sourceKey !== questionEntry.sourceKey
  ) {
    return null;
  }
  if (
    entry.questionId !== undefined &&
    entry.questionId !== questionEntry.question.id
  ) {
    return null;
  }

  const firstSeenAt = isTimestamp(entry.firstSeenAt) ? entry.firstSeenAt : now();
  const lastSeenCandidate = isTimestamp(entry.lastSeenAt)
    ? entry.lastSeenAt
    : firstSeenAt;
  const lastSeenAt = Math.max(firstSeenAt, lastSeenCandidate);
  const timesSeen =
    Number.isFinite(entry.timesSeen) && entry.timesSeen >= 1
      ? Math.floor(entry.timesSeen)
      : 1;

  return {
    questionKey: entry.questionKey,
    sourceKey: questionEntry.sourceKey,
    groupKey: questionEntry.groupKey,
    questionId: questionEntry.question.id,
    firstSeenAt,
    lastSeenAt,
    timesSeen,
  };
}

function mergeCoverageEntries(existing, normalized) {
  return {
    ...existing,
    firstSeenAt: Math.min(existing.firstSeenAt, normalized.firstSeenAt),
    lastSeenAt: Math.max(existing.lastSeenAt, normalized.lastSeenAt),
    timesSeen: Math.max(existing.timesSeen, normalized.timesSeen),
  };
}

/**
 * Normalizza l'elenco delle domande incontrate rispetto all'archivio.
 * Scarta voci orfane o incoerenti, ripara i campi mancanti e unisce i duplicati.
 */
export function normalizeCoverage(coverage, index, now = Date.now) {
  if (!Array.isArray(coverage)) return [];

  const merged = new Map();

  coverage.forEach((entry) => {
    const normalized = normalizeCoverageEntry(entry, index, now);
    if (!normalized) return;

    const existing = merged.get(normalized.questionKey);
    if (!existing) {
      merged.set(normalized.questionKey, normalized);
      return;
    }
    merged.set(normalized.questionKey, mergeCoverageEntries(existing, normalized));
  });

  return Array.from(merged.values()).sort((a, b) =>
    a.questionKey.localeCompare(b.questionKey)
  );
}

/**
 * Calcola il riepilogo della copertura a partire da una Map o da un array.
 */
export function computeCoverageSummary(coverage, totalCount) {
  const total =
    Number.isFinite(totalCount) && totalCount > 0 ? Math.floor(totalCount) : 0;
  let seenCount = 0;

  if (coverage instanceof Map) {
    seenCount = coverage.size;
  } else if (Array.isArray(coverage)) {
    const keys = new Set();
    coverage.forEach((entry) => {
      if (entry && typeof entry.questionKey === 'string') {
        keys.add(entry.questionKey);
      }
    });
    seenCount = keys.size;
  }

  seenCount = Math.max(0, Math.min(seenCount, total));

  return {
    seenCount,
    totalCount: total,
    remainingCount: Math.max(0, total - seenCount),
    percentage: total > 0 ? Math.round((seenCount / total) * 100) : 0,
  };
}

function markEncountered(session, questionEntry, timestamp = session.now()) {
  const existing = session.coverage.get(questionEntry.questionKey);

  if (existing) {
    existing.lastSeenAt = Math.max(existing.lastSeenAt, timestamp);
    existing.timesSeen += 1;
    return;
  }

  session.coverage.set(questionEntry.questionKey, {
    questionKey: questionEntry.questionKey,
    sourceKey: questionEntry.sourceKey,
    groupKey: questionEntry.groupKey,
    questionId: questionEntry.question.id,
    firstSeenAt: timestamp,
    lastSeenAt: timestamp,
    timesSeen: 1,
  });
}

function hasNewQuestions(session) {
  return Array.from(session.pools.values()).some((pool) => pool.length > 0);
}

function makeCurrent(entry, source, pendingAtPresentation) {
  return {
    question: entry.question,
    questionKey: entry.questionKey,
    groupKey: entry.groupKey,
    groupLabel: getGroupLabel(entry.groupKey),
    source,
    pendingAtPresentation,
    selectedAnswer: null,
    feedback: null,
  };
}

export function createSession({
  bank,
  pending = [],
  coverage = [],
  rng = Math.random,
  now = Date.now,
} = {}) {
  const index = buildQuestionIndex(bank);
  const pendingList = normalizePending(pending, index, now);
  const pendingKeys = new Set(pendingList.map((entry) => entry.questionKey));
  const rawCoverage = coverage instanceof Map
    ? Array.from(coverage.values())
    : coverage;
  const coverageList = normalizeCoverage(rawCoverage, index, now);
  const coverageMap = new Map(
    coverageList.map((entry) => [entry.questionKey, entry])
  );

  const pools = new Map();
  LEARNING_GROUPS.forEach((group) => {
    const entries = index.byGroup.get(group.key) || [];
    pools.set(
      group.key,
      entries.filter((entry) => !pendingKeys.has(entry.questionKey))
    );
  });

  const hasAnyPool = Array.from(pools.values()).some((pool) => pool.length > 0);
  const bankIsUsable = index.byKey.size > 0;

  return {
    pools,
    seenKeys: new Set(),
    pending: pendingList,
    coverage: coverageMap,
    coverageTotal: index.byKey.size,
    newSinceReview: 0,
    records: new Map(),
    current: null,
    phase: hasAnyPool || pendingList.length > 0 ? 'answering' : 'exhausted',
    answeredCount: 0,
    pendingRevision: 0,
    startedAt: now(),
    storageWarning: null,
    error: bankIsUsable ? null : 'INVALID_BANK',
    invalid: index.invalid,
    index,
    rng,
    now,
  };
}

function pickWeightedGroup(session) {
  const available = LEARNING_GROUPS.filter(
    (group) => (session.pools.get(group.key) || []).length > 0
  );

  if (available.length === 0) return null;

  const total = available.reduce((sum, group) => sum + group.weight, 0);
  let target = session.rng() * total;

  for (const group of available) {
    target -= group.weight;
    if (target < 0) return group;
  }

  return available[available.length - 1];
}

function pickReviewEntry(session) {
  if (session.pending.length === 0) return null;

  // Una domanda sbagliata può essere riproposta solo dopo che sono state
  // affrontate altre REVIEW_INTERVAL domande nuove.
  const eligible = session.pending.filter(
    (entry) => entry.newSinceWrong >= REVIEW_INTERVAL
  );
  if (eligible.length === 0) return null;

  let selected = null;
  eligible.forEach((entry) => {
    if (!selected) {
      selected = entry;
      return;
    }
    if (entry.lastProposedAt !== selected.lastProposedAt) {
      if (entry.lastProposedAt < selected.lastProposedAt) selected = entry;
      return;
    }
    if (entry.firstWrongAt !== selected.firstWrongAt) {
      if (entry.firstWrongAt < selected.firstWrongAt) selected = entry;
      return;
    }
    if (entry.questionKey.localeCompare(selected.questionKey) < 0) {
      selected = entry;
    }
  });

  return selected;
}

export function drawNextQuestion(session) {
  if (!session) {
    return {
      session,
      current: null,
      pendingRevisionChanged: false,
      coverageChanged: false,
      error: 'NO_SESSION',
    };
  }

  const next = cloneSession(session);

  if (next.phase === 'feedback') {
    next.current = null;
    next.phase = 'answering';
  }

  if (next.phase === 'exhausted') {
    return {
      session: next,
      current: null,
      pendingRevisionChanged: false,
      coverageChanged: false,
    };
  }

  if (next.current) {
    return {
      session: next,
      current: next.current,
      pendingRevisionChanged: false,
      coverageChanged: false,
    };
  }

  const newQuestionsAvailable = hasNewQuestions(next);
  const hasEligibleReview = next.pending.some(
    (entry) => entry.newSinceWrong >= REVIEW_INTERVAL
  );
  const shouldReview =
    hasEligibleReview &&
    (next.newSinceReview >= REVIEW_INTERVAL || !newQuestionsAvailable);

  if (shouldReview) {
    const reviewEntry = pickReviewEntry(next);
    const questionEntry = reviewEntry
      ? next.index.byKey.get(reviewEntry.questionKey)
      : null;

    if (reviewEntry && questionEntry) {
      const presentationTimestamp = next.now();
      reviewEntry.lastProposedAt = presentationTimestamp;
      next.newSinceReview = 0;
      next.pendingRevision += 1;
      next.current = makeCurrent(questionEntry, 'review', true);
      next.phase = 'answering';
      markEncountered(next, questionEntry, presentationTimestamp);
      return {
        session: next,
        current: next.current,
        pendingRevisionChanged: true,
        coverageChanged: true,
      };
    }

    next.pending = next.pending.filter(
      (entry) => entry.questionKey !== reviewEntry?.questionKey
    );
  }

  if (!newQuestionsAvailable) {
    next.current = null;
    next.phase = 'exhausted';
    return {
      session: next,
      current: null,
      pendingRevisionChanged: false,
      coverageChanged: false,
    };
  }

  const group = pickWeightedGroup(next);
  if (!group) {
    next.current = null;
    next.phase = 'exhausted';
    return {
      session: next,
      current: null,
      pendingRevisionChanged: false,
      coverageChanged: false,
    };
  }

  const pool = next.pools.get(group.key);
  const index = Math.min(pool.length - 1, Math.floor(next.rng() * pool.length));
  const [questionEntry] = pool.splice(index, 1);
  next.seenKeys.add(questionEntry.questionKey);
  next.newSinceReview += 1;
  next.current = makeCurrent(questionEntry, 'new', false);
  next.phase = 'answering';
  markEncountered(next, questionEntry);

  return {
    session: next,
    current: next.current,
    pendingRevisionChanged: false,
    coverageChanged: true,
  };
}

export function answerCurrent(session, answerKey) {
  if (!session || !session.current) {
    return { error: 'NO_CURRENT_QUESTION' };
  }
  if (session.phase !== 'answering') {
    return { error: 'INVALID_PHASE' };
  }

  const options = getQuestionOptions(session.current.question);
  if (!options.some((option) => option.key === answerKey)) {
    return { error: 'INVALID_ANSWER' };
  }

  const next = cloneSession(session);
  const current = next.current;
  const question = current.question;
  const correct = answerKey === question.esatta;
  const correctAnswerText = getAnswerText(question, question.esatta);
  const selectedAnswerText = getAnswerText(question, answerKey);

  const record = next.records.get(current.questionKey) || {
    questionKey: current.questionKey,
    groupKey: current.groupKey,
    presentedAs: current.source,
    pendingAtPresentation: current.pendingAtPresentation,
    firstAnswerCorrect: false,
    wrongInSession: false,
    correctedInSession: false,
    answerCount: 0,
  };

  const isFirstAnswer = record.answerCount === 0;
  record.answerCount += 1;

  if (isFirstAnswer) {
    record.firstAnswerCorrect = correct && !current.pendingAtPresentation;
  }
  if (!correct) {
    record.wrongInSession = true;
  }
  if (correct && (record.wrongInSession || current.pendingAtPresentation)) {
    record.correctedInSession = true;
  }

  next.records.set(current.questionKey, record);

  let pendingRevisionChanged = false;

  // Solo le domande nuove fanno avanzare il contatore di attesa dei ripassi.
  // La domanda appena sbagliata non conta se stessa.
  if (current.source === 'new' && next.pending.length > 0) {
    next.pending.forEach((entry) => {
      entry.newSinceWrong =
        (Number.isFinite(entry.newSinceWrong) ? entry.newSinceWrong : 0) + 1;
    });
    pendingRevisionChanged = true;
  }

  const pendingIndex = next.pending.findIndex(
    (entry) => entry.questionKey === current.questionKey
  );
  const wasPending = pendingIndex >= 0 || current.pendingAtPresentation;

  if (!correct) {
    const timestamp = next.now();
    if (pendingIndex >= 0) {
      const entry = next.pending[pendingIndex];
      entry.wrongCount += 1;
      entry.lastWrongAt = timestamp;
      entry.lastProposedAt = timestamp;
      entry.newSinceWrong = 0;
    } else {
      next.pending.push({
        questionKey: current.questionKey,
        sourceKey: question.sourceKey || current.questionKey.split(':')[0],
        groupKey: current.groupKey,
        questionId: question.id,
        firstWrongAt: timestamp,
        lastWrongAt: timestamp,
        lastProposedAt: timestamp,
        wrongCount: 1,
        newSinceWrong: 0,
      });
    }
    pendingRevisionChanged = true;
  } else if (pendingIndex >= 0) {
    next.pending.splice(pendingIndex, 1);
    pendingRevisionChanged = true;
  }

  if (pendingRevisionChanged) {
    next.pendingRevision += 1;
  }

  const feedback = {
    correct,
    correctAnswer: question.esatta,
    correctAnswerText,
    selectedAnswer: answerKey,
    selectedAnswerText,
    wasPending,
    pendingCount: next.pending.length,
  };

  next.current = {
    ...current,
    selectedAnswer: answerKey,
    feedback,
  };
  next.phase = 'feedback';
  next.answeredCount += 1;

  return {
    session: next,
    feedback,
    pendingRevisionChanged,
  };
}

export function getSessionSummary(session, now) {
  if (!session) {
    return {
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
    };
  }

  let firstAttemptCorrect = 0;
  let laterCorrected = 0;
  let answeredCount = 0;

  session.records.forEach((record) => {
    if (record.answerCount > 0) {
      if (record.firstAnswerCorrect) firstAttemptCorrect += 1;
      if (record.correctedInSession) laterCorrected += 1;
      answeredCount += record.answerCount;
    }
  });

  const clock = typeof now === 'function' ? now : session.now || Date.now;
  const totalCount =
    session.index && session.index.byKey ? session.index.byKey.size : 0;
  const knownCoverage = new Map();

  if (session.coverage instanceof Map && session.index) {
    session.coverage.forEach((entry, key) => {
      if (session.index.byKey.has(key)) knownCoverage.set(key, entry);
    });
  }

  return {
    totalUnique: session.records.size,
    firstAttemptCorrect,
    laterCorrected,
    stillPending: session.pending.length,
    answeredCount,
    startedAt: session.startedAt,
    endedAt: clock(),
    storageWarning: session.storageWarning || null,
    coverage: computeCoverageSummary(knownCoverage, totalCount),
  };
}

export default {
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
};
