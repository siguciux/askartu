import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { ChoiceList } from '@/components/choice-list';
import { HelperOnly } from '@/components/helper-only';
import { Message } from '@/components/message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import * as api from '@/lib/api';
import { isValidName, parsePairingQr, RELATIONS, type Relation } from '@/lib/care';

/** Po QR kodo nuskenavimo: senjoro vardas ir kas jūs jam esate. */
export default function ConfirmPairing() {
  const { kodas } = useLocalSearchParams<{ kodas: string }>();
  const token = parsePairingQr(String(kodas ?? ''));

  return (
    <HelperOnly returnTo={`/susieti/${token ?? ''}`} title="Susieti senjoro telefoną">
      {token ? (
        <PairingForm token={token} />
      ) : (
        <Screen>
          <ScreenHeader title="Susieti senjoro telefoną" back />
          <Message tone="error">QR kodas neteisingas. Nuskenuokite jį dar kartą.</Message>
          <BigButton compact label="Skenuoti dar kartą" onPress={() => router.replace('/susieti')} />
        </Screen>
      )}
    </HelperOnly>
  );
}

function PairingForm({ token }: { token: string }) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!relation) return;
    setBusy(true);
    setError(null);
    try {
      await api.claimPairing(token, name, relation);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepavyko susieti.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <ScreenHeader title="Susieta!" />
        <Message tone="ok">{`${name.trim()} telefonas susietas. Senjoro telefone dabar matysite savo vardą.`}</Message>
        <BigButton compact label="Į apžvalgą" onPress={() => router.replace('/pagalbininkas')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Susieti senjoro telefoną" back />
      <AppText>QR kodas nuskenuotas. Liko du klausimai.</AppText>
      <TextField
        label="Kaip vadinti senjorą?"
        hint="Šį vardą matysite jūs ir kiti pagalbininkai, pvz. „Mama“ arba „Ona Petraitienė“."
        value={name}
        onChangeText={setName}
        maxLength={60}
        placeholder="pvz. Mama"
      />
      <ChoiceList label="Kas jūs senjorui?" options={RELATIONS} value={relation} onChange={setRelation} />
      {error ? <Message tone="error">{error}</Message> : null}
      <BigButton
        compact
        label={busy ? 'Susiejama…' : 'Susieti'}
        disabled={busy || !relation || !isValidName(name)}
        onPress={submit}
      />
    </Screen>
  );
}
