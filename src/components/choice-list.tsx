import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './app-text';

type Option<T extends string> = { value: T; label: string; hint?: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

/** Vieno pasirinkimo sąrašas dideliais mygtukais (vietoj mažų radijo mygtukų). */
export function ChoiceList<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText bold>{label}</AppText>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}>
            <View style={[styles.dot, selected && styles.dotSelected]} />
            <View style={styles.text}>
              <AppText bold>{o.label}</AppText>
              {o.hint ? (
                <AppText size="small" color="muted">
                  {o.hint}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.sm,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.soft,
  },
  pressed: {
    opacity: 0.8,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  dotSelected: {
    borderColor: colors.accent,
    borderWidth: 7,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
