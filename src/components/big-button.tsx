import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { colors, minTouchSize, radius, spacing, type ColorName } from '@/theme';

import { AppText } from './app-text';

export type BigButtonVariant = 'primary' | 'ok' | 'soft' | 'danger';

const VARIANTS: Record<BigButtonVariant, { bg: ColorName; ink: ColorName }> = {
  primary: { bg: 'accent', ink: 'accentInk' },
  ok: { bg: 'ok', ink: 'okInk' },
  soft: { bg: 'soft', ink: 'ink' },
  danger: { bg: 'danger', ink: 'dangerInk' },
};

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /** Antra eilutė mažesniu šriftu, pvz. „2 liko šiandien“. */
  hint?: string;
  variant?: BigButtonVariant;
  /** Mažesnis mygtukas pagalbininko pusei. */
  compact?: boolean;
};

/** Didelis mygtukas su aiškiu užrašu (ne vien ikona). */
export function BigButton({ label, hint, variant = 'primary', compact, accessibilityLabel, ...rest }: Props) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (hint ? `${label}. ${hint}` : label)}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: colors[v.bg] },
        pressed && styles.pressed,
      ]}>
      <View style={styles.inner}>
        <AppText bold size={compact ? 'body' : 'button'} color={v.ink} style={styles.center}>
          {label}
        </AppText>
        {hint ? (
          <AppText size="small" color={v.ink} style={styles.center}>
            {hint}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchSize,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  compact: {
    minHeight: 52,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  inner: {
    gap: 2,
  },
  center: {
    textAlign: 'center',
  },
});
