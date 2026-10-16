import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** Kurių kraštų saugią zoną paisyti (be apačios, jei apačioje yra skirtukai). */
  edges?: Edge[];
};

/** Ekrano rėmas: saugi zona, fonas ir slinkimas, jei turinys netelpa. */
export function Screen({ children, edges = ['top', 'bottom', 'left', 'right'] }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.md,
    gap: spacing.md,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
});
