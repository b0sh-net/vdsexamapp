import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  STORAGE_WARNING,
  loadPending,
  savePending,
  normalizePending,
} from '../learningStorage';
import {
  makeBank,
  makeQuestion,
  makePendingEntry,
  createFakeClock,
} from './helpers';

function validEntry(overrides = {}) {
  return makePendingEntry({
    questionKey: 'norme:0',
    sourceKey: 'norme',
    groupKey: 'circolazione',
    questionId: 0,
    firstWrongAt: 1000,
    lastWrongAt: 1100,
    lastProposedAt: 1200,
    wrongCount: 1,
    ...overrides,
  });
}

async function writePayload(payload) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

describe('learningStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('usa la chiave e la versione dello schema concordate', () => {
    expect(STORAGE_KEY).toBe('@vds/learning/pending/v1');
    expect(STORAGE_VERSION).toBe(1);
  });

  test('esegue un round-trip valido con il payload atteso', async () => {
    const bank = makeBank();
    const entry = validEntry();

    const saved = await savePending([entry]);
    expect(saved).toEqual({ warning: null });

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const payload = JSON.parse(raw);
    expect(payload.version).toBe(1);
    expect(typeof payload.updatedAt).toBe('number');
    expect(payload.pending).toEqual([entry]);

    const loaded = await loadPending(bank, () => 5000);
    expect(loaded).toEqual({ pending: [entry], warning: null });
  });

  test('restituisce un elenco vuoto senza avviso quando non esiste nulla', async () => {
    const loaded = await loadPending(makeBank());

    expect(loaded).toEqual({ pending: [], warning: null });
  });

  test('resetta i dati con version diversa da 1', async () => {
    await writePayload({ version: 2, updatedAt: 1, pending: [validEntry()] });

    const loaded = await loadPending(makeBank());

    expect(loaded.pending).toEqual([]);
    expect(loaded.warning).toBe(STORAGE_WARNING);

    const rewritten = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
    expect(rewritten.pending).toEqual([]);
  });

  test('resetta i dati con JSON corrotto', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{non-json');

    const loaded = await loadPending(makeBank());

    expect(loaded.pending).toEqual([]);
    expect(loaded.warning).toBe(STORAGE_WARNING);
  });

  test('resetta i dati quando pending non e un array', async () => {
    await writePayload({ version: 1, updatedAt: 1, pending: { a: 1 } });

    const loaded = await loadPending(makeBank());

    expect(loaded.pending).toEqual([]);
    expect(loaded.warning).toBe(STORAGE_WARNING);
  });

  test('deduplica le voci mantenendo wrongCount maggiore e timestamp piu recenti', async () => {
    const bank = makeBank();
    const now = createFakeClock(9000);
    await writePayload({
      version: 1,
      updatedAt: 1,
      pending: [
        validEntry({ wrongCount: 1, lastWrongAt: 1000, lastProposedAt: 1100 }),
        validEntry({
          wrongCount: 4,
          firstWrongAt: 500,
          lastWrongAt: 3000,
          lastProposedAt: 3500,
        }),
      ],
    });

    const loaded = await loadPending(bank, now);

    expect(loaded.pending).toHaveLength(1);
    const entry = loaded.pending[0];
    expect(entry.questionKey).toBe('norme:0');
    expect(entry.wrongCount).toBe(4);
    expect(entry.firstWrongAt).toBe(500);
    expect(entry.lastWrongAt).toBe(3000);
    expect(entry.lastProposedAt).toBe(3500);
    expect(loaded.warning).toBeNull();
  });

  test('scarta le voci orfane e le identita incoerenti', async () => {
    const bank = makeBank();
    await writePayload({
      version: 1,
      updatedAt: 1,
      pending: [
        validEntry(),
        validEntry({ questionKey: 'norme:999', questionId: 999 }),
        validEntry({ questionKey: 'meteo:0' }),
        validEntry({ questionKey: 'norme:1', questionId: 0 }),
        validEntry({ questionKey: 'norme:1', sourceKey: 'meteo', questionId: 1 }),
      ],
    });

    const loaded = await loadPending(bank, createFakeClock(1000));

    expect(loaded.pending).toHaveLength(1);
    expect(loaded.pending[0].questionKey).toBe('norme:0');
    expect(loaded.warning).toBeNull();
  });

  test('ripara il gruppo non previsto usando quello dell archivio', async () => {
    const bank = makeBank();
    await writePayload({
      version: 1,
      updatedAt: 1,
      pending: [validEntry({ groupKey: 'gruppo-sconosciuto' })],
    });

    const loaded = await loadPending(bank);

    expect(loaded.pending).toHaveLength(1);
    expect(loaded.pending[0].groupKey).toBe('circolazione');
  });

  test('ripara i timestamp mancanti o non numerici con l orologio fornito', async () => {
    const bank = makeBank();
    const now = createFakeClock(7000);
    await writePayload({
      version: 1,
      updatedAt: 1,
      pending: [
        {
          questionKey: 'norme:0',
          sourceKey: 'norme',
          groupKey: 'circolazione',
          questionId: 0,
          firstWrongAt: 'ieri',
          lastWrongAt: null,
          lastProposedAt: undefined,
          wrongCount: 0,
        },
      ],
    });

    const loaded = await loadPending(bank, now);

    expect(loaded.pending).toHaveLength(1);
    const entry = loaded.pending[0];
    expect(entry.firstWrongAt).toBe(7000);
    expect(entry.lastWrongAt).toBe(7000);
    expect(entry.lastProposedAt).toBe(7000);
    expect(entry.wrongCount).toBe(1);
  });

  test('restituisce un avviso non bloccante se la lettura fallisce', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('lettura ko'));

    const loaded = await loadPending(makeBank());

    expect(loaded).toEqual({ pending: [], warning: STORAGE_WARNING });
  });

  test('restituisce un avviso non bloccante se la scrittura fallisce', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('scrittura ko'));

    const result = await savePending([validEntry()]);

    expect(result).toEqual({ warning: STORAGE_WARNING });
  });

  test('rifiuta un elenco non array senza lanciare eccezioni', async () => {
    const result = await savePending('non-un-array');

    expect(result).toEqual({ warning: STORAGE_WARNING });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('scarta in scrittura le voci non valide e deduplica', async () => {
    const result = await savePending([
      validEntry(),
      validEntry({ wrongCount: 3, lastWrongAt: 4000 }),
      null,
      { questionKey: 'norme:2' },
      validEntry({ questionKey: 'meteo:0', groupKey: 'sconosciuto' }),
    ]);

    expect(result).toEqual({ warning: null });

    const payload = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
    expect(payload.pending).toHaveLength(1);
    expect(payload.pending[0].wrongCount).toBe(3);
    expect(payload.pending[0].lastWrongAt).toBe(4000);
  });

  test('serializza le scritture concorrenti', async () => {
    let releaseFirst;
    let firstStarted = false;
    AsyncStorage.setItem.mockImplementationOnce(() => {
      firstStarted = true;
      return new Promise((resolve) => {
        releaseFirst = resolve;
      });
    });

    const first = savePending([validEntry()]);
    await new Promise((resolve) => setImmediate(resolve));

    expect(firstStarted).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    const second = savePending([
      validEntry({
        questionKey: 'meteo:0',
        sourceKey: 'meteo',
        groupKey: 'meteo',
        questionId: 0,
      }),
    ]);
    await new Promise((resolve) => setImmediate(resolve));

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    releaseFirst();
    await Promise.all([first, second]);

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
    expect(payload.pending).toHaveLength(1);
    expect(payload.pending[0].questionKey).toBe('meteo:0');
  });

  test('normalizePending restituisce elenco vuoto per archivi non validi', () => {
    const result = normalizePending([validEntry()], null);

    expect(result.pending).toEqual([]);
    expect(result.changed).toBe(true);
  });

  test('normalizePending rifiuta un elenco non array', () => {
    const result = normalizePending('non-un-array', makeBank());

    expect(result.pending).toEqual([]);
    expect(result.changed).toBe(true);
  });

  test('scarta le voci prive dei campi obbligatori', () => {
    const result = normalizePending(
      [
        null,
        'stringa',
        { sourceKey: 'norme', questionId: 0, groupKey: 'circolazione' },
        { questionKey: '', sourceKey: 'norme', questionId: 0 },
        { questionKey: 'norme:0', questionId: 0 },
        { questionKey: 'norme:0', sourceKey: 'norme' },
        { questionKey: 'norme:0', sourceKey: 'norme', questionId: 'zero' },
      ],
      makeBank()
    );

    expect(result.pending).toEqual([]);
    expect(result.changed).toBe(true);
  });

  test('ordina per lastProposedAt, firstWrongAt e chiave', () => {
    const bank = {
      norme: [makeQuestion(0), makeQuestion(1), makeQuestion(2)],
    };
    const base = { sourceKey: 'norme', groupKey: 'circolazione' };
    const result = normalizePending(
      [
        {
          ...base,
          questionKey: 'norme:2',
          questionId: 2,
          firstWrongAt: 50,
          lastWrongAt: 50,
          lastProposedAt: 100,
          wrongCount: 1,
        },
        {
          ...base,
          questionKey: 'norme:1',
          questionId: 1,
          firstWrongAt: 50,
          lastWrongAt: 50,
          lastProposedAt: 100,
          wrongCount: 1,
        },
        {
          ...base,
          questionKey: 'norme:0',
          questionId: 0,
          firstWrongAt: 10,
          lastWrongAt: 10,
          lastProposedAt: 100,
          wrongCount: 1,
        },
      ],
      bank
    );

    expect(result.pending.map((entry) => entry.questionKey)).toEqual([
      'norme:0',
      'norme:1',
      'norme:2',
    ]);
  });

  test('scarta in scrittura le voci prive di questionKey', async () => {
    const result = await savePending([
      validEntry(),
      { sourceKey: 'norme', groupKey: 'circolazione', questionId: 5 },
    ]);

    expect(result).toEqual({ warning: null });

    const payload = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
    expect(payload.pending).toHaveLength(1);
    expect(payload.pending[0].questionKey).toBe('norme:0');
  });
});
