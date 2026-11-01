import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  TRANSFER_ERRORS,
  buildExportPayload,
  parseExportPayload,
  mergeTrainingData,
} from '../trainingTransfer';
import {
  makeBank,
  makeCoverageEntry,
  makePendingEntry,
} from './helpers';

function coverageFor(questionKey, overrides = {}) {
  const [sourceKey, id] = questionKey.split(':');
  return makeCoverageEntry({
    questionKey,
    sourceKey,
    questionId: Number(id),
    groupKey: sourceKey === 'norme' ? 'circolazione' : sourceKey,
    ...overrides,
  });
}

function pendingFor(questionKey, overrides = {}) {
  const [sourceKey, id] = questionKey.split(':');
  return makePendingEntry({
    questionKey,
    sourceKey,
    questionId: Number(id),
    groupKey: sourceKey === 'norme' ? 'circolazione' : sourceKey,
    ...overrides,
  });
}

function validPayload(overrides = {}) {
  const coverage = [coverageFor('norme:0')];
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: 1000,
    summary: {
      seenCount: 1,
      totalCount: 24,
      remainingCount: 23,
      percentage: 4,
    },
    coverage,
    pending: [pendingFor('norme:0')],
    ...overrides,
  };
}

describe('trainingTransfer - costruzione e parsing', () => {
  test('esporta le costanti del formato v1', () => {
    expect(EXPORT_FORMAT).toBe('vds-training-data');
    expect(EXPORT_VERSION).toBe(1);
  });

  test('costruisce il payload con riepilogo derivato e voci ordinate', () => {
    const bank = makeBank();
    const coverage = new Map([
      ['norme:1', coverageFor('norme:1')],
      ['meteo:0', coverageFor('meteo:0')],
    ]);
    const pending = [pendingFor('norme:1')];

    const payload = buildExportPayload({
      coverage,
      pending,
      bank,
      now: () => 4242,
    });

    expect(payload.format).toBe(EXPORT_FORMAT);
    expect(payload.version).toBe(EXPORT_VERSION);
    expect(payload.exportedAt).toBe(4242);
    expect(payload.coverage.map((entry) => entry.questionKey)).toEqual([
      'meteo:0',
      'norme:1',
    ]);
    expect(payload.pending.map((entry) => entry.questionKey)).toEqual([
      'norme:1',
    ]);
    expect(payload.summary).toEqual({
      seenCount: 2,
      totalCount: 24,
      remainingCount: 22,
      percentage: 8,
    });
  });

  test('scarta le voci orfane dall esportazione', () => {
    const bank = makeBank();
    const payload = buildExportPayload({
      coverage: [coverageFor('sconosciuta:0'), coverageFor('norme:0')],
      pending: [pendingFor('sconosciuta:1')],
      bank,
      now: 10,
    });

    expect(payload.coverage.map((entry) => entry.questionKey)).toEqual([
      'norme:0',
    ]);
    expect(payload.pending).toEqual([]);
    expect(payload.summary.seenCount).toBe(1);
  });

  test('restituisce INVALID_JSON su testo non JSON', () => {
    expect(parseExportPayload('{non-json')).toEqual({
      ok: false,
      error: TRANSFER_ERRORS.INVALID_JSON,
    });
  });

  test('restituisce INVALID_FORMAT quando il formato non coincide', () => {
    expect(
      parseExportPayload(JSON.stringify(validPayload({ format: 'altro' })))
    ).toEqual({ ok: false, error: TRANSFER_ERRORS.INVALID_FORMAT });
  });

  test('restituisce UNSUPPORTED_VERSION per versioni future', () => {
    expect(
      parseExportPayload(JSON.stringify(validPayload({ version: 2 })))
    ).toEqual({ ok: false, error: TRANSFER_ERRORS.UNSUPPORTED_VERSION });
  });

  test('restituisce INVALID_SHAPE quando mancano campi obbligatori', () => {
    const payload = validPayload();
    delete payload.coverage;

    expect(parseExportPayload(JSON.stringify(payload))).toEqual({
      ok: false,
      error: TRANSFER_ERRORS.INVALID_SHAPE,
    });
    expect(parseExportPayload(JSON.stringify(validPayload({ pending: {} })))).toEqual({
      ok: false,
      error: TRANSFER_ERRORS.INVALID_SHAPE,
    });
  });

  test('accetta un payload valido', () => {
    const payload = validPayload();
    const parsed = parseExportPayload(JSON.stringify(payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual(payload);
  });
});

describe('trainingTransfer - merge', () => {
  test('unisce la copertura con firstSeenAt minimo, lastSeenAt massimo e timesSeen massimo', () => {
    const bank = makeBank();
    const local = {
      coverage: [coverageFor('norme:0', { firstSeenAt: 100, lastSeenAt: 200, timesSeen: 2 })],
      pending: [],
    };
    const imported = {
      coverage: [
        coverageFor('norme:0', { firstSeenAt: 50, lastSeenAt: 300, timesSeen: 5 }),
        coverageFor('meteo:0', { firstSeenAt: 10, lastSeenAt: 20, timesSeen: 1 }),
      ],
      pending: [],
    };

    const result = mergeTrainingData(local, imported, bank, () => 999);

    expect(result.ok).toBe(true);
    const norme = result.coverage.find((entry) => entry.questionKey === 'norme:0');
    expect(norme.firstSeenAt).toBe(50);
    expect(norme.lastSeenAt).toBe(300);
    expect(norme.timesSeen).toBe(5);
    expect(result.coverageAdded).toBe(1);
    expect(result.coverageTotal).toBe(2);
    expect(result.coverageSummary).toEqual({
      seenCount: 2,
      totalCount: 24,
      remainingCount: 22,
      percentage: 8,
    });
  });

  test('unisce l arretrato con i massimi e conta le voci aggiornate', () => {
    const bank = makeBank();
    const local = {
      coverage: [coverageFor('norme:0')],
      pending: [
        pendingFor('norme:0', {
          firstWrongAt: 100,
          lastWrongAt: 200,
          lastProposedAt: 200,
          wrongCount: 1,
          newSinceWrong: 1,
        }),
      ],
    };
    const imported = {
      coverage: [coverageFor('norme:0')],
      pending: [
        pendingFor('norme:0', {
          firstWrongAt: 50,
          lastWrongAt: 400,
          lastProposedAt: 500,
          wrongCount: 3,
          newSinceWrong: 2,
        }),
      ],
    };

    const result = mergeTrainingData(local, imported, bank, () => 999);

    expect(result.ok).toBe(true);
    expect(result.pendingAdded).toBe(0);
    expect(result.pendingUpdated).toBe(1);
    expect(result.pending[0]).toEqual(
      expect.objectContaining({
        questionKey: 'norme:0',
        firstWrongAt: 50,
        lastWrongAt: 400,
        lastProposedAt: 500,
        wrongCount: 3,
        newSinceWrong: 2,
      })
    );
  });

  test('aggiunge alla copertura tutte le chiavi dell arretrato importato', () => {
    const bank = makeBank();
    const local = { coverage: [], pending: [] };
    const imported = {
      coverage: [],
      pending: [pendingFor('norme:0', { firstWrongAt: 10, lastWrongAt: 20, lastProposedAt: 20 })],
    };

    const result = mergeTrainingData(local, imported, bank, () => 999);

    expect(result.ok).toBe(true);
    expect(result.coverage.map((entry) => entry.questionKey)).toEqual(['norme:0']);
    expect(result.coverage[0].firstSeenAt).toBe(10);
    expect(result.coverage[0].lastSeenAt).toBe(20);
    expect(result.coverageAdded).toBe(1);
  });

  test('rifiuta l intero file se una voce non esiste nell archivio', () => {
    const bank = makeBank();
    const local = { coverage: [], pending: [] };
    const imported = {
      coverage: [coverageFor('sconosciuta:0')],
      pending: [],
    };

    expect(mergeTrainingData(local, imported, bank, () => 999)).toEqual({
      ok: false,
      error: TRANSFER_ERRORS.INVALID_ARCHIVE_DATA,
    });
  });

  test('e idempotente alla seconda applicazione', () => {
    const bank = makeBank();
    const local = { coverage: [], pending: [] };
    const imported = {
      coverage: [coverageFor('norme:0')],
      pending: [pendingFor('norme:1')],
    };

    const first = mergeTrainingData(local, imported, bank, () => 999);
    expect(first.ok).toBe(true);
    expect(first.coverageAdded).toBe(2);
    expect(first.pendingAdded).toBe(1);

    const second = mergeTrainingData(
      { coverage: first.coverage, pending: first.pending },
      imported,
      bank,
      () => 999
    );

    expect(second.ok).toBe(true);
    expect(second.coverageAdded).toBe(0);
    expect(second.pendingAdded).toBe(0);
    expect(second.pendingUpdated).toBe(0);
    expect(second.coverageSummary).toEqual(first.coverageSummary);
    expect(second.coverageTotal).toBe(first.coverageTotal);
  });
});
