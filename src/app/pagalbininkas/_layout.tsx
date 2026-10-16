import { Tabs } from 'expo-router/js-tabs';

import { colors, fonts } from '@/theme';

/** Pagalbininko pusė: keturi skirtukai apačioje. */
export default function HelperLayout() {
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
