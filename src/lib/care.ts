/** Bendri tipai ir paprastos taisyklės be ryšio su serveriu (lengva testuoti). */

export type Relation = 'family' | 'nurse' | 'social_worker';

export const RELATIONS: { value: Relation; label: string; hint: string }[] = [
  { value: 'family', label: 'Šeimos narys', hint: 'Vaikas, anūkas, sutuoktinis ar kitas artimasis' },
  { value: 'nurse', label: 'Slaugytoja', hint: 'Slaugos specialistas' },
  { value: 'social_worker', label: 'Socialinė darbuotoja', hint: 'Socialinių paslaugų darbuotojas' },
];

export function relationLabel(relation: Relation): string {
  return RELATIONS.find((r) => r.value === relation)?.label ?? relation;
}

export type Profile = {
  id: string;
  kind: 'senior' | 'helper';
  displayName: string;
};

export type CircleHelper = {
  id: string;
  displayName: string;
  relation: Relation;
  isAdmin: boolean;
};

/** Vienas senjoras ir visi jo pagalbininkai (žiūrint pagalbininko akimis). */
export type SeniorCircle = {
  seniorId: string;
  seniorName: string;
  /** Ar aš galiu kviesti ir šalinti kitus. */
  iAmAdmin: boolean;
  myRelation: Relation;
  helpers: CircleHelper[];
};

export type SessionInfo = {
  userId: string;
  email: string | null;
  isAnonymous: boolean;
};

const PAIRING_PREFIX = 'askartu://susieti/';

/** Ką įrašome į senjoro QR kodą. Nuskenavus telefono kamera atsidaro programėlė. */
export function pairingQrValue(token: string): string {
  return PAIRING_PREFIX + token;
}

/** Iš nuskenuoto QR kodo ištraukia susiejimo raktą arba grąžina `null`. */
export function parsePairingQr(data: string): string | null {
  const value = data.trim();
  const token = value.startsWith(PAIRING_PREFIX) ? value.slice(PAIRING_PREFIX.length) : value;
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
}

/** Kvietimo kodas be tarpų ir brūkšnių, didžiosiomis raidėmis. */
export function normalizeInviteCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function isValidInviteCode(input: string): boolean {
  return /^[A-HJKMNP-Z2-9]{8}$/.test(normalizeInviteCode(input));
}

/** „ABCDEFGH“ → „ABCD-EFGH“, kad būtų lengviau perskaityti. */
export function formatInviteCode(code: string): string {
  const c = normalizeInviteCode(code);
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

export function inviteLink(code: string): string {
  return `askartu://kvietimas/${normalizeInviteCode(code)}`;
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

/** El. pašto kodas: 6–8 skaitmenys (priklauso nuo Supabase nustatymų). */
export function normalizeEmailCode(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidEmailCode(input: string): boolean {
  return /^\d{6,8}$/.test(normalizeEmailCode(input));
}

export function isValidName(input: string): boolean {
  const n = input.trim();
  return n.length >= 1 && n.length <= 60;
}
