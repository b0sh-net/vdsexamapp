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
