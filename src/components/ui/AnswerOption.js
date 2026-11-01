import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

const STATES = {
  default: {
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    badge: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    badgeText: { color: colors.textMuted },
    text: { color: colors.text },
  },
  selected: {
    container: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    badge: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    badgeText: { color: colors.onBrand },
    text: { color: colors.brandDeep },
  },
  correct: {
    container: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    badge: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    badgeText: { color: colors.onBrand },
    text: { color: '#0B5E44' },
  },
  wrong: {
    container: {
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    },
    badge: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    badgeText: { color: colors.onBrand },
    text: { color: '#9B2318' },
  },
};

const MARKERS = {
  correct: '\u2713',
  wrong: '\u2715',
};

/**
 * Riga di risposta condivisa tra Esame e Apprendimento.
 * `state`: default | selected | correct | wrong
 */
export default function AnswerOption({
  label,
  text,
  state = 'default',
  onPress,
  disabled = false,
  testID,
  accessibilityLabel,
  accessibilityState,
}) {
  const palette = STATES[state] || STATES.default;
  const marker = MARKERS[state];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${label}) ${text}`}
      accessibilityState={accessibilityState || { disabled }}
      style={({ pressed }) => [
        styles.container,
        palette.container,
        pressed && !disabled && styles.pressed,
        state !== 'default' && styles.emphasized,
      ]}
    >
      <View style={[styles.badge, palette.badge]}>
        <Text style={[styles.badgeText, palette.badgeText]}>{label}</Text>
      </View>
      <Text style={[styles.text, palette.text]}>{text}</Text>
      {marker ? (
        <Text style={[styles.marker, palette.text]} accessibilityElementsHidden>
          {marker}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  emphasized: {
    borderWidth: 2,
    paddingVertical: spacing.md - 1,
    paddingHorizontal: spacing.md - 1,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  marker: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
