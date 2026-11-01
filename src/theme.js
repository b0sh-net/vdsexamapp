import { Platform } from 'react-native';

/**
 * Design token condivisi da tutte le schermate.
 * Un unico punto di verità per colori, spaziature, raggi e ombre
 * mantiene l'interfaccia uniforme e facile da evolvere.
 */

export const colors = {
  // Brand
  brand: '#0E3A5C',
  brandDeep: '#082742',
  brandMid: '#12507E',
  brandSoft: '#E8F1FA',
  accent: '#1C6FD1',
  accentSoft: '#E6F0FC',

  // Stati
  success: '#12805C',
  successSoft: '#E6F6F0',
  warning: '#B9770E',
  warningStrong: '#E08A00',
  warningSoft: '#FFF6E5',
  danger: '#D92D20',
  dangerSoft: '#FDECEA',

  // Superfici
  background: '#F3F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F9',
  border: '#DFE6EF',
  borderStrong: '#C9D5E3',

  // Testo
  text: '#102A43',
  textMuted: '#627D98',
  textSubtle: '#829AB1',

  // Testo su sfondo brand
  onBrand: '#FFFFFF',
  onBrandMuted: 'rgba(255,255,255,0.72)',
  onBrandFaint: 'rgba(255,255,255,0.12)',
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const layout = {
  screenPadding: 20,
};

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0B2540',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 3 },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#0B2540',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 22,
    },
    android: { elevation: 6 },
    default: {},
  }),
};

/** Stile base delle card: usato ovunque per coerenza visiva. */
export const cardSurface = {
  backgroundColor: colors.surface,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.border,
  ...(shadows.card || {}),
};
