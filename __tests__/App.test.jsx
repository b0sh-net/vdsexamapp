import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import App from '../App';

describe('App - navigazione Apprendimento', () => {
  test('apre la modalita Apprendimento, mostra il riepilogo e torna al menu', async () => {
    await render(<App />);

    expect(screen.getByText('SIMULA ESAME')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('main-menu-learning-button'));

    await screen.findByTestId('learning-question-text');
    expect(screen.getByText('Apprendimento')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('learning-finish-button'));

    await screen.findByText('Riepilogo Apprendimento');
    expect(screen.getByTestId('summary-total-unique').props.children).toBe('0');
    expect(screen.getByTestId('summary-first-attempt').props.children).toBe('0');
    expect(screen.getByTestId('summary-later-corrected').props.children).toBe('0');
    expect(screen.getByTestId('summary-still-pending').props.children).toBe('0');

    await fireEvent.press(screen.getByTestId('summary-new-session'));
    await screen.findByTestId('learning-question-text');

    await fireEvent.press(screen.getByTestId('learning-finish-button'));
    await screen.findByText('Riepilogo Apprendimento');

    await fireEvent.press(screen.getByTestId('summary-return-menu'));
    expect(screen.getByText('SIMULA ESAME')).toBeTruthy();
  });

  test('la simulazione esame resta raggiungibile dal menu', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByText('SIMULA ESAME'));

    expect(screen.getByText('Esame VDS')).toBeTruthy();
    expect(screen.getByText('Domanda 1/70')).toBeTruthy();
    expect(screen.getByText('Risposte: 0/70')).toBeTruthy();
  });
});
