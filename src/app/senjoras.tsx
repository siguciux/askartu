import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { showComingSoon } from '@/components/coming-soon';
import { Message } from '@/components/message';
import { Screen } from '@/components/screen';
import { SeniorPairing } from '@/components/senior-pairing';
import { relationLabel, type CircleHelper } from '@/lib/care';
import { formatDayMonth, formatTime, formatWeekday, greeting } from '@/lib/date';
import { useRole } from '@/lib/role';
import { useClock } from '@/lib/use-clock';
import { useSeniorLink } from '@/lib/use-senior-link';
import { colors, fontSize, radius, spacing } from '@/theme';

/**
 * Senjoro pusė. Kol telefonas nesusietas su pagalbininku, rodomas QR kodas;
 * po to pradžios ekranas.
 */
export default function SeniorScreen() {
  const link = useSeniorLink();
  const { clearRole } = useRole();

  async function switchRole() {
    await clearRole();
    router.replace('/pasirinkimas');
  }

  if (link.status === 'loading') return <Screen>{null}</Screen>;

  if (link.status === 'pairing' || link.status === 'error') {
    return (
      <Screen>
        {link.status === 'pairing' ? (
          <SeniorPairing token={link.token} />
        ) : (
          <>
            <Message tone="error">{link.message}</Message>
            <BigButton label="Bandyti dar kartą" onPress={link.retry} />
          </>
        )}
        <SwitchRole onPress={switchRole} />
      </Screen>
    );
  }

  return <SeniorHome helpers={link.status === 'linked' ? link.helpers : []} onSwitchRole={switchRole} />;
}

function SwitchRole({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Keisti vaidmenį" onPress={onPress} style={styles.switch}>
      <AppText size="small" color="muted">
        Keisti vaidmenį
      </AppText>
    </Pressable>
  );
}

/** Senjoro pradžios ekranas. Mygtukai kol kas tik rodo, kad funkcija dar kuriama. */
function SeniorHome({ helpers, onSwitchRole }: { helpers: CircleHelper[]; onSwitchRole: () => void }) {
  const now = useClock();

  return (
    <Screen>
      <View style={styles.top}>
        <AppText
          bold
          style={styles.clock}
          accessibilityLabel={`Dabar ${formatTime(now)}`}
          testID="clock">
          {formatTime(now)}
        </AppText>
        <AppText size="body" color="muted" style={styles.date}>
          {formatWeekday(now)},{'\n'}
          {formatDayMonth(now)}
        </AppText>
      </View>

      <Card tone="okSoft">
        <AppText size="seniorBody">{greeting(now)}! Kaip jaučiatės?</AppText>
        <BigButton variant="ok" label="Viskas gerai" onPress={() => showComingSoon('Viskas gerai')} />
      </Card>

      <BigButton label="Skambinti artimiesiems" onPress={() => showComingSoon('Skambinti artimiesiems')} />

      <View style={styles.tiles}>
        <Tile title="Vaistai" hint="Šiandienos vaistai" onPress={() => showComingSoon('Vaistai')} />
        <Tile title="Ar tai sukčiai?" hint="Patikrinti žinutę" onPress={() => showComingSoon('Ar tai sukčiai?')} />
      </View>

      <BigButton variant="danger" label="SOS · Reikia pagalbos" onPress={() => showComingSoon('SOS')} />

      {helpers.length > 0 ? (
        <Card>
          <AppText bold size="seniorBody">
            Jumis rūpinasi
          </AppText>
          {helpers.map((h) => (
            <AppText key={h.id} size="seniorBody">
              {h.displayName}
              <AppText size="small" color="muted">
                {'  '}
                {relationLabel(h.relation)}
              </AppText>
            </AppText>
          ))}
        </Card>
      ) : null}

      <SwitchRole onPress={onSwitchRole} />
    </Screen>
  );
}

function Tile({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${hint}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <AppText bold size="button">
        {title}
      </AppText>
      <AppText size="small" color="muted">
        {hint}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clock: {
    fontSize: fontSize.clock,
    fontVariant: ['tabular-nums'],
  },
  date: {
    textAlign: 'right',
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    minHeight: 120,
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  switch: {
    alignSelf: 'center',
    marginTop: 'auto',
    padding: spacing.md,
  },
});
