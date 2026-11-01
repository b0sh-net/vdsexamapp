import {
  BACKUP_ERRORS,
  loadSnapshot,
  exportData,
  pickImportFile,
  importData,
} from '../trainingBackup';
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  buildExportPayload,
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

function makeStorage({ coverage = [], pending = [], warning = null } = {}) {
  return {
    loadCoverage: jest.fn(async () => ({ coverage, warning })),
    loadPending: jest.fn(async () => ({ pending, warning })),
    saveCoverage: jest.fn(async () => ({ warning: null })),
    savePending: jest.fn(async () => ({ warning: null })),
  };
}

describe('trainingBackup - snapshot ed esportazione', () => {
  test('loadSnapshot legge copertura e arretrato e calcola il riepilogo', async () => {
    const bank = makeBank();
    const storage = makeStorage({
      coverage: [coverageFor('norme:0'), coverageFor('meteo:0')],
      pending: [pendingFor('norme:0')],
    });

    const snapshot = await loadSnapshot(bank, storage);

    expect(storage.loadCoverage).toHaveBeenCalledWith(bank);
    expect(storage.loadPending).toHaveBeenCalledWith(bank);
    expect(snapshot.coverage).toHaveLength(2);
    expect(snapshot.pending).toHaveLength(1);
    expect(snapshot.coverageSummary).toEqual({
      seenCount: 2,
      totalCount: 24,
      remainingCount: 22,
      percentage: 8,
    });
    expect(snapshot.warnings).toEqual([]);
  });

  test('loadSnapshot non lancia eccezioni con storage difettoso', async () => {
    const storage = {
      loadCoverage: jest.fn(async () => {
        throw new Error('ko');
      }),
      loadPending: jest.fn(async () => {
        throw new Error('ko');
      }),
    };

    const snapshot = await loadSnapshot(makeBank(), storage);

    expect(snapshot.coverage).toEqual([]);
    expect(snapshot.pending).toEqual([]);
    expect(snapshot.warnings.length).toBe(2);
  });

  test('exportData scrive il file in cache e condivide il JSON', async () => {
    const bank = makeBank();
    const coverage = [coverageFor('norme:0')];
    const pending = [pendingFor('norme:0')];
    const sharing = {
      isAvailableAsync: jest.fn(async () => true),
      shareAsync: jest.fn(async () => undefined),
    };

    const result = await exportData({
      coverage,
      pending,
      bank,
      now: () => 1700000000000,
      sharing,
    });

    expect(result.ok).toBe(true);
    expect(result.fileUri).toMatch(
      /vds-addestramento-\d{8}-\d{6}\.json$/
    );
    expect(sharing.isAvailableAsync).toHaveBeenCalledTimes(1);
    expect(sharing.shareAsync).toHaveBeenCalledTimes(1);
    expect(sharing.shareAsync.mock.calls[0][1]).toEqual(
      expect.objectContaining({ mimeType: 'application/json' })
    );

    expect(coverage).toHaveLength(1);
    expect(pending).toHaveLength(1);
  });

  test('il payload esportato rispetta formato e versione', async () => {
    const sharing = {
      isAvailableAsync: jest.fn(async () => true),
      shareAsync: jest.fn(async () => undefined),
    };
    let written = null;
    const fileSystem = {
      Paths: { cache: { uri: 'file:///cache' } },
      File: class MockFile {
        constructor(...parts) {
          this.uri = parts.map((part) => (part && part.uri) || String(part)).join('/');
        }
        create() {}
        async write(content) {
          written = content;
        }
      },
    };

    const result = await exportData({
      coverage: [coverageFor('norme:0')],
      pending: [],
      bank: makeBank(),
      now: () => 1000,
      fileSystem,
      sharing,
    });

    expect(result.ok).toBe(true);
    const payload = JSON.parse(written);
    expect(payload.format).toBe(EXPORT_FORMAT);
    expect(payload.version).toBe(EXPORT_VERSION);
    expect(payload.coverage).toHaveLength(1);
  });

  test('restituisce SHARING_UNAVAILABLE se la condivisione non e disponibile', async () => {
    const sharing = {
      isAvailableAsync: jest.fn(async () => false),
      shareAsync: jest.fn(),
    };

    const result = await exportData({
      coverage: [],
      pending: [],
      bank: makeBank(),
      now: () => 1000,
      sharing,
    });

    expect(result).toEqual({
      ok: false,
      error: BACKUP_ERRORS.SHARING_UNAVAILABLE,
    });
    expect(sharing.shareAsync).not.toHaveBeenCalled();
  });

  test('restituisce WRITE_FAILED se la scrittura fallisce', async () => {
    const fileSystem = {
      Paths: { cache: { uri: 'file:///cache' } },
      File: class MockFile {
        constructor() {
          this.uri = 'file:///cache/x.json';
        }
        create() {}
        async write() {
          throw new Error('ko');
        }
      },
    };

    const result = await exportData({
      coverage: [],
      pending: [],
      bank: makeBank(),
      now: () => 1000,
      fileSystem,
      sharing: {
        isAvailableAsync: jest.fn(async () => true),
        shareAsync: jest.fn(),
      },
    });

    expect(result).toEqual({ ok: false, error: BACKUP_ERRORS.WRITE_FAILED });
  });
});

describe('trainingBackup - importazione', () => {
  function makeDocumentPicker(asset = { uri: 'file:///tmp/backup.json', name: 'backup.json' }) {
    return {
      getDocumentAsync: jest.fn(async () =>
        asset ? { canceled: false, assets: [asset] } : { canceled: true, assets: [] }
      ),
    };
  }

  test('pickImportFile restituisce canceled su annullamento', async () => {
    const result = await pickImportFile({
      documentPicker: {
        getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
      },
    });

    expect(result).toEqual({ canceled: true });
  });

  test('pickImportFile legge il testo con File.text()', async () => {
    const fileSystem = {
      File: class MockFile {
        async text() {
          return '{"ok":true}';
        }
      },
    };

    const result = await pickImportFile({
      documentPicker: makeDocumentPicker(),
      fileSystem,
    });

    expect(result).toEqual({
      canceled: false,
      text: '{"ok":true}',
      name: 'backup.json',
    });
  });

  test('pickImportFile usa fetch come fallback', async () => {
    const fileSystem = {
      File: class MockFile {
        async text() {
          throw new Error('uri non gestito');
        }
      },
    };
    const fetchImpl = jest.fn(async () => ({ text: async () => 'contenuto' }));

    const result = await pickImportFile({
      documentPicker: makeDocumentPicker(),
      fileSystem,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith('file:///tmp/backup.json');
    expect(result.text).toBe('contenuto');
  });

  test('pickImportFile restituisce READ_FAILED quando non riesce a leggere', async () => {
    const result = await pickImportFile({
      documentPicker: makeDocumentPicker(),
      fileSystem: {
        File: class MockFile {
          async text() {
            throw new Error('ko');
          }
        },
      },
      fetchImpl: async () => {
        throw new Error('ko');
      },
    });

    expect(result).toEqual({ canceled: false, error: BACKUP_ERRORS.READ_FAILED });
  });

  test('importData valida, salva prima la copertura e poi l arretrato', async () => {
    const bank = makeBank();
    const text = JSON.stringify(
      buildExportPayload({
        coverage: [coverageFor('norme:0')],
        pending: [pendingFor('norme:0')],
        bank,
        now: () => 1000,
      })
    );
    const storage = makeStorage();

    const result = await importData({ text, bank, storage, now: () => 2000 });

    expect(result.ok).toBe(true);
    expect(result.coverageAdded).toBe(1);
    expect(result.pendingAdded).toBe(1);
    expect(result.pendingUpdated).toBe(0);
    expect(result.coverageSummary).toEqual({
      seenCount: 1,
      totalCount: 24,
      remainingCount: 23,
      percentage: 4,
    });

    expect(storage.saveCoverage).toHaveBeenCalledTimes(1);
    expect(storage.savePending).toHaveBeenCalledTimes(1);
    expect(storage.saveCoverage.mock.invocationCallOrder[0]).toBeLessThan(
      storage.savePending.mock.invocationCallOrder[0]
    );
  });

  test('importData non scrive nulla su file invalido', async () => {
    const storage = makeStorage();

    const result = await importData({
      text: '{non-json',
      bank: makeBank(),
      storage,
    });

    expect(result).toEqual({
      ok: false,
      error: BACKUP_ERRORS.INVALID_JSON,
    });
    expect(storage.saveCoverage).not.toHaveBeenCalled();
    expect(storage.savePending).not.toHaveBeenCalled();
  });

  test('importData rifiuta un file con domande non presenti nell archivio', async () => {
    const bank = makeBank();
    const text = JSON.stringify({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: 1000,
      summary: {
        seenCount: 1,
        totalCount: 24,
        remainingCount: 23,
        percentage: 4,
      },
      coverage: [coverageFor('norme:99')],
      pending: [],
    });
    const storage = makeStorage();

    const result = await importData({ text, bank, storage });

    expect(result).toEqual({
      ok: false,
      error: BACKUP_ERRORS.INVALID_ARCHIVE_DATA,
    });
    expect(storage.saveCoverage).not.toHaveBeenCalled();
  });

  test('importData mappa un errore di scrittura dell arretrato in WRITE_FAILED', async () => {
    const bank = makeBank();
    const text = JSON.stringify(
      buildExportPayload({
        coverage: [coverageFor('norme:0')],
        pending: [pendingFor('norme:0')],
        bank,
        now: () => 1000,
      })
    );
    const storage = makeStorage();
    storage.savePending = jest.fn(async () => ({ warning: 'ko' }));

    const result = await importData({ text, bank, storage });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(BACKUP_ERRORS.WRITE_FAILED);
    expect(storage.saveCoverage).toHaveBeenCalledTimes(1);
  });
});
