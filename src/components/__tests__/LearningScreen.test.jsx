import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import LearningScreen from '../LearningScreen';

function makeBank(count = 10, sourceKey = 'meteo') {
  return {
    [sourceKey]: Array.from({ length: count }, (_, index) => ({
      id: index,
      domanda: `Domanda ${index}?`,
      risposta_a: `Alfa ${index}`,
      risposta_b: `Beta ${index}`,
      risposta_c: `Gamma ${index}`,
      risposta_d: `Delta ${index}`,
      num_risposte: 4,
      esatta: 'A',
      figura: 0,
    })),
  };
}

function makeStorage({ pending = [], loadWarning = null, saveWarning = null, loadError = null, saveError = null } = {}) {
  return {
    loadPending: jest.fn(async () => {
      if (loadError) throw loadError;
      return { pending, warning: loadWarning };
    }),
    savePending: jest.fn(async () => {
      if (saveError) throw saveError;
      return { warning: saveWarning };
    }),
  };
}

function pendingEntry(index = 0, sourceKey = 'meteo', groupKey = 'meteo') {
  return {
    questionKey: `${sourceKey}:${index}`,
    sourceKey,
    groupKey,
    questionId: index,
    firstWrongAt: 100,
    lastWrongAt: 100,
    lastProposedAt: 100,
    wrongCount: 1,
  };
}

async function renderLearning({
  bank = makeBank(),
  storage = makeStorage(),
  onFinish = jest.fn(),
} = {}) {
  await render(
    <LearningScreen
      onFinish_learning={onFinish}
      questionBank={bank}
      storageAdapter={storage}
    />
  );
  await screen.findByTestId('learning-question-text');
  return { storage, onFinish };
}

async function answer(key) {
  await fireEvent.press(screen.getByTestId(`learning-option-${key}`));
}

async function next() {
  await fireEvent.press(screen.getByTestId('learning-next-button'));
}

describe('LearningScreen - US1 sessione senza limite e feedback immediato', () => {
  test('mostra la prima domanda senza un totale prefissato', async () => {
    await renderLearning();

    expect(screen.getByText('Apprendimento')).toBeTruthy();
    expect(screen.getByText('Meteorologia')).toBeTruthy();
    expect(screen.getByText('Domande affrontate: 0')).toBeTruthy();
    expect(screen.getByTestId('learning-pending-count').props.children.join('')).toBe(
      'Da ripassare: 0'
    );
    expect(screen.getByTestId('learning-question-text')).toBeTruthy();
    expect(screen.queryByText(/\/\s*70/)).toBeNull();
    expect(screen.getByTestId('learning-option-A')).toBeTruthy();
    expect(screen.getByTestId('learning-option-B')).toBeTruthy();
    expect(screen.getByTestId('learning-option-C')).toBeTruthy();
    expect(screen.getByTestId('learning-option-D')).toBeTruthy();
    expect(screen.queryByTestId('learning-feedback')).toBeNull();
  });

  test('mostra subito l esito corretto e blocca le opzioni', async () => {
    await renderLearning();
    await answer('A');

    expect(screen.getByTestId('learning-feedback')).toBeTruthy();
    expect(screen.getByText('Corretto')).toBeTruthy();
    expect(screen.queryByTestId('learning-correct-answer')).toBeNull();

    ['A', 'B', 'C', 'D'].forEach((key) => {
      const option = screen.getByTestId(`learning-option-${key}`);
      expect(option.props.accessibilityState).toEqual({ disabled: true });
    });

    expect(screen.getByText('Domande affrontate: 1')).toBeTruthy();

    // Un secondo tocco non modifica l'esito.
    await answer('B');
    expect(screen.getByText('Corretto')).toBeTruthy();
    expect(screen.queryByText('Sbagliato')).toBeNull();
  });

  test('mostra la risposta corretta in caso di errore', async () => {
    await renderLearning();
    await answer('B');

    expect(screen.getByText('Sbagliato')).toBeTruthy();
    const correct = screen.getByTestId('learning-correct-answer');
    expect(correct.props.children.join('')).toContain('Risposta corretta: A)');
    expect(correct.props.children.join('')).toContain('Alfa');
  });

  test('passa alla domanda successiva con Avanti', async () => {
    await renderLearning();
    const firstText = screen.getByTestId('learning-question-text').props.children;

    await answer('A');
    await next();

    expect(screen.queryByTestId('learning-feedback')).toBeNull();
    expect(screen.getByTestId('learning-question-text').props.children).not.toBe(
      firstText
    );
    expect(screen.getByText('Domande affrontate: 1')).toBeTruthy();
  });

  test('termina direttamente con zero risposte e riepilogo a zeri', async () => {
    const { onFinish } = await renderLearning();
    const alertSpy = jest.spyOn(Alert, 'alert');

    await fireEvent.press(screen.getByTestId('learning-finish-button'));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalledTimes(1);
    const summary = onFinish.mock.calls[0][0];
    expect(summary.totalUnique).toBe(0);
    expect(summary.firstAttemptCorrect).toBe(0);
    expect(summary.laterCorrected).toBe(0);
    expect(summary.stillPending).toBe(0);
    expect(summary.answeredCount).toBe(0);

    alertSpy.mockRestore();
  });

  test('chiede conferma prima di terminare una sessione con risposte', async () => {
    const { onFinish } = await renderLearning();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await answer('B');
    await fireEvent.press(screen.getByTestId('learning-finish-button'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(
      'Terminare la sessione di apprendimento?'
    );

    const buttons = alertSpy.mock.calls[0][2];
    expect(buttons.map((button) => button.text)).toEqual(['ANNULLA', 'TERMINA']);

    buttons.find((button) => button.text === 'TERMINA').onPress();

    expect(onFinish).toHaveBeenCalledTimes(1);
    const summary = onFinish.mock.calls[0][0];
    expect(summary.totalUnique).toBe(1);
    expect(summary.firstAttemptCorrect).toBe(0);
    expect(summary.laterCorrected).toBe(0);
    expect(summary.stillPending).toBe(1);

    alertSpy.mockRestore();
  });
});

describe('LearningScreen - US2 gruppi', () => {
  test('mostra il gruppo aggregato Circolazione aerea', async () => {
    await renderLearning({ bank: makeBank(3, 'norme') });

    expect(screen.getByText('Circolazione aerea')).toBeTruthy();
  });

  test('mostra il messaggio di archivio esaurito e consente di terminare', async () => {
    const { onFinish } = await renderLearning({ bank: makeBank(1) });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await answer('A');
    await next();

    expect(screen.getByTestId('learning-exhausted')).toBeTruthy();
    expect(
      screen.getByText(
        'Nessuna domanda disponibile. Termina la sessione per vedere il riepilogo.'
      )
    ).toBeTruthy();

    await fireEvent.press(screen.getByTestId('learning-finish-session-button'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    alertSpy.mock.calls[0][2].find((button) => button.text === 'TERMINA').onPress();
    expect(onFinish).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });
});

describe('LearningScreen - US3 ripasso e persistenza', () => {
  test('salva l arretrato dopo un errore e aggiorna il contatore', async () => {
    const { storage } = await renderLearning();

    await answer('B');

    expect(storage.savePending).toHaveBeenCalledTimes(1);
    const saved = storage.savePending.mock.calls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0].wrongCount).toBe(1);
    expect(screen.getByTestId('learning-pending-count').props.children.join('')).toBe(
      'Da ripassare: 1'
    );
  });

  test('propone il ripasso dopo 3 nuove domande e lo rimuove quando corretto', async () => {
    const { storage } = await renderLearning();

    await answer('B');
    await next();
    await answer('A');
    await next();
    await answer('A');
    await next();

    expect(screen.getByTestId('learning-review-label')).toBeTruthy();
    expect(screen.getByText('Ripasso')).toBeTruthy();

    await answer('A');

    const lastSave = storage.savePending.mock.calls.at(-1)[0];
    expect(lastSave).toEqual([]);
    expect(screen.getByTestId('learning-pending-count').props.children.join('')).toBe(
      'Da ripassare: 0'
    );
  });

  test('carica l arretrato persistente al mount e lo esclude dalle nuove domande', async () => {
    const { storage } = await renderLearning({
      storage: makeStorage({ pending: [pendingEntry(0)] }),
    });

    expect(storage.loadPending).toHaveBeenCalledWith(expect.any(Object));
    expect(screen.getByTestId('learning-pending-count').props.children.join('')).toBe(
      'Da ripassare: 1'
    );
    expect(screen.getByTestId('learning-question-text').props.children).not.toBe(
      'Domanda 0?'
    );

    await answer('B');

    const saved = storage.savePending.mock.calls[0][0];
    expect(saved).toHaveLength(2);
  });

  test('persiste lastProposedAt quando la prima domanda e gia un ripasso', async () => {
    const bank = makeBank(1);
    const { storage } = await renderLearning({
      bank,
      storage: makeStorage({ pending: [pendingEntry(0)] }),
    });

    expect(screen.getByTestId('learning-review-label')).toBeTruthy();
    expect(storage.savePending).toHaveBeenCalled();
    expect(storage.savePending.mock.calls[0][0]).toHaveLength(1);
  });

  test('avvisa ma continua se il caricamento dell arretrato fallisce', async () => {
    await renderLearning({
      storage: makeStorage({ loadError: new Error('lettura ko') }),
    });

    expect(screen.getByTestId('learning-storage-warning')).toBeTruthy();
    expect(screen.getByTestId('learning-question-text')).toBeTruthy();

    await answer('A');
    expect(screen.getByText('Corretto')).toBeTruthy();
  });

  test('avvisa ma continua se il salvataggio fallisce', async () => {
    await renderLearning({
      storage: makeStorage({ saveError: new Error('scrittura ko') }),
    });

    await answer('B');

    expect(screen.getByText('Sbagliato')).toBeTruthy();
    expect(screen.getByTestId('learning-storage-warning')).toBeTruthy();
  });

  test('mostra un avviso restituito dallo storage', async () => {
    await renderLearning({
      storage: makeStorage({ loadWarning: 'Arretrato non disponibile' }),
    });

    expect(screen.getByText('Arretrato non disponibile')).toBeTruthy();
  });
});
