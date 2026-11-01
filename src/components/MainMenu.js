import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import AppButton from './ui/AppButton';
import { colors, layout, radii, spacing, shadows } from '../theme';
import useAppInsets from '../hooks/useAppInsets';

const REPO_URL = 'https://github.com/b0sh-net/vdsexamapp';

const CATEGORIES = [
  { name: 'Aerodinamica', count: 10 },
  { name: 'Meteorologia', count: 10 },
  { name: 'Tecnologia e prestazioni', count: 12 },
  { name: 'Tecnica di pilotaggio', count: 12 },
  { name: 'Operazioni di emergenza', count: 4 },
  { name: 'Norme di circolazione e fonia', count: 4 },
  { name: 'Navigazione aerea', count: 6 },
  { name: 'Legislazione aeronautica', count: 6 },
  { name: 'Sicurezza del volo', count: 6 },
];

function HeroStat({ value, label }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

export default function MainMenu({ onStart_exam, onStart_learning, onShow_info }) {
  const { top, bottom } = useAppInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroGlowLarge} />
          <View pointerEvents="none" style={styles.heroGlowSmall} />

          <View style={[styles.heroInner, { paddingTop: top + spacing.sm }]}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoGlyph}>VDS</Text>
            </View>
            <Text style={styles.title}>VDS Studio</Text>
            <Text style={styles.subtitle}>MULTIASSI · ALA FISSA</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Numeri chiave */}
          <View style={styles.statsCard}>
            <HeroStat value="70" label="Domande" />
            <View style={styles.statsDivider} />
            <HeroStat value="9" label="Categorie" />
            <View style={styles.statsDivider} />
            <HeroStat value="7" label="Errori max" />
          </View>

          {/* Esame */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.accentBar, styles.accentBarAccent]} />
              <View style={styles.cardHeaderText}>
                <Text style={styles.eyebrow}>MODALITÀ ESAME</Text>
                <Text style={styles.cardTitle}>Simulazione completa</Text>
              </View>
            </View>

            <Text style={styles.cardText}>
              L'esame consiste in 70 domande suddivise in 9 categorie. Per essere
              IDONEO, il numero di errori non deve superare 7 su 70.
            </Text>

            <View style={styles.categoryList}>
              {CATEGORIES.map((category) => (
                <View key={category.name} style={styles.categoryRow}>
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View style={styles.categoryCount}>
                    <Text style={styles.categoryCountText}>{category.count}</Text>
                  </View>
                </View>
              ))}
            </View>

            <AppButton
              label="SIMULA ESAME"
              sublabel="70 domande · esito finale"
              variant="accent"
              size="lg"
              onPress={onStart_exam}
              style={styles.cta}
            />
          </View>

          {/* Apprendimento */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.accentBar, styles.accentBarWarning]} />
              <View style={styles.cardHeaderText}>
                <Text style={[styles.eyebrow, styles.eyebrowWarning]}>
                  SENZA LIMITI
                </Text>
                <Text style={styles.cardTitle}>Allenamento guidato</Text>
              </View>
            </View>

            <Text style={styles.cardText}>
              Sessione senza limite di domande, esito immediato per ogni risposta
              e ripasso automatico delle domande sbagliate.
            </Text>

            <AppButton
              label="INIZIA APPRENDIMENTO"
              sublabel="Sessione illimitata"
              variant="soft"
              size="md"
              onPress={onStart_learning}
              testID="main-menu-learning-button"
              accessibilityLabel="Avvia la modalita Apprendimento"
              style={styles.learningButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={onShow_info}
              accessibilityRole="button"
              accessibilityLabel="Apri le informazioni"
            >
              <Text style={styles.footerButtonText}>Informazioni</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => Linking.openURL(REPO_URL)}
              accessibilityRole="link"
              accessibilityLabel="Apri il repository GitHub"
            >
              <Text style={styles.footerButtonText}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.brand,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    paddingBottom: 52,
  },
  heroGlowLarge: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(28,111,209,0.35)',
  },
  heroGlowSmall: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroInner: {
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.onBrandFaint,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoGlyph: {
    color: colors.onBrand,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.onBrand,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.onBrandMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  content: {
    marginTop: -30,
    paddingHorizontal: layout.screenPadding,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...(shadows.floating || {}),
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    color: colors.brand,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...(shadows.card || {}),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  accentBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  accentBarAccent: {
    backgroundColor: colors.accent,
  },
  accentBarWarning: {
    backgroundColor: colors.warningStrong,
  },
  cardHeaderText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  eyebrowWarning: {
    color: colors.warning,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  categoryList: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  categoryName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryCount: {
    minWidth: 26,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryCountText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  cta: {
    marginTop: spacing.lg,
  },
  learningButton: {
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  footerButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  footerButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.borderStrong,
  },
});
