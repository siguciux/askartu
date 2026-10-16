import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Screen } from '@/components/screen';
import { useRole, type Role } from '@/lib/role';
import { spacing } from '@/theme';

/** Pirmas ekranas: kas naudosis šiuo telefonu. */
export default function ChooseRole() {
  const { setRole } = useRole();

  async function choose(role: Role) {
    await setRole(role);
    router.replace(role === 'senior' ? '/senjoras' : '/pagalbininkas');
  }

  return (
    <Screen>
      <View style={styles.intro}>
        <AppText bold size="title" accessibilityRole="header">
          Sveiki! Čia „Aš kartu“
        </AppText>
        <AppText size="seniorBody">Kas naudosis šiuo telefonu?</AppText>
      </View>

      <View style={styles.choices}>
        <BigButton
          label="Aš senjoras"
          hint="Dideli mygtukai, priminimai, skambučiai"
          onPress={() => choose('senior')}
        />
        <BigButton
          variant="soft"
          label="Aš pagalbininkas"
          hint="Artimasis, slaugytoja ar socialinė darbuotoja"
          onPress={() => choose('helper')}
        />
      </View>

      <AppText size="small" color="muted">
        Pasirinkimą vėliau galėsite pakeisti.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  choices: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
