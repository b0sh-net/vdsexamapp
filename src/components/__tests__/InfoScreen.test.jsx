import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import InfoScreen from '../InfoScreen';

function makeSnapshot({
  seenCount = 120,
  totalCount = 882,
  pending = 8,
} = {}) {
  return {
    coverage: [],
    pending: Array.from({ length: pending }, (_, index) => ({ index })),
    coverageSummary: {
      seenCount,
      totalCount,
      remainingCount: totalCount - seenCount,
      percentage: totalCount > 0 ? Math.round((seenCount / totalCount) * 100) : 0,
    },
    warnings: [],
  };
}

function makeBackup({ snapshot = makeSnapshot(), exportResult = { ok: true } } = {}) {
  return {
    loadSnapshot: jest.fn(async () => snapshot),
    exportData: jest.fn(async () => exportResult),
    pickImportFile: jest.fn(async () => ({ canceled: true })),
    importData: jest.fn(async () => ({ ok: true })),
  };
}

function makeStorage() {
  return {
    loadCoverage: jest.fn(async () => ({ coverage: [], warning: null })),
    loadPending: jest.fn(async () => ({ pending: [], warning: null })),
    saveCoverage: jest.fn(async () => ({ warning: null })),
    savePending: jest.fn(async () => ({ warning: null })),
  };
}

async function renderInfo({ backup = makeBackup(), storage = makeStorage() } = {}) {
  const onReturnToMenu = jest.fn();
  await render(
    <InfoScreen
      onReturnToMenu={onReturnToMenu}
      backupAdapter={backup}
      storageAdapter={storage}
    />
  );
  await screen.findByTestId('info-training-coverage');
  return { backup, storage, onReturnToMenu };
}

describe('InfoScreen - esportazione dati di addestramento', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('mostra la sezione con copertura e arretrato', async () => {
    await renderInfo();

    expect(screen.getByText('Dati di addestramento')).toBeTruthy();
    expect(screen.getByTestId('info-training-coverage').props.children).toBe(
      'Copertura: 14% (120 di 882 domande)'
    );
    expect(screen.getByTestId('info-training-pending').props.children).toBe(
      'Da recuperare: 8 domande'
    );
    expect(screen.getByText('Esporta dati')).toBeTruthy();
    expect(screen.getByText('Importa dati')).toBeTruthy();
  });

  test('usa il singolare per una sola domanda da recuperare', async () => {
    await renderInfo({ backup: makeBackup({ snapshot: makeSnapshot({ pending: 1 }) }) });

    expect(screen.getByTestId('info-training-pending').props.children).toBe(
      'Da recuperare: 1 domanda'
    );
  });

  test('esporta i dati e mostra il messaggio di successo', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { backup, storage } = await renderInfo();

    await fireEvent.press(screen.getByTestId('info-export-data'));

    expect(backup.exportData).toHaveBeenCalledTimes(1);
    expect(backup.exportData.mock.calls[0][0]).toEqual(
      expect.objectContaining({ bank: expect.any(Object) })
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Esportazione completata',
      'Il file con copertura e domande da recuperare è pronto per essere salvato o condiviso.'
    );
    expect(storage.saveCoverage).not.toHaveBeenCalled();
  });

  test('durante l esportazione disabilita i pulsanti e mostra lo stato', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    let release;
    const backup = makeBackup();
    backup.exportData = jest.fn(
      () => new Promise((resolve) => {
        release = resolve;
      })
    );
    await renderInfo({ backup });

    fireEvent.press(screen.getByTestId('info-export-data'));

    expect(await screen.findByText('Esportazione...')).toBeTruthy();
    expect(
      screen.getByTestId('info-export-data').props.accessibilityState.disabled
    ).toBe(true);
    expect(
      screen.getByTestId('info-import-data').props.accessibilityState.disabled
    ).toBe(true);

    await act(async () => {
      release({ ok: true });
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Esportazione completata',
      expect.any(String)
    );
    expect(
      screen.getByTestId('info-export-data').props.accessibilityState.disabled
    ).toBe(false);
  });

  test('segnala la condivisione non disponibile', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderInfo({
      backup: makeBackup({
        exportResult: { ok: false, error: 'SHARING_UNAVAILABLE' },
      }),
    });

    await fireEvent.press(screen.getByTestId('info-export-data'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Condivisione non disponibile',
      'Questo dispositivo non supporta la condivisione di file.'
    );
  });

  test('segnala l esportazione non riuscita', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderInfo({
      backup: makeBackup({
        exportResult: { ok: false, error: 'WRITE_FAILED' },
      }),
    });

    await fireEvent.press(screen.getByTestId('info-export-data'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Esportazione non riuscita',
      'Impossibile esportare i dati. I dati sul dispositivo non sono stati modificati.'
    );
  });
});

describe('InfoScreen - importazione dati di addestramento', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makeImportBackup({
    pickResult = { canceled: false, text: '{}', name: 'backup.json' },
    importResult = {
      ok: true,
      coverageAdded: 3,
      pendingAdded: 1,
      pendingUpdated: 2,
      coverageSummary: {
        seenCount: 123,
        totalCount: 882,
        remainingCount: 759,
        percentage: 14,
      },
    },
  } = {}) {
    const backup = makeBackup();
    backup.pickImportFile = jest.fn(async () => pickResult);
    backup.importData = jest.fn(async () => importResult);
    return backup;
  }

  test('annulla silenziosamente quando il picker viene chiuso', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const backup = makeImportBackup({ pickResult: { canceled: true } });
    await renderInfo({ backup });

    await fireEvent.press(screen.getByTestId('info-import-data'));

    expect(backup.importData).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('info-import-data').props.accessibilityState.disabled
    ).toBe(false);
  });

  test('mostra lo stato importing e disabilita i pulsanti', async () => {
    let release;
    const backup = makeImportBackup();
    backup.pickImportFile = jest.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    await renderInfo({ backup });

    fireEvent.press(screen.getByTestId('info-import-data'));

    expect(await screen.findByText('Importazione...')).toBeTruthy();
    expect(
      screen.getByTestId('info-export-data').props.accessibilityState.disabled
    ).toBe(true);
    expect(
      screen.getByTestId('info-import-data').props.accessibilityState.disabled
    ).toBe(true);

    await act(async () => {
      release({ canceled: true });
    });

    expect(
      screen.getByTestId('info-import-data').props.accessibilityState.disabled
    ).toBe(false);
  });

  test('mostra il messaggio di importazione completata con i contatori', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const backup = makeImportBackup();
    await renderInfo({ backup });

    await fireEvent.press(screen.getByTestId('info-import-data'));

    expect(backup.importData).toHaveBeenCalledWith(
      expect.objectContaining({ text: '{}', bank: expect.any(Object) })
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Importazione completata',
      'Aggiunte 3 domande alla copertura e 3 voci di ripasso. Copertura: 14% (123 di 882).'
    );
  });

  test('aggiorna il riepilogo dopo un import riuscito', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const backup = makeImportBackup();
    backup.loadSnapshot
      .mockResolvedValueOnce(makeSnapshot({ seenCount: 120, pending: 8 }))
      .mockResolvedValueOnce(makeSnapshot({ seenCount: 123, pending: 9 }));
    await renderInfo({ backup });

    expect(screen.getByTestId('info-training-coverage').props.children).toBe(
      'Copertura: 14% (120 di 882 domande)'
    );

    await fireEvent.press(screen.getByTestId('info-import-data'));

    expect(screen.getByTestId('info-training-coverage').props.children).toBe(
      'Copertura: 14% (123 di 882 domande)'
    );
    expect(screen.getByTestId('info-training-pending').props.children).toBe(
      'Da recuperare: 9 domande'
    );
  });

  test('mostra Lettura non riuscita quando il file non e leggibile', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const backup = makeImportBackup({
      pickResult: { canceled: false, error: 'READ_FAILED' },
    });
    await renderInfo({ backup });

    await fireEvent.press(screen.getByTestId('info-import-data'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Lettura non riuscita',
      'Impossibile leggere il file selezionato.'
    );
  });

  test.each([
    ['INVALID_JSON', 'Backup non valido', 'Il file selezionato non è un backup valido dell\u2019addestramento.'],
    ['INVALID_FORMAT', 'Backup non valido', 'Il file selezionato non è un backup valido dell\u2019addestramento.'],
    ['INVALID_SHAPE', 'Backup non valido', 'Il file selezionato non è un backup valido dell\u2019addestramento.'],
    ['UNSUPPORTED_VERSION', 'Versione non supportata', 'Il file è stato creato con una versione dell\u2019app non supportata.'],
    ['INVALID_ARCHIVE_DATA', 'Dati non compatibili', 'Il file contiene domande non presenti in questa versione dell\u2019archivio.'],
    ['WRITE_FAILED', 'Importazione non completata', 'Impossibile salvare i dati sul dispositivo. La copertura potrebbe essere parzialmente aggiornata.'],
  ])('mappa %s nel messaggio corretto', async (code, title, body) => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const backup = makeImportBackup({ importResult: { ok: false, error: code } });
    await renderInfo({ backup });

    await fireEvent.press(screen.getByTestId('info-import-data'));

    expect(alertSpy).toHaveBeenCalledWith(title, body);
  });
});
