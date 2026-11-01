import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

const VARIANTS = {
  primary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    color: colors.onBrand,
    subtitleColor: colors.onBrandMuted,
  },
  accent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    color: colors.onBrand,
    subtitleColor: 'rgba(255,255,255,0.82)',
  },
  warning: {
    backgroundColor: colors.warningStrong,
    borderColor: colors.warningStrong,
    color: colors.onBrand,
    subtitleColor: 'rgba(255,255,255,0.85)',
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    color: colors.onBrand,
    subtitleColor: 'rgba(255,255,255,0.82)',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    color: colors.text,
    subtitleColor: colors.textMuted,
  },
  soft: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandSoft,
    color: colors.brand,
    subtitleColor: colors.textMuted,
  },
};

const SIZES = {
  sm: { paddingVertical: 11, paddingHorizontal: 16, fontSize: 14, radius: radii.md },
  md: { paddingVertical: 15, paddingHorizontal: 20, fontSize: 16, radius: radii.md },
  lg: { paddingVertical: 17, paddingHorizontal: 24, fontSize: 16, radius: radii.lg },
};

export default function AppButton({
  label,
  sublabel,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityState,
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyle = SIZES[size] || SIZES.md;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={accessibilityState || { disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderRadius: sizeStyle.radius,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Text style={[styles.icon, textStyle]}>{icon}</Text> : null}
        <View style={styles.labels}>
          <Text
            style={[
              styles.label,
              { color: palette.color, fontSize: sizeStyle.fontSize },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text
              style={[
                styles.sublabel,
                { color: palette.subtitleColor },
                textStyle,
              ]}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  sublabel: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  icon: {
    marginRight: spacing.sm,
    fontSize: 17,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
