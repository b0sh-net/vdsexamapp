// Formato di trasferimento dei dati di addestramento: costruzione, parsing e merge.
// Modulo puro: non importa moduli di piattaforma e non lancia eccezioni.

import { buildQuestionIndex, computeCoverageSummary } from './learningEngine';

export const EXPORT_FORMAT = 'vds-training-data';
export const EXPORT_VERSION = 1;

export const TRANSFER_ERRORS = {
  INVALID_JSON: 'INVALID_JSON',
  INVALID_FORMAT: 'INVALID_FORMAT',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  INVALID_SHAPE: 'INVALID_SHAPE',
  INVALID_ARCHIVE_DATA: 'INVALID_ARCHIVE_DATA',
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeInteger(value) {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function sortByQuestionKey(entries) {
  return entries.sort((a, b) => a.questionKey.localeCompare(b.questionKey));
}

function toCoverageList(coverage) {
  if (coverage instanceof Map) return Array.from(coverage.values());
  return Array.isArray(coverage) ? coverage : [];
}

function toPendingList(pending) {
  return Array.isArray(pending) ? pending : [];
}

function normalizeCoverageAgainstArchive(entries, index) {
  const merged = new Map();

  entries.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const questionEntry = index.byKey.get(entry.questionKey);
    if (!questionEntry) return;

    const firstSeenAt = isNonNegativeInteger(entry.firstSeenAt)
      ? entry.firstSeenAt
      : 0;
    const lastSeenAt = isNonNegativeInteger(entry.lastSeenAt)
      ? Math.max(firstSeenAt, entry.lastSeenAt)
      : firstSeenAt;
    const timesSeen =
      isFiniteNumber(entry.timesSeen) && entry.timesSeen >= 1
        ? Math.floor(entry.timesSeen)
        : 1;

    const normalized = {
      questionKey: questionEntry.questionKey,
      sourceKey: questionEntry.sourceKey,
      groupKey: questionEntry.groupKey,
      questionId: questionEntry.question.id,
      firstSeenAt,
      lastSeenAt,
      timesSeen,
    };

    const existing = merged.get(normalized.questionKey);
    if (!existing) {
      merged.set(normalized.questionKey, normalized);
      return;
    }
    merged.set(normalized.questionKey, {
      ...existing,
      firstSeenAt: Math.min(existing.firstSeenAt, normalized.firstSeenAt),
      lastSeenAt: Math.max(existing.lastSeenAt, normalized.lastSeenAt),
      timesSeen: Math.max(existing.timesSeen, normalized.timesSeen),
    });
  });

  return sortByQuestionKey(Array.from(merged.values()));
}

function normalizePendingAgainstArchive(entries, index) {
  const merged = new Map();

  entries.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const questionEntry = index.byKey.get(entry.questionKey);
    if (!questionEntry) return;

    const firstWrongAt = isNonNegativeInteger(entry.firstWrongAt)
      ? entry.firstWrongAt
      : 0;
    const lastWrongAt = isNonNegativeInteger(entry.lastWrongAt)
      ? Math.max(firstWrongAt, entry.lastWrongAt)
      : firstWrongAt;
    const lastProposedAt = isNonNegativeInteger(entry.lastProposedAt)
      ? Math.max(lastWrongAt, entry.lastProposedAt)
      : lastWrongAt;
    const wrongCount =
      isFiniteNumber(entry.wrongCount) && entry.wrongCount >= 1
        ? Math.floor(entry.wrongCount)
        : 1;
    const newSinceWrong = isNonNegativeInteger(entry.newSinceWrong)
      ? entry.newSinceWrong
      : 0;

    const normalized = {
      questionKey: questionEntry.questionKey,
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

  return sortByQuestionKey(Array.from(merged.values()));
}

/**
 * Costruisce il documento JSON esportabile a partire dai dati locali.
 * Il riepilogo è sempre derivato dai dati, mai da input esterni.
 */
export function buildExportPayload({ coverage, pending, bank, now = Date.now } = {}) {
  const index = buildQuestionIndex(bank);
  const coverageList = normalizeCoverageAgainstArchive(
    toCoverageList(coverage),
    index
  );
  const pendingList = normalizePendingAgainstArchive(toPendingList(pending), index);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: typeof now === 'function' ? now() : now,
    summary: computeCoverageSummary(coverageList, index.byKey.size),
    coverage: coverageList,
    pending: pendingList,
  };
}

function isCoverageEntryShape(entry) {
  return (
    entry &&
    typeof entry === 'object' &&
    typeof entry.questionKey === 'string' &&
    entry.questionKey !== '' &&
    typeof entry.sourceKey === 'string' &&
    typeof entry.groupKey === 'string' &&
    isNonNegativeInteger(entry.questionId) &&
    isNonNegativeInteger(entry.firstSeenAt) &&
    isNonNegativeInteger(entry.lastSeenAt) &&
    isFiniteNumber(entry.timesSeen) &&
    entry.timesSeen >= 1
  );
}

function isPendingEntryShape(entry) {
  return (
    entry &&
    typeof entry === 'object' &&
    typeof entry.questionKey === 'string' &&
    entry.questionKey !== '' &&
    typeof entry.sourceKey === 'string' &&
    typeof entry.groupKey === 'string' &&
    isNonNegativeInteger(entry.questionId) &&
    isNonNegativeInteger(entry.firstWrongAt) &&
    isNonNegativeInteger(entry.lastWrongAt) &&
    isNonNegativeInteger(entry.lastProposedAt) &&
    isFiniteNumber(entry.wrongCount) &&
    entry.wrongCount >= 1 &&
    isNonNegativeInteger(entry.newSinceWrong)
  );
}

/**
 * Interpreta il testo di un file esportato.
 * Restituisce { ok: true, data } oppure { ok: false, error }.
 */
export function parseExportPayload(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: TRANSFER_ERRORS.INVALID_JSON };
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: TRANSFER_ERRORS.INVALID_JSON };
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: TRANSFER_ERRORS.INVALID_SHAPE };
  }

  if (payload.format !== EXPORT_FORMAT) {
    return { ok: false, error: TRANSFER_ERRORS.INVALID_FORMAT };
  }

  if (payload.version !== EXPORT_VERSION) {
    return { ok: false, error: TRANSFER_ERRORS.UNSUPPORTED_VERSION };
  }

  if (
    !isNonNegativeInteger(payload.exportedAt) ||
    !payload.summary ||
    typeof payload.summary !== 'object' ||
    Array.isArray(payload.summary) ||
    !isNonNegativeInteger(payload.summary.seenCount) ||
    !isNonNegativeInteger(payload.summary.totalCount) ||
    !isNonNegativeInteger(payload.summary.remainingCount) ||
    !isNonNegativeInteger(payload.summary.percentage) ||
    payload.summary.percentage > 100 ||
    !Array.isArray(payload.coverage) ||
    !Array.isArray(payload.pending) ||
    !payload.coverage.every(isCoverageEntryShape) ||
    !payload.pending.every(isPendingEntryShape)
  ) {
    return { ok: false, error: TRANSFER_ERRORS.INVALID_SHAPE };
  }

  return { ok: true, data: payload };
}

function addPendingKeysToCoverage(coverageByKey, pendingList) {
  pendingList.forEach((entry) => {
    if (coverageByKey.has(entry.questionKey)) return;
    const firstSeenAt = entry.firstWrongAt;
    const lastSeenAt = Math.max(firstSeenAt, entry.lastProposedAt);
    coverageByKey.set(entry.questionKey, {
      questionKey: entry.questionKey,
      sourceKey: entry.sourceKey,
      groupKey: entry.groupKey,
      questionId: entry.questionId,
      firstSeenAt,
      lastSeenAt,
      timesSeen: 1,
    });
  });
}

/**
 * Unisce i dati importati a quelli locali con regole monotone.
 * Qualsiasi voce non presente nell'archivio invalida l'intero file.
 */
export function mergeTrainingData(
  local,
  imported,
  bank,
  now = Date.now
) {
  const index = buildQuestionIndex(bank);
  const localCoverage = normalizeCoverageAgainstArchive(
    toCoverageList(local && local.coverage),
    index
  );
  const localPending = normalizePendingAgainstArchive(
    toPendingList(local && local.pending),
    index
  );
  const importedCoverage = toCoverageList(imported && imported.coverage);
  const importedPending = toPendingList(imported && imported.pending);

  const invalidEntry = [...importedCoverage, ...importedPending].find(
    (entry) =>
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.questionKey !== 'string' ||
      !index.byKey.has(entry.questionKey)
  );
  if (invalidEntry) {
    return { ok: false, error: TRANSFER_ERRORS.INVALID_ARCHIVE_DATA };
  }

  const coverageByKey = new Map(
    localCoverage.map((entry) => [entry.questionKey, entry])
  );
  const pendingByKey = new Map(
    localPending.map((entry) => [entry.questionKey, entry])
  );

  const cleanImportedCoverage = normalizeCoverageAgainstArchive(
    importedCoverage,
    index
  );
  const cleanImportedPending = normalizePendingAgainstArchive(
    importedPending,
    index
  );

  let pendingAdded = 0;
  let pendingUpdated = 0;

  cleanImportedCoverage.forEach((entry) => {
    const existing = coverageByKey.get(entry.questionKey);
    if (!existing) {
      coverageByKey.set(entry.questionKey, entry);
      return;
    }
    coverageByKey.set(entry.questionKey, {
      ...existing,
      firstSeenAt: Math.min(existing.firstSeenAt, entry.firstSeenAt),
      lastSeenAt: Math.max(existing.lastSeenAt, entry.lastSeenAt),
      timesSeen: Math.max(existing.timesSeen, entry.timesSeen),
    });
  });

  cleanImportedPending.forEach((entry) => {
    const existing = pendingByKey.get(entry.questionKey);
    if (!existing) {
      pendingByKey.set(entry.questionKey, entry);
      pendingAdded += 1;
      return;
    }

    const merged = {
      ...existing,
      firstWrongAt: Math.min(existing.firstWrongAt, entry.firstWrongAt),
      lastWrongAt: Math.max(existing.lastWrongAt, entry.lastWrongAt),
      lastProposedAt: Math.max(
        existing.lastProposedAt,
        entry.lastProposedAt
      ),
      wrongCount: Math.max(existing.wrongCount, entry.wrongCount),
      newSinceWrong: Math.max(
        existing.newSinceWrong,
        entry.newSinceWrong
      ),
    };

    const changed =
      merged.firstWrongAt !== existing.firstWrongAt ||
      merged.lastWrongAt !== existing.lastWrongAt ||
      merged.lastProposedAt !== existing.lastProposedAt ||
      merged.wrongCount !== existing.wrongCount ||
      merged.newSinceWrong !== existing.newSinceWrong;

    pendingByKey.set(entry.questionKey, merged);
    if (changed) pendingUpdated += 1;
  });

  const localCoverageKeys = new Set(localCoverage.map((e) => e.questionKey));
  addPendingKeysToCoverage(coverageByKey, Array.from(pendingByKey.values()));

  const coverage = sortByQuestionKey(Array.from(coverageByKey.values()));
  const pending = sortByQuestionKey(Array.from(pendingByKey.values()));
  const coverageAdded = coverage.filter(
    (entry) => !localCoverageKeys.has(entry.questionKey)
  ).length;

  return {
    ok: true,
    coverage,
    pending,
    coverageAdded,
    coverageTotal: coverage.length,
    pendingAdded,
    pendingUpdated,
    coverageSummary: computeCoverageSummary(coverage, index.byKey.size),
    mergedAt: typeof now === 'function' ? now() : now,
  };
}

export default {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  TRANSFER_ERRORS,
  buildExportPayload,
  parseExportPayload,
  mergeTrainingData,
};
