import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { ChoiceList } from '@/components/choice-list';
import { HelperOnly } from '@/components/helper-only';
import { Message } from '@/components/message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import * as api from '@/lib/api';
import { formatInviteCode, inviteLink, RELATIONS, relationLabel, type Relation } from '@/lib/care';
import { formatDayMonth } from '@/lib/date';

/** Senjorą susiejęs pagalbininkas pakviečia kitą (šeimos narį, slaugytoją…). */
export default function InviteHelper() {
  const { senjoras } = useLocalSearchParams<{ senjoras: string }>();
  const seniorId = String(senjoras ?? '');
  return (
    <HelperOnly returnTo={`/pakviesti/${seniorId}`} title="Pakviesti pagalbininką">
      <InviteForm seniorId={seniorId} />
    </HelperOnly>
  );
}

function InviteForm({ seniorId }: { seniorId: string }) {
  const [relation, setRelation] = useState<Relation | null>(null);
  const [invite, setInvite] = useState<{ code: string; expiresAt: Date } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!relation) return;
    setBusy(true);
    setError(null);
    try {
      setInvite(await api.createInvite(seniorId, relation));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepavyko sukurti kvietimo.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!invite) return;
    const code = formatInviteCode(invite.code);
    await Share.share({
      message:
        `Kviečiu kartu rūpintis per programėlę „Aš kartu“.\n\n` +
        `1. Įsidiekite „Aš kartu“ ir pasirinkite „Aš pagalbininkas“.\n` +
        `2. Apžvalgoje paspauskite „Turiu kvietimo kodą“ ir įrašykite: ${code}\n\n` +
        `Arba atidarykite nuorodą telefone: ${inviteLink(invite.code)}\n` +
        `Kodas galioja iki ${formatDayMonth(invite.expiresAt)}.`,
    });
  }

  if (invite) {
    return (
      <Screen>
        <ScreenHeader title="Kvietimas paruoštas" back />
        <Card tone="soft">
          <AppText>Kodas ({relation ? relationLabel(relation).toLowerCase() : ''}):</AppText>
          <AppText bold size="title" selectable style={{ letterSpacing: 3 }} testID="kvietimo-kodas">
            {formatInviteCode(invite.code)}
          </AppText>
          <AppText size="small" color="muted">
            Galioja iki {formatDayMonth(invite.expiresAt)}, panaudojamas vieną kartą.
          </AppText>
        </Card>
        <BigButton compact label="Siųsti kvietimą" onPress={share} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Pakviesti pagalbininką" back />
      <AppText>Sukursime kodą, kurį nusiųsite kitam žmogui. Jis matys tą patį senjorą kaip ir jūs.</AppText>
      <ChoiceList label="Kas jis senjorui?" options={RELATIONS} value={relation} onChange={setRelation} />
      {error ? <Message tone="error">{error}</Message> : null}
      <BigButton
        compact
        label={busy ? 'Kuriama…' : 'Sukurti kvietimą'}
        disabled={busy || !relation}
        onPress={create}
      />
    </Screen>
  );
}
