import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing, type ColorName } from '@/theme';

type Props = ViewProps & {
  /** Fono spalva; pagal nutylėjimą baltas su rėmeliu. */
  tone?: Extract<ColorName, 'soft' | 'okSoft' | 'warnSoft' | 'dangerSoft'>;
};

/** Kortelė informacijai sugrupuoti. */
export function Card({ tone, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[styles.base, tone ? { backgroundColor: colors[tone], borderColor: colors[tone] } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
