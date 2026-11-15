import { router } from 'expo-router';
import { useState } from 'react';

import * as api from '@/lib/api';
import { formatInviteCode, isValidInviteCode, normalizeInviteCode } from '@/lib/care';

import { AppText } from './app-text';
import { BigButton } from './big-button';
import { Message } from './message';
import { Screen } from './screen';
import { ScreenHeader } from './screen-header';
import { TextField } from './text-field';

/** Pagalbininkas įveda (arba gauna per nuorodą) kvietimo kodą. */
export function AcceptInvite({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(formatInviteCode(initialCode));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.acceptInvite(normalizeInviteCode(code));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepavyko priimti kvietimo.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <ScreenHeader title="Kvietimas priimtas" />
        <Message tone="ok">Dabar rūpinatės senjoru kartu su kitais. Jį matysite apžvalgoje.</Message>
        <BigButton compact label="Į apžvalgą" onPress={() => router.replace('/pagalbininkas')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Kvietimo kodas" back />
      <AppText>Įrašykite 8 ženklų kodą, kurį jums atsiuntė kitas pagalbininkas.</AppText>
      <TextField
        label="Kodas"
        large
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
        placeholder="ABCD-EFGH"
      />
      {error ? <Message tone="error">{error}</Message> : null}
      <BigButton
        compact
        label={busy ? 'Tikrinama…' : 'Priimti kvietimą'}
        disabled={busy || !isValidInviteCode(code)}
        onPress={submit}
      />
    </Screen>
  );
}
