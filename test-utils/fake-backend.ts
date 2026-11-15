/**
 * Netikras serveris testams: ta pati sąsaja kaip src/lib/api.ts, bet viskas
 * laikoma atmintyje. Tikrą duomenų bazę tikrina supabase/tests/.
 */
import type { CircleHelper, Profile, Relation, SeniorCircle, SessionInfo } from '@/lib/care';

type Link = { seniorId: string; helperId: string; relation: Relation; isAdmin: boolean };

export class FriendlyError extends Error {}

/** Valdymas iš testų. */
export const fake = {
  configured: true,
  session: null as SessionInfo | null,
  profiles: new Map<string, Profile>(),
  links: [] as Link[],
  pairing: new Map<string, { userId: string; expiresAt: Date; claimed: boolean }>(),
  invites: new Map<string, { seniorId: string; relation: Relation; used: boolean }>(),
  /** El. pašto kodas, kurį „atsiunčia“ serveris. */
  emailCode: '123456',
  sentCodes: [] as string[],
  listeners: new Set<(s: SessionInfo | null) => void>(),
  nextId: 1,

  reset() {
    fake.configured = true;
    fake.session = null;
    fake.profiles.clear();
    fake.links = [];
    fake.pairing.clear();
    fake.invites.clear();
    fake.sentCodes = [];
    fake.nextId = 1;
  },

  /** Pagalbininkas jau prisijungęs ir turi vardą. */
  signInHelper(name = 'Ona', email = 'ona@pastas.lt'): string {
    const id = `helper-${fake.nextId++}`;
    fake.profiles.set(id, { id, kind: 'helper', displayName: name });
    fake.setSession({ userId: id, email, isAnonymous: false });
    return id;
  },

  addSenior(name: string, helperId: string, relation: Relation = 'family', isAdmin = true): string {
    const id = `senior-${fake.nextId++}`;
    fake.profiles.set(id, { id, kind: 'senior', displayName: name });
    fake.links.push({ seniorId: id, helperId, relation, isAdmin });
    return id;
  },

  addHelper(name: string): string {
    const id = `helper-${fake.nextId++}`;
    fake.profiles.set(id, { id, kind: 'helper', displayName: name });
    return id;
  },

  setSession(session: SessionInfo | null) {
    fake.session = session;
    fake.listeners.forEach((l) => l(session));
  },

  /** Pagalbininkas kitame telefone nuskenuoja dabartinį QR kodą. */
  scanCurrentQr(seniorName: string, helperName = 'Ona', relation: Relation = 'family') {
    const entry = [...fake.pairing.entries()].find(([, p]) => !p.claimed);
    if (!entry) throw new Error('nėra QR kodo');
    const [, request] = entry;
    request.claimed = true;
    const helperId = fake.addHelper(helperName);
    fake.profiles.set(request.userId, { id: request.userId, kind: 'senior', displayName: seniorName });
    fake.links.push({ seniorId: request.userId, helperId, relation, isAdmin: true });
  },
};

function me(): SessionInfo {
  if (!fake.session) throw new FriendlyError('Reikia prisijungti.');
  return fake.session;
}

function name(id: string) {
  return fake.profiles.get(id)?.displayName ?? '';
}

export function isConfigured() {
  return fake.configured;
}

export async function getSession() {
  return fake.session;
}

export function onSessionChange(listener: (s: SessionInfo | null) => void) {
  fake.listeners.add(listener);
  return () => {
    fake.listeners.delete(listener);
  };
}

export async function sendEmailCode(email: string) {
  fake.sentCodes.push(email.trim().toLowerCase());
}

export async function verifyEmailCode(email: string, code: string) {
  if (code !== fake.emailCode) throw new FriendlyError('Kodas neteisingas arba nebegalioja. Paprašykite naujo kodo.');
  const normalized = email.trim().toLowerCase();
  const existing = [...fake.profiles.values()].find((p) => p.id === `email:${normalized}`);
  const session = { userId: existing?.id ?? `email:${normalized}`, email: normalized, isAnonymous: false };
  fake.setSession(session);
  return session;
}

export async function ensureSeniorSession() {
  if (fake.session?.isAnonymous) return fake.session;
  const session = { userId: `anon-${fake.nextId++}`, email: null, isAnonymous: true };
  fake.setSession(session);
  return session;
}

export async function signOut() {
  fake.setSession(null);
}

export async function getMyProfile(): Promise<Profile | null> {
  return fake.session ? (fake.profiles.get(fake.session.userId) ?? null) : null;
}

export async function createHelperProfile(displayName: string) {
  const { userId } = me();
  const profile: Profile = { id: userId, kind: 'helper', displayName: displayName.trim() };
  fake.profiles.set(userId, profile);
  return profile;
}

export async function updateMyName(displayName: string) {
  const p = fake.profiles.get(me().userId);
  if (p) p.displayName = displayName.trim();
}

export async function createPairingCode() {
  const { userId } = me();
  for (const [k, v] of fake.pairing) if (v.userId === userId && !v.claimed) fake.pairing.delete(k);
  const token = String(fake.nextId++).padStart(64, 'a');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  fake.pairing.set(token, { userId, expiresAt, claimed: false });
  return { token, expiresAt };
}

export async function claimPairing(token: string, seniorName: string, relation: Relation) {
  const { userId } = me();
  const request = fake.pairing.get(token);
  if (!request || request.claimed || request.expiresAt < new Date()) {
    throw new FriendlyError('QR kodas negalioja. Senjoro telefone atnaujinkite kodą.');
  }
  request.claimed = true;
  fake.profiles.set(request.userId, { id: request.userId, kind: 'senior', displayName: seniorName.trim() });
  fake.links.push({ seniorId: request.userId, helperId: userId, relation, isAdmin: true });
  return request.userId;
}

function helpersOf(seniorId: string): CircleHelper[] {
  return fake.links
    .filter((l) => l.seniorId === seniorId)
    .map((l) => ({ id: l.helperId, displayName: name(l.helperId), relation: l.relation, isAdmin: l.isAdmin }));
}

export async function getMyCircles(): Promise<SeniorCircle[]> {
  const { userId } = me();
  return fake.links
    .filter((l) => l.helperId === userId)
    .map((l) => ({
      seniorId: l.seniorId,
      seniorName: name(l.seniorId),
      iAmAdmin: l.isAdmin,
      myRelation: l.relation,
      helpers: helpersOf(l.seniorId),
    }));
}

export async function getMyHelpers() {
  return fake.session ? helpersOf(fake.session.userId) : [];
}

export async function createInvite(seniorId: string, relation: Relation) {
  const { userId } = me();
  if (!fake.links.some((l) => l.seniorId === seniorId && l.helperId === userId && l.isAdmin)) {
    throw new FriendlyError('Kviesti gali tik senjorą susiejęs pagalbininkas');
  }
  const code = 'ABCDEFGH';
  fake.invites.set(code, { seniorId, relation, used: false });
  return { code, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) };
}

export async function acceptInvite(code: string) {
  const { userId } = me();
  const invite = fake.invites.get(code);
  if (!invite || invite.used) throw new FriendlyError('Kvietimo kodas negalioja');
  invite.used = true;
  fake.links.push({ seniorId: invite.seniorId, helperId: userId, relation: invite.relation, isAdmin: false });
  return invite.seniorId;
}

export async function removeHelper(seniorId: string, helperId: string) {
  fake.links = fake.links.filter((l) => !(l.seniorId === seniorId && l.helperId === helperId));
}
