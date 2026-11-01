import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Restituisce gli spazi da riservare alle barre di sistema.
 * - su Android/edge-to-edge include la barra di navigazione (gesture o 3 tasti)
 * - su iOS include notch e home indicator
 * `top`/`bottom` aggiungono già un margine di respiro al contenuto.
 */
export default function useAppInsets({ topExtra = 12, bottomExtra = 16 } = {}) {
  const insets = useSafeAreaInsets();

  const top = Math.max(insets.top, StatusBar.currentHeight || 0) + topExtra;
  const bottom =
    Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0) + bottomExtra;

  return { top, bottom, insets };
}
