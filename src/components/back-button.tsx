import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './app-text';

type Props = {
  /** Kur grįžti; jei nenurodyta, grįžtama vienu ekranu atgal. */
  onPress?: () => void;
};

/** Mygtukas „← Atgal“. */
export function BackButton({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Atgal"
      hitSlop={8}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      <AppText bold size="body">
        ← Atgal
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.soft,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
