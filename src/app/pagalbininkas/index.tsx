import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Message } from '@/components/message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import * as api from '@/lib/api';
import { relationLabel, type CircleHelper, type SeniorCircle } from '@/lib/care';
import { colors, spacing } from '@/theme';

/** Pagalbininko apžvalga: mano senjorai ir jų pagalbininkai. */
export default function HelperOverview() {
  const [circles, setCircles] = useState<SeniorCircle[] | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api.isConfigured()) {
      setCircles([]);
      return;
    }
    try {
      setError(null);
      const [session, list] = await Promise.all([api.getSession(), api.getMyCircles()]);
      setMyId(session?.userId ?? null);
      setCircles(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepavyko gauti duomenų.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmRemove(circle: SeniorCircle, helper: CircleHelper) {
    const leaving = helper.id === myId;
    Alert.alert(
      leaving ? 'Nebesirūpinti?' : `Pašalinti ${helper.displayName}?`,
      leaving
        ? `Nebematysite ${circle.seniorName} informacijos.`
        : `${helper.displayName} nebematys ${circle.seniorName} informacijos.`,
      [
        { text: 'Atšaukti', style: 'cancel' },
        {
          text: leaving ? 'Nebesirūpinti' : 'Pašalinti',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeHelper(circle.seniorId, helper.id);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Nepavyko pašalinti.');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Apžvalga" />

      {!api.isConfigured() ? (
        <Message>Ryšys su serveriu dar nenustatytas, todėl susieti telefonų kol kas negalima.</Message>
      ) : null}
      {error ? <Message tone="error">{error}</Message> : null}

      {circles && circles.length === 0 && api.isConfigured() ? (
        <Card tone="soft">
          <AppText bold>Dar nesusieta su senjoru</AppText>
          <AppText>
            Senjoro telefone pasirinkite „Aš senjoras“. Atsiras QR kodas, kurį nuskenuosite šiuo telefonu.
          </AppText>
        </Card>
      ) : null}

      {circles?.map((circle) => (
        <Card key={circle.seniorId} testID={`senjoras-${circle.seniorId}`}>
          <AppText bold size="title">
            {circle.seniorName}
          </AppText>
          <AppText size="small" color="muted">
            Jūs: {relationLabel(circle.myRelation)}
            {circle.iAmAdmin ? ' · tvarkote pagalbininkus' : ''}
          </AppText>

          <AppText bold style={styles.sectionTitle}>
            Pagalbininkai
          </AppText>
          {circle.helpers.map((h) => (
            <View key={h.id} style={styles.helperRow}>
              <View style={styles.helperText}>
                <AppText>
                  {h.displayName}
                  {h.id === myId ? ' (jūs)' : ''}
                </AppText>
                <AppText size="small" color="muted">
                  {relationLabel(h.relation)}
                </AppText>
              </View>
              {(circle.iAmAdmin && h.id !== myId) || (!circle.iAmAdmin && h.id === myId) ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={h.id === myId ? 'Nebesirūpinti' : `Pašalinti ${h.displayName}`}
                  hitSlop={8}
                  onPress={() => confirmRemove(circle, h)}
                  style={styles.remove}>
                  <AppText size="small" color="danger">
                    {h.id === myId ? 'Išeiti' : 'Pašalinti'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ))}

          {circle.iAmAdmin ? (
            <BigButton
              compact
              variant="soft"
              label="Pakviesti pagalbininką"
              onPress={() => router.push({ pathname: '/pakviesti/[senjoras]', params: { senjoras: circle.seniorId } })}
            />
          ) : null}
        </Card>
      ))}

      {api.isConfigured() ? (
        <View style={styles.actions}>
          <BigButton compact label="Susieti senjoro telefoną" onPress={() => router.push('/susieti')} />
          <BigButton compact variant="soft" label="Turiu kvietimo kodą" onPress={() => router.push('/kvietimas')} />
        </View>
      ) : null}

      <Card tone="soft">
        <AppText>
          Vėliau čia matysite, ar senjoras paspaudė „Viskas gerai“, ar išgėrė vaistus, ir paskutinius įvykius.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: spacing.sm,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  helperText: {
    flex: 1,
  },
  remove: {
    padding: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});
