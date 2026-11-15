import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './app-text';
import { BackButton } from './back-button';

type Props = {
  title: string;
  /** Rodyti mygtuką „Atgal“. */
  back?: boolean;
  onBack?: () => void;
};

/** Ekrano antraštė, pasirinktinai su mygtuku „Atgal“. */
export function ScreenHeader({ title, back, onBack }: Props) {
  return (
    <View style={styles.row}>
      {back ? <BackButton onPress={onBack} /> : null}
      <AppText bold size="title" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
  },
});
