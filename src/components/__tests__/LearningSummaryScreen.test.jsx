import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import LearningSummaryScreen from '../LearningSummaryScreen';

const SUMMARY = {
  totalUnique: 12,
  firstAttemptCorrect: 7,
  laterCorrected: 3,
  stillPending: 4,
  answeredCount: 18,
  startedAt: 1000,
  endedAt: 2000,
  storageWarning: null,
};

async function renderScreen(overrides = {}) {
  const props = {
    summary: SUMMARY,
    onReturnToMenu: jest.fn(),
    onStartNewSession: jest.fn(),
    ...overrides,
  };
  await render(<LearningSummaryScreen {...props} />);
  return props;
}

describe('LearningSummaryScreen', () => {
  test('mostra le quattro card con etichette e valori interi', async () => {
    await renderScreen();

    expect(screen.getByText('Riepilogo Apprendimento')).toBeTruthy();

    expect(screen.getByTestId('summary-total-unique').props.children).toBe('12');
    expect(screen.getByTestId('summary-first-attempt').props.children).toBe('7');
    expect(screen.getByTestId('summary-later-corrected').props.children).toBe(
      '3'
    );
    expect(screen.getByTestId('summary-still-pending').props.children).toBe('4');

    expect(screen.getByText('Domande totali (uniche)')).toBeTruthy();
    expect(
      screen.getByText('Corrette al primo tentativo (uniche)')
    ).toBeTruthy();
    expect(
      screen.getByText('Sbagliate successivamente corrette')
    ).toBeTruthy();
    expect(screen.getByText('Sbagliate non ancora corrette')).toBeTruthy();
  });

  test('evidenzia la card del backlog persistente quando maggiore di zero', async () => {
    await renderScreen();

    const highlighted = StyleSheet.flatten(
      screen.getByTestId('summary-still-pending-card').props.style
    );
    const neutral = StyleSheet.flatten(
      screen.getByTestId('summary-total-unique-card').props.style
    );

    expect(highlighted.borderColor).not.toBe(neutral.borderColor);
  });

  test('non evidenzia la card del backlog quando vale zero', async () => {
    await renderScreen({ summary: { ...SUMMARY, stillPending: 0 } });

    const card = StyleSheet.flatten(
      screen.getByTestId('summary-still-pending-card').props.style
    );
    expect(card.borderColor).toBe('transparent');
  });

  test('mostra la nota di persistenza e i comandi', async () => {
    const props = await renderScreen();

    expect(
      screen.getByText(
        'Le domande non ancora corrette restano salvate sul dispositivo e verranno riproposte nelle prossime sessioni.'
      )
    ).toBeTruthy();

    await fireEvent.press(screen.getByTestId('summary-new-session'));
    expect(props.onStartNewSession).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('summary-return-menu'));
    expect(props.onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  test('formatta i valori come interi senza decimali', async () => {
    await renderScreen({
      summary: {
        ...SUMMARY,
        totalUnique: 3.9,
        firstAttemptCorrect: '2.7',
        laterCorrected: undefined,
        stillPending: NaN,
      },
    });

    expect(screen.getByTestId('summary-total-unique').props.children).toBe('3');
    expect(screen.getByTestId('summary-first-attempt').props.children).toBe('2');
    expect(screen.getByTestId('summary-later-corrected').props.children).toBe(
      '0'
    );
    expect(screen.getByTestId('summary-still-pending').props.children).toBe('0');
  });

  test('gestisce un riepilogo assente senza crash', async () => {
    const props = await renderScreen({ summary: null });

    expect(screen.getByText('Nessun riepilogo disponibile')).toBeTruthy();
    expect(screen.queryByTestId('summary-total-unique')).toBeNull();
    expect(screen.queryByTestId('summary-new-session')).toBeNull();

    await fireEvent.press(screen.getByTestId('summary-return-menu'));
    expect(props.onReturnToMenu).toHaveBeenCalledTimes(1);
  });
});

describe('LearningSummaryScreen - copertura', () => {
  const COVERAGE = {
    seenCount: 120,
    totalCount: 882,
    remainingCount: 762,
    percentage: 14,
  };

  test('mostra la sezione copertura con valori e barra proporzionale', async () => {
    await renderScreen({ summary: { ...SUMMARY, coverage: COVERAGE } });

    expect(screen.getByText('Copertura addestramento')).toBeTruthy();
    expect(screen.getByText("Copertura dell'archivio domande")).toBeTruthy();
    expect(screen.getByText('Incontrate')).toBeTruthy();
    expect(screen.getByText('Totale')).toBeTruthy();
    expect(screen.getByText('Da vedere')).toBeTruthy();

    expect(screen.getByTestId('summary-coverage-percentage').props.children).toBe(
      '14%'
    );
    expect(screen.getByTestId('summary-coverage-seen').props.children).toBe('120');
    expect(screen.getByTestId('summary-coverage-total').props.children).toBe('882');
    expect(screen.getByTestId('summary-coverage-remaining').props.children).toBe(
      '762'
    );

    const bar = StyleSheet.flatten(
      screen.getByTestId('summary-coverage-bar').props.style
    );
    expect(bar.width).toBe('14%');
    expect(
      screen.getByTestId('summary-coverage-percentage').props.accessibilityLabel
    ).toBe('Copertura addestramento: 14 per cento');
  });

  test('mostra 100% senza messaggi speciali', async () => {
    await renderScreen({
      summary: {
        ...SUMMARY,
        coverage: {
          seenCount: 882,
          totalCount: 882,
          remainingCount: 0,
          percentage: 100,
        },
      },
    });

    expect(screen.getByTestId('summary-coverage-percentage').props.children).toBe(
      '100%'
    );
    expect(screen.getByTestId('summary-coverage-remaining').props.children).toBe(
      '0'
    );
    const bar = StyleSheet.flatten(
      screen.getByTestId('summary-coverage-bar').props.style
    );
    expect(bar.width).toBe('100%');
  });

  test('gestisce archivio vuoto con valori a zero', async () => {
    await renderScreen({
      summary: {
        ...SUMMARY,
        coverage: {
          seenCount: 0,
          totalCount: 0,
          remainingCount: 0,
          percentage: 0,
        },
      },
    });

    expect(screen.getByTestId('summary-coverage-percentage').props.children).toBe(
      '0%'
    );
    expect(screen.getByTestId('summary-coverage-seen').props.children).toBe('0');
    expect(screen.getByTestId('summary-coverage-total').props.children).toBe('0');
    expect(screen.getByTestId('summary-coverage-remaining').props.children).toBe(
      '0'
    );
  });

  test('limita la barra tra 0 e 100', async () => {
    await renderScreen({
      summary: {
        ...SUMMARY,
        coverage: {
          seenCount: 5,
          totalCount: 10,
          remainingCount: 5,
          percentage: 140,
        },
      },
    });

    const bar = StyleSheet.flatten(
      screen.getByTestId('summary-coverage-bar').props.style
    );
    expect(bar.width).toBe('100%');
  });

  test('non mostra la sezione quando il riepilogo non ha copertura', async () => {
    await renderScreen();

    expect(screen.queryByTestId('summary-coverage')).toBeNull();
    expect(screen.queryByTestId('summary-coverage-percentage')).toBeNull();
  });

  test('mantiene invariate le quattro card esistenti', async () => {
    await renderScreen({ summary: { ...SUMMARY, coverage: COVERAGE } });

    expect(screen.getByTestId('summary-total-unique').props.children).toBe('12');
    expect(screen.getByTestId('summary-first-attempt').props.children).toBe('7');
    expect(screen.getByTestId('summary-later-corrected').props.children).toBe(
      '3'
    );
    expect(screen.getByTestId('summary-still-pending').props.children).toBe('4');
  });
});
