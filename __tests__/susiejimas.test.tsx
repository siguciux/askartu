import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import * as fakeApi from '../test-utils/fake-backend';
import { fake } from '../test-utils/fake-backend';
import { PAIRING_POLL_MS } from '@/lib/use-senior-link';
import { ROLE_STORAGE_KEY } from '@/lib/role';

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

const APP_DIR = './src/app';

beforeEach(async () => {
  await AsyncStorage.clear();
  fake.reset();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Senjoro telefonas sukuria QR kodą (kaip tai darytų kitas telefonas). */
async function seniorPhoneQrToken(): Promise<string> {
  await fakeApi.ensureSeniorSession();
  const { token } = await fakeApi.createPairingCode();
  fake.setSession(null);
  return token;
}

describe('senjoro telefono susiejimas', () => {
  it('nesusietas senjoras mato QR kodą, o po nuskenavimo savo artimąjį', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'senior');
    await renderRouter(APP_DIR);

    expect(await screen.findByText('Susiekime su artimuoju')).toBeOnTheScreen();
    expect(screen.getByTestId('qr-value').props.children).toMatch(/^askartu:\/\/susieti\/[0-9a-f]{64}$/);
    expect(fake.session?.isAnonymous).toBe(true);

    fake.scanCurrentQr('Mama', 'Ona', 'family');
    await act(() => jest.advanceTimersByTimeAsync(PAIRING_POLL_MS + 100));

    expect(await screen.findByText('Jumis rūpinasi')).toBeOnTheScreen();
    expect(screen.getByText(/Ona/)).toBeOnTheScreen();
    expect(screen.getByText('Viskas gerai')).toBeOnTheScreen();
  });

  it('jau susietas senjoras iškart mato pradžios ekraną', async () => {
    const session = await fakeApi.ensureSeniorSession();
    const helper = fake.addHelper('Jonas');
    fake.profiles.set(session.userId, { id: session.userId, kind: 'senior', displayName: 'Tėtis' });
    fake.links.push({ seniorId: session.userId, helperId: helper, relation: 'nurse', isAdmin: true });
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'senior');

    await renderRouter(APP_DIR);
    expect(await screen.findByText('Jumis rūpinasi')).toBeOnTheScreen();
    expect(screen.getByText(/Jonas/)).toBeOnTheScreen();
    expect(screen.getByText(/Slaugytoja/)).toBeOnTheScreen();
    expect(screen.queryByText('Susiekime su artimuoju')).toBeNull();
  });

  it('pagalbininkas po QR nuskenavimo įrašo senjoro vardą ir vaidmenį', async () => {
    const token = await seniorPhoneQrToken();
    fake.signInHelper('Ona');
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'helper');

    const r = await renderRouter(APP_DIR, { initialUrl: `/susieti/${token}` });
    await fireEvent.changeText(await screen.findByLabelText('Kaip vadinti senjorą?'), 'Mama');
    await fireEvent.press(screen.getByLabelText('Šeimos narys'));
    await fireEvent.press(screen.getByLabelText('Susieti'));

    expect(await screen.findByText('Susieta!')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Į apžvalgą'));
    expect(await screen.findByText('Mama')).toBeOnTheScreen();
    expect(screen.getByText(/Ona.*\(jūs\)/)).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/pagalbininkas');
  });

  it('panaudotas QR kodas antrą kartą netinka', async () => {
    const token = await seniorPhoneQrToken();
    fake.pairing.get(token)!.claimed = true;
    fake.signInHelper('Ona');

    await renderRouter(APP_DIR, { initialUrl: `/susieti/${token}` });
    await fireEvent.changeText(await screen.findByLabelText('Kaip vadinti senjorą?'), 'Mama');
    await fireEvent.press(screen.getByLabelText('Slaugytoja'));
    await fireEvent.press(screen.getByLabelText('Susieti'));
    expect(await screen.findByText(/QR kodas negalioja/)).toBeOnTheScreen();
  });

  it('neteisingas QR kodas parodo klaidą', async () => {
    fake.signInHelper('Ona');
    await renderRouter(APP_DIR, { initialUrl: '/susieti/blogas' });
    expect(await screen.findByText(/QR kodas neteisingas/)).toBeOnTheScreen();
  });

  it('neprisijungęs nuskenavęs QR pirmiausia prisijungia', async () => {
    const r = await renderRouter(APP_DIR, { initialUrl: '/susieti' });
    expect(await screen.findByText('Pagalbininko prisijungimas')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/prisijungimas');
  });
});

describe('pagalbininko prisijungimas', () => {
  it('el. paštas → kodas → vardas → apžvalga', async () => {
    const r = await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText(/^Aš pagalbininkas/));
    expect(await screen.findByText('Pagalbininko prisijungimas')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/prisijungimas');

    await fireEvent.changeText(screen.getByLabelText('El. paštas'), ' Ona@Pastas.lt ');
    await fireEvent.press(screen.getByLabelText('Gauti kodą'));
    expect(fake.sentCodes).toEqual(['ona@pastas.lt']);
    expect(await screen.findByText(/Išsiuntėme kodą/)).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Kodas iš laiško'), '000000');
    await fireEvent.press(screen.getByLabelText('Prisijungti'));
    expect(await screen.findByText(/Kodas neteisingas/)).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Kodas iš laiško'), '123 456');
    await fireEvent.press(screen.getByLabelText('Prisijungti'));
    await fireEvent.changeText(await screen.findByLabelText('Jūsų vardas'), 'Ona');
    await fireEvent.press(screen.getByLabelText('Išsaugoti'));

    expect(await screen.findByText('Dar nesusieta su senjoru')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/pagalbininkas');
  });

  it('neteisingas el. paštas neleidžia siųsti kodo', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/prisijungimas' });
    await fireEvent.changeText(await screen.findByLabelText('El. paštas'), 'ona');
    await fireEvent.press(screen.getByLabelText('Gauti kodą'));
    expect(fake.sentCodes).toEqual([]);
  });

  it('atsijungus grįžtama į pasirinkimą', async () => {
    fake.signInHelper('Ona');
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'helper');
    const r = await renderRouter(APP_DIR, { initialUrl: '/pagalbininkas/nustatymai' });
    expect(await screen.findByText('ona@pastas.lt')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Atsijungti'));
    expect(await screen.findByText('Kas naudosis šiuo telefonu?')).toBeOnTheScreen();
    expect(fake.session).toBeNull();
    expect(r.getPathname()).toBe('/pasirinkimas');
  });
});

describe('kvietimai', () => {
  it('administratorė sukuria kvietimą slaugytojai', async () => {
    const ona = fake.signInHelper('Ona');
    fake.addSenior('Mama', ona);
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'helper');

    await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText('Pakviesti pagalbininką'));
    await fireEvent.press(await screen.findByLabelText('Slaugytoja'));
    await fireEvent.press(screen.getByLabelText('Sukurti kvietimą'));

    expect(await screen.findByText('ABCD-EFGH')).toBeOnTheScreen();
    expect(fake.invites.get('ABCDEFGH')?.relation).toBe('nurse');
  });

  it('kitas pagalbininkas priima kvietimą per nuorodą', async () => {
    const ona = fake.signInHelper('Ona');
    const mama = fake.addSenior('Mama', ona);
    await fakeApi.createInvite(mama, 'nurse');
    const jonas = fake.signInHelper('Jonas', 'jonas@pastas.lt');
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'helper');

    await renderRouter(APP_DIR, { initialUrl: '/kvietimas/abcd-efgh' });
    expect(await screen.findByDisplayValue('ABCD-EFGH')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Priimti kvietimą'));
    expect(await screen.findByText('Kvietimas priimtas')).toBeOnTheScreen();
    expect(fake.links).toContainEqual({ seniorId: mama, helperId: jonas, relation: 'nurse', isAdmin: false });

    await fireEvent.press(screen.getByLabelText('Į apžvalgą'));
    expect(await screen.findByText('Mama')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Pakviesti pagalbininką')).toBeNull();
  });

  it('administratorė gali pašalinti kitą pagalbininką', async () => {
    const ona = fake.signInHelper('Ona');
    const mama = fake.addSenior('Mama', ona);
    const jonas = fake.addHelper('Jonas');
    fake.links.push({ seniorId: mama, helperId: jonas, relation: 'family', isAdmin: false });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'helper');

    await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText('Pašalinti Jonas'));
    expect(alert).toHaveBeenCalled();
    await act(async () => {});
    expect(fake.links.some((l) => l.helperId === jonas)).toBe(false);
    alert.mockRestore();
  });
});
