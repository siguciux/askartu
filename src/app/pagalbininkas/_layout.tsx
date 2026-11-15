import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { useHelperAccount } from '@/lib/use-helper-account';
import { colors, fonts } from '@/theme';

/** Pagalbininko pusė: keturi skirtukai apačioje. Reikia būti prisijungus. */
export default function HelperLayout() {
  const account = useHelperAccount();

  // Kol tikrinama, rodome skirtukus (išėmus navigatorių, nutrūktų navigacija).
  if (account.status === 'signedOut') return <Redirect href="/prisijungimas" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 14 },
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: { borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Apžvalga' }} />
      <Tabs.Screen name="vaistai" options={{ title: 'Vaistai' }} />
      <Tabs.Screen name="gidas" options={{ title: 'Gidas' }} />
      <Tabs.Screen name="nustatymai" options={{ title: 'Nustatymai' }} />
    </Tabs>
  );
}
