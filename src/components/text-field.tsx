import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';

import { AppText } from './app-text';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Paaiškinimas po lauku. */
  hint?: string;
  /** Didesnės raidės, pvz. kodui įvesti. */
  large?: boolean;
};

/** Teksto laukas su aiškia antrašte virš jo. */
export function TextField({ label, hint, large, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText bold>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...rest}
        style={[styles.input, large && styles.large]}
      />
      {hint ? (
        <AppText size="small" color="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  large: {
    fontFamily: fonts.bold,
    fontSize: fontSize.title,
    letterSpacing: 4,
    textAlign: 'center',
  },
});
