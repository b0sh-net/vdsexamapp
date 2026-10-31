import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEARNING_GROUPS, buildQuestionIndex } from './learningEngine';

export const STORAGE_KEY = '@vds/learning/pending/v1';
export const STORAGE_VERSION = 1;
export const STORAGE_WARNING =
  "Impossibile salvare le domande da ripassare. La sessione continua, ma l'arretrato potrebbe non essere conservato.";

const GROUP_KEYS = new Set(LEARNING_GROUPS.map((group) => group.key));

let writeQueue = Promise.resolve();

function isTimestamp(value) {
  return Number.isFinite(value) && value >= 0;
}

function normalizeWrongCount(value) {
  if (Number.isFinite(value) && value >= 1) return Math.floor(value);
  return 1;
}

function sortPending(pending) {
  return pending.sort((a, b) => {
    if (a.lastProposedAt !== b.lastProposedAt) {
      return a.lastProposedAt - b.lastProposedAt;
    }
    if (a.firstWrongAt !== b.firstWrongAt) {
      return a.firstWrongAt - b.firstWrongAt;
    }
    return a.questionKey.localeCompare(b.questionKey);
  });
}

function mergeEntries(existing, normalized) {
  return {
    ...existing,
    firstWrongAt: Math.min(existing.firstWrongAt, normalized.firstWrongAt),
    lastWrongAt: Math.max(existing.lastWrongAt, normalized.lastWrongAt),
    lastProposedAt: Math.max(
      existing.lastProposedAt,
      normalized.lastProposedAt
    ),
    wrongCount: Math.max(existing.wrongCount, normalized.wrongCount),
  };
}

/**
 * Valida e normalizza le voci lette dallo storage rispetto all'archivio.
 * Restituisce l'elenco pulito e un flag che indica se sono state fatte modifiche.
 */
export function normalizePending(rawList, bank, now = Date.now) {
  if (!Array.isArray(rawList)) {
    return { pending: [], changed: true };
  }

  const index = buildQuestionIndex(bank);
  const merged = new Map();
  let changed = false;

  rawList.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      changed = true;
      return;
    }
    if (typeof entry.questionKey !== 'string' || entry.questionKey === '') {
      changed = true;
      return;
    }
    if (typeof entry.sourceKey !== 'string' || entry.sourceKey === '') {
      changed = true;
      return;
    }
    if (!Number.isFinite(entry.questionId)) {
      changed = true;
      return;
    }

    const questionEntry = index.byKey.get(entry.questionKey);
    if (!questionEntry) {
      // Voce orfana: la domanda non esiste piu nell'archivio.
      changed = true;
      return;
    }
    if (
      entry.sourceKey !== questionEntry.sourceKey ||
      entry.questionId !== questionEntry.question.id
    ) {
      // Identita incoerente con la chiave composta.
      changed = true;
      return;
    }
    if (entry.groupKey !== questionEntry.groupKey) {
      changed = true;
    }

    const firstWrongAt = isTimestamp(entry.firstWrongAt)
      ? entry.firstWrongAt
      : now();
    const lastWrongAt = isTimestamp(entry.lastWrongAt)
      ? entry.lastWrongAt
      : firstWrongAt;
    const lastProposedAt = isTimestamp(entry.lastProposedAt)
      ? entry.lastProposedAt
      : lastWrongAt;
    const wrongCount = normalizeWrongCount(entry.wrongCount);

    if (
      firstWrongAt !== entry.firstWrongAt ||
      lastWrongAt !== entry.lastWrongAt ||
      lastProposedAt !== entry.lastProposedAt ||
      wrongCount !== entry.wrongCount
    ) {
      changed = true;
    }

    const normalized = {
      questionKey: entry.questionKey,
      sourceKey: questionEntry.sourceKey,
      groupKey: questionEntry.groupKey,
      questionId: questionEntry.question.id,
      firstWrongAt,
      lastWrongAt,
      lastProposedAt,
      wrongCount,
    };

    const existing = merged.get(normalized.questionKey);
    if (!existing) {
      merged.set(normalized.questionKey, normalized);
      return;
    }

    changed = true;
    merged.set(
      normalized.questionKey,
      mergeEntries(existing, normalized)
    );
  });

  return { pending: sortPending(Array.from(merged.values())), changed };
}

function sanitizeForWrite(entries) {
  if (!Array.isArray(entries)) return null;

  const merged = new Map();
  entries.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    if (typeof entry.questionKey !== 'string' || entry.questionKey === '') {
      return;
    }
    if (typeof entry.sourceKey !== 'string' || entry.sourceKey === '') return;
    if (!GROUP_KEYS.has(entry.groupKey)) return;
    if (!Number.isFinite(entry.questionId)) return;

    const normalized = {
      questionKey: entry.questionKey,
      sourceKey: entry.sourceKey,
      groupKey: entry.groupKey,
      questionId: entry.questionId,
      firstWrongAt: isTimestamp(entry.firstWrongAt) ? entry.firstWrongAt : 0,
      lastWrongAt: isTimestamp(entry.lastWrongAt) ? entry.lastWrongAt : 0,
      lastProposedAt: isTimestamp(entry.lastProposedAt)
        ? entry.lastProposedAt
        : 0,
      wrongCount: normalizeWrongCount(entry.wrongCount),
    };

    const existing = merged.get(normalized.questionKey);
    if (!existing) {
      merged.set(normalized.questionKey, normalized);
      return;
    }
    merged.set(normalized.questionKey, mergeEntries(existing, normalized));
  });

  return sortPending(Array.from(merged.values()));
}

function enqueueWrite(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(() => undefined);
  return run;
}

/**
 * Carica l'arretrato persistente validandolo rispetto all'archivio domande.
 * Non lancia eccezioni: in caso di problemi restituisce un elenco vuoto e un avviso.
 */
export async function loadPending(bank, now = Date.now) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) {
      return { pending: [], warning: null };
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      overwriteWithEmpty();
      return { pending: [], warning: STORAGE_WARNING };
    }

    if (
      !payload ||
      typeof payload !== 'object' ||
      payload.version !== STORAGE_VERSION ||
      !Array.isArray(payload.pending)
    ) {
      overwriteWithEmpty();
      return { pending: [], warning: STORAGE_WARNING };
    }

    const { pending, changed } = normalizePending(payload.pending, bank, now);
    if (changed) {
      savePending(pending);
    }

    return { pending, warning: null };
  } catch (error) {
    return { pending: [], warning: STORAGE_WARNING };
  }
}

function overwriteWithEmpty() {
  savePending([]);
}

/**
 * Salva l'arretrato con una coda seriale per evitare scritture concorrenti.
 * Restituisce { warning } senza lanciare eccezioni.
 */
export function savePending(entries) {
  const pending = sanitizeForWrite(entries);
  if (pending === null) {
    return Promise.resolve({ warning: STORAGE_WARNING });
  }

  const payload = {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    pending,
  };
  const serialized = JSON.stringify(payload);

  return enqueueWrite(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
      return { warning: null };
    } catch (error) {
      return { warning: STORAGE_WARNING };
    }
  });
}

export default {
  STORAGE_KEY,
  STORAGE_VERSION,
  STORAGE_WARNING,
  loadPending,
  savePending,
  normalizePending,
};
