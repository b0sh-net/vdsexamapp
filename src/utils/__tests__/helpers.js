// Utility condivise dai test: RNG deterministico, orologio finto e fixture.

import { REVIEW_INTERVAL } from '../learningEngine';

export function createSeededRng(seed = 123456789) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createFakeClock(start = 1000) {
  let current = start;
  const now = () => current++;
  now.advance = (ms) => {
    current += ms;
  };
  now.value = () => current;
  return now;
}

export function makeQuestion(id, overrides = {}) {
  return {
    id,
    domanda: `Domanda ${id}?`,
    risposta_a: `Risposta A ${id}`,
    risposta_b: `Risposta B ${id}`,
    risposta_c: `Risposta C ${id}`,
    risposta_d: `Risposta D ${id}`,
    num_risposte: 4,
    esatta: 'A',
    figura: 0,
    ...overrides,
  };
}

export const FIXTURE_COUNTS = {
  aerodinamica: 4,
  meteo: 4,
  tecnico: 4,
  pilotaggio: 4,
  emergenza: 4,
  norme: 2,
  navigazione: 2,
  legislazione: 2,
  sicurezza: 4,
};

export function makeBank() {
  const bank = {};
  Object.entries(FIXTURE_COUNTS).forEach(([key, count]) => {
    bank[key] = Array.from({ length: count }, (_, index) =>
      makeQuestion(index, {
        domanda: `${key} domanda ${index}?`,
        esatta: ['A', 'B', 'C', 'D'][index % 4],
        num_risposte: [2, 3, 4][index % 3],
      })
    );
  });
  return bank;
}

export function makePendingEntry(overrides = {}) {
  return {
    questionKey: 'norme:0',
    sourceKey: 'norme',
    groupKey: 'circolazione',
    questionId: 0,
    firstWrongAt: 100,
    lastWrongAt: 100,
    lastProposedAt: 100,
    wrongCount: 1,
    newSinceWrong: REVIEW_INTERVAL,
    ...overrides,
  };
}

export function makeCoverageEntry(overrides = {}) {
  return {
    questionKey: 'norme:0',
    sourceKey: 'norme',
    groupKey: 'circolazione',
    questionId: 0,
    firstSeenAt: 100,
    lastSeenAt: 100,
    timesSeen: 1,
    ...overrides,
  };
}

export function makeCoverageList(count = 3) {
  return Array.from({ length: count }, (_, index) =>
    makeCoverageEntry({
      questionKey: `norme:${index}`,
      questionId: index,
      firstSeenAt: 100 + index,
      lastSeenAt: 100 + index,
    })
  );
}
