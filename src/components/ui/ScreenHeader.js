import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radii, spacing } from '../../theme';
import useAppInsets from '../../hooks/useAppInsets';

/**
 * Header comune a tutte le schermate.
 * Sfondo brand con "glow" decorativi, titolo e slot azioni opzionale.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Indietro',
  right,
  children,
  style,
}) {
  const { top } = useAppInsets();

  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.glowLarge} />
      <View pointerEvents="none" style={styles.glowSmall} />
      <View style={[styles.inner, { paddingTop: top }]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}
          >
            <Text style={styles.backGlyph}>{'\u2039'}</Text>
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>
        ) : null}

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.rightSlot}>{right}</View> : null}
        </View>

        {children}
      </View>
    </View>
  );
}

export function HeaderAction({
  label,
  onPress,
  tone = 'ghost',
  testID,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.action,
        tone === 'danger' ? styles.actionDanger : styles.actionGhost,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export function HeaderChip({ children, testID, tone = 'neutral' }) {
  const toneStyle =
    tone === 'warning'
      ? styles.chipWarning
      : tone === 'accent'
        ? styles.chipAccent
        : styles.chipNeutral;

  return (
    <View style={[styles.chip, toneStyle]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  glowLarge: {
    position: 'absolute',
    top: -110,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(28,111,209,0.30)',
  },
  glowSmall: {
    position: 'absolute',
    bottom: -70,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inner: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.onBrandFaint,
    marginBottom: spacing.md,
  },
  backGlyph: {
    color: colors.onBrand,
    fontSize: 18,
    lineHeight: 18,
    marginRight: 5,
    marginTop: -1,
  },
  backText: {
    color: colors.onBrand,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.onBrand,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    color: colors.onBrandMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  rightSlot: {
    flexShrink: 0,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  actionGhost: {
    backgroundColor: colors.onBrandFaint,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionDanger: {
    backgroundColor: 'rgba(217,45,32,0.22)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  actionText: {
    color: colors.onBrand,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipNeutral: {
    backgroundColor: colors.onBrandFaint,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipAccent: {
    backgroundColor: 'rgba(28,111,209,0.35)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipWarning: {
    backgroundColor: 'rgba(224,138,0,0.28)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipText: {
    color: colors.onBrand,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.82,
  },
});
