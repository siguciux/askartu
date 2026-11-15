import {
  formatInviteCode,
  inviteLink,
  isValidEmail,
  isValidEmailCode,
  isValidInviteCode,
  isValidName,
  normalizeInviteCode,
  pairingQrValue,
  parsePairingQr,
  relationLabel,
} from '@/lib/care';

const TOKEN = 'a1'.repeat(32);

describe('QR kodas', () => {
  it('nuskenuotas programėlės QR grąžina raktą', () => {
    expect(parsePairingQr(pairingQrValue(TOKEN))).toBe(TOKEN);
    expect(parsePairingQr(`  ${TOKEN} `)).toBe(TOKEN);
  });

  it('svetimi QR kodai atmetami', () => {
    expect(parsePairingQr('https://example.com')).toBeNull();
    expect(parsePairingQr('askartu://susieti/abc')).toBeNull();
    expect(parsePairingQr(`askartu://susieti/${TOKEN.toUpperCase()}`)).toBeNull();
  });
});

describe('kvietimo kodas', () => {
  it('priimamas su brūkšniu, tarpais ir mažosiomis raidėmis', () => {
    expect(normalizeInviteCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(isValidInviteCode('abcd efgh')).toBe(true);
    expect(formatInviteCode('abcdefgh')).toBe('ABCD-EFGH');
    expect(inviteLink('abcd-efgh')).toBe('askartu://kvietimas/ABCDEFGH');
  });

  it('supainiojami ženklai (0, O, 1, I, L) netinka', () => {
    expect(isValidInviteCode('ABCD-EFG0')).toBe(false);
    expect(isValidInviteCode('ABCD-EFGI')).toBe(false);
    expect(isValidInviteCode('ABCD-EFG')).toBe(false);
  });
});

describe('formos laukai', () => {
  it('el. paštas', () => {
    expect(isValidEmail(' ona@pastas.lt ')).toBe(true);
    expect(isValidEmail('ona@pastas')).toBe(false);
    expect(isValidEmail('ona')).toBe(false);
  });

  it('el. pašto kodas', () => {
    expect(isValidEmailCode('123 456')).toBe(true);
    expect(isValidEmailCode('12345678')).toBe(true);
    expect(isValidEmailCode('12345')).toBe(false);
  });

  it('vardas', () => {
    expect(isValidName(' Mama ')).toBe(true);
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('x'.repeat(61))).toBe(false);
  });

  it('vaidmenų pavadinimai lietuviškai', () => {
    expect(relationLabel('family')).toBe('Šeimos narys');
    expect(relationLabel('nurse')).toBe('Slaugytoja');
    expect(relationLabel('social_worker')).toBe('Socialinė darbuotoja');
  });
});
