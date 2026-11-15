import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { ROLE_STORAGE_KEY } from '@/lib/role';

import { fake } from '../test-utils/fake-backend';

const APP_DIR = './src/app';

beforeEach(async () => {
  await AsyncStorage.clear();
  fake.reset();
  // Šie testai tikrina ekranus be serverio (kaip 1 etape).
  fake.configured = false;
});

describe('pirmas atidarymas ir vaidmens pasirinkimas', () => {
  it('pirmą kartą parodo pasirinkimą', async () => {
    const r = await renderRouter(APP_DIR);
    expect(await screen.findByText('Kas naudosis šiuo telefonu?')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/pasirinkimas');
  });

  it('„Aš senjoras“ atidaro senjoro ekraną ir įsimena pasirinkimą', async () => {
    const r = await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText(/^Aš senjoras/));
    expect(await screen.findByText('Viskas gerai')).toBeOnTheScreen();
    expect(screen.getByText('SOS · Reikia pagalbos')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/senjoras');
    expect(await AsyncStorage.getItem(ROLE_STORAGE_KEY)).toBe('senior');
  });

  it('„Aš pagalbininkas“ atidaro pagalbininko skirtukus', async () => {
    const r = await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText(/^Aš pagalbininkas/));
    expect(await screen.findByText(/matysite, ar senjoras/)).toBeOnTheScreen();
    for (const tab of ['Vaistai', 'Gidas', 'Nustatymai']) {
      expect(screen.getAllByText(tab).length).toBeGreaterThan(0);
    }
    expect(r.getPathname()).toBe('/pagalbininkas');
    expect(await AsyncStorage.getItem(ROLE_STORAGE_KEY)).toBe('helper');
  });

  it('kitą kartą atidarius iškart rodo išsaugotą pusę', async () => {
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'senior');
    const r = await renderRouter(APP_DIR);
    expect(await screen.findByText('Viskas gerai')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/senjoras');
  });

  it('galima pereiti iš senjoro į pagalbininko pusę ir atgal', async () => {
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'senior');
    const r = await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText('Keisti vaidmenį'));
    await fireEvent.press(await screen.findByLabelText(/^Aš pagalbininkas/));
    await fireEvent.press(await screen.findByText('Nustatymai'));
    await fireEvent.press(await screen.findByLabelText('Keisti vaidmenį'));
    await fireEvent.press(await screen.findByLabelText(/^Aš senjoras/));
    expect(await screen.findByText('Viskas gerai')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/senjoras');
  });

  it('„Apie“ ekranas rodo, kad tai ne medicinos priemonė, ir grįžta atgal', async () => {
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'helper');
    const r = await renderRouter(APP_DIR, { initialUrl: '/pagalbininkas/nustatymai' });
    await fireEvent.press(await screen.findByLabelText('Apie programėlę'));
    expect(await screen.findByText(/nėra medicinos priemonė/)).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/apie');
    await fireEvent.press(screen.getByLabelText('Atgal'));
    expect(await screen.findByText(/Čia nustatysite/)).toBeOnTheScreen();
  });
});

describe('senjoro mygtukai', () => {
  it('kol funkcija nesukurta, parodo paaiškinimą', async () => {
    const { Alert } = jest.requireActual<typeof import('react-native')>('react-native');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'senior');
    await renderRouter(APP_DIR);
    await fireEvent.press(await screen.findByLabelText('SOS · Reikia pagalbos'));
    expect(alert).toHaveBeenCalledWith('SOS', expect.stringContaining('dar kuriama'), expect.any(Array));
    alert.mockRestore();
  });
});
