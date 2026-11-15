import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Message } from '@/components/message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import * as api from '@/lib/api';
import { isValidEmail, isValidEmailCode, isValidName, normalizeEmailCode } from '@/lib/care';

type Step = 'loading' | 'email' | 'code' | 'name';

/** Kur eiti po prisijungimo. Leidžiame tik vidinius adresus. */
function safeNext(next: string | string[] | undefined): Href {
  const value = Array.isArray(next) ? next[0] : next;
  return (value && value.startsWith('/') && !value.startsWith('//') ? value : '/pagalbininkas') as Href;
}

/** Pagalbininko prisijungimas: el. paštas → kodas iš laiško → vardas (tik pirmą kartą). */
export default function SignIn() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);

  const [step, setStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Gal jau prisijungta, tik trūksta vardo?
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await api.getSession();
        if (!active) return;
        if (!session || session.isAnonymous) return setStep('email');
        const profile = await api.getMyProfile();
        if (!active) return;
        if (profile?.kind === 'helper') return router.replace(next);
        setStep('name');
      } catch {
        if (active) setStep('email');
      }
    })();
    return () => {
      active = false;
    };
  }, [next]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kažkas nepavyko. Bandykite dar kartą.');
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      await api.sendEmailCode(email);
      setCode('');
      setInfo(`Išsiuntėme kodą į ${email.trim()}. Patikrinkite paštą (ir „Spam“ aplanką).`);
      setStep('code');
    });

  const verify = () =>
    run(async () => {
      await api.verifyEmailCode(email, normalizeEmailCode(code));
      setInfo(null);
      const profile = await api.getMyProfile();
      if (profile?.kind === 'helper') router.replace(next);
      else if (profile?.kind === 'senior') throw new Error('Šis el. paštas susietas su senjoro paskyra.');
      else setStep('name');
    });

  const saveName = () =>
    run(async () => {
      await api.createHelperProfile(name);
      router.replace(next);
    });

  if (step === 'loading') return <Screen>{null}</Screen>;

  return (
    <Screen>
      <ScreenHeader title="Pagalbininko prisijungimas" back />

      {step === 'email' ? (
        <>
          <AppText>Įrašykite savo el. paštą. Atsiųsime vienkartinį kodą, slaptažodžio nereikės.</AppText>
          <TextField
            label="El. paštas"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="vardas@pastas.lt"
            onSubmitEditing={() => isValidEmail(email) && sendCode()}
          />
          {error ? <Message tone="error">{error}</Message> : null}
          <BigButton
            compact
            label={busy ? 'Siunčiama…' : 'Gauti kodą'}
            disabled={busy || !isValidEmail(email)}
            onPress={sendCode}
          />
        </>
      ) : null}

      {step === 'code' ? (
        <>
          {info ? <Message tone="ok">{info}</Message> : null}
          <TextField
            label="Kodas iš laiško"
            large
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            onSubmitEditing={() => isValidEmailCode(code) && verify()}
          />
          {error ? <Message tone="error">{error}</Message> : null}
          <BigButton
            compact
            label={busy ? 'Tikrinama…' : 'Prisijungti'}
            disabled={busy || !isValidEmailCode(code)}
            onPress={verify}
          />
          <BigButton compact variant="soft" label="Siųsti kodą dar kartą" disabled={busy} onPress={sendCode} />
          <BigButton
            compact
            variant="soft"
            label="Pakeisti el. paštą"
            disabled={busy}
            onPress={() => {
              setError(null);
              setStep('email');
            }}
          />
        </>
      ) : null}

      {step === 'name' ? (
        <>
          <AppText>Kaip jus vadinti? Šį vardą matys senjoras ir kiti pagalbininkai.</AppText>
          <TextField
            label="Jūsų vardas"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="givenName"
            placeholder="pvz. Ona"
            maxLength={60}
          />
          {error ? <Message tone="error">{error}</Message> : null}
          <BigButton
            compact
            label={busy ? 'Saugoma…' : 'Išsaugoti'}
            disabled={busy || !isValidName(name)}
            onPress={saveName}
          />
        </>
      ) : null}
    </Screen>
  );
}
