/**
 * Visi kreipiniai į serverį (Supabase) vienoje vietoje.
 *
 * Ekranai naudoja tik šias funkcijas, todėl testuose visą failą pakeičia
 * netikras serveris (__tests__/fake-backend.ts).
 */
import type { AuthError, PostgrestError, Session } from '@supabase/supabase-js';

import type { CircleHelper, Profile, Relation, SeniorCircle, SessionInfo } from './care';
import { isBackendConfigured } from './config';
import { getSupabase } from './supabase';

export function isConfigured(): boolean {
  return isBackendConfigured;
}

/** Klaida, kurios tekstą galima rodyti žmogui. */
export class FriendlyError extends Error {}

function friendly(error: AuthError | PostgrestError | Error | null, fallback: string): FriendlyError {
  const message = error?.message ?? '';
  const code = (error as { code?: string } | null)?.code ?? '';

  if (/rate limit|too many|over_email_send_rate_limit|for security purposes/i.test(message + code)) {
    return new FriendlyError('Per daug bandymų. Palaukite minutę ir bandykite dar kartą.');
  }
  if (/otp_expired|token has expired|invalid/i.test(message + code) && fallback.includes('Kodas')) {
    return new FriendlyError('Kodas neteisingas arba nebegalioja. Paprašykite naujo kodo.');
  }
  if (/anonymous_provider_disabled|anonymous sign-ins are disabled/i.test(message + code)) {
    return new FriendlyError('Serveryje neįjungtas senjoro prisijungimas be slaptažodžio.');
  }
  if (/network|fetch/i.test(message)) {
    return new FriendlyError('Nepavyko susisiekti su serveriu. Patikrinkite internetą.');
  }
  // Mūsų duomenų bazės funkcijų klaidos jau parašytos lietuviškai.
  if (/[ąčęėįšųūž]|negalioja|Reikia|Pirma|Kviesti|Negalima/i.test(message)) {
    return new FriendlyError(message);
  }
  return new FriendlyError(fallback);
}

function toSessionInfo(session: Session | null): SessionInfo | null {
  if (!session) return null;
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    isAnonymous: session.user.is_anonymous ?? false,
  };
}

// --------------------------------------------------------------- prisijungimas

export async function getSession(): Promise<SessionInfo | null> {
  const { data } = await getSupabase().auth.getSession();
  return toSessionInfo(data.session);
}

export function onSessionChange(listener: (session: SessionInfo | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    listener(toSessionInfo(session));
  });
  return () => data.subscription.unsubscribe();
}

/** Pagalbininkui išsiunčia vienkartinį kodą el. paštu. */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw friendly(error, 'Nepavyko išsiųsti kodo. Patikrinkite el. pašto adresą.');
}

export async function verifyEmailCode(email: string, code: string): Promise<SessionInfo> {
  const { data, error } = await getSupabase().auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code,
    type: 'email',
  });
  if (error || !data.session) throw friendly(error, 'Kodas neteisingas arba nebegalioja.');
  return toSessionInfo(data.session)!;
}

/** Senjoro telefonas prisijungia be slaptažodžio (anonimiškai). */
export async function ensureSeniorSession(): Promise<SessionInfo> {
  const current = await getSession();
  if (current?.isAnonymous) return current;
  if (current) await getSupabase().auth.signOut();
  const { data, error } = await getSupabase().auth.signInAnonymously();
  if (error || !data.session) throw friendly(error, 'Nepavyko prisijungti prie serverio.');
  return toSessionInfo(data.session)!;
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

// --------------------------------------------------------------- profiliai

type ProfileRow = { id: string; kind: 'senior' | 'helper'; display_name: string };

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, kind: row.kind, displayName: row.display_name };
}

export async function getMyProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, kind, display_name')
    .eq('id', session.userId)
    .maybeSingle<ProfileRow>();
  if (error) throw friendly(error, 'Nepavyko gauti duomenų.');
  return data ? toProfile(data) : null;
}

export async function createHelperProfile(displayName: string): Promise<Profile> {
  const session = await getSession();
  if (!session) throw new FriendlyError('Reikia prisijungti.');
  const { data, error } = await getSupabase()
    .from('profiles')
    .insert({ id: session.userId, kind: 'helper', display_name: displayName.trim() })
    .select('id, kind, display_name')
    .single<ProfileRow>();
  if (error) throw friendly(error, 'Nepavyko išsaugoti vardo.');
  return toProfile(data);
}

export async function updateMyName(displayName: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new FriendlyError('Reikia prisijungti.');
  const { error } = await getSupabase()
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', session.userId);
  if (error) throw friendly(error, 'Nepavyko išsaugoti vardo.');
}

// --------------------------------------------------------------- susiejimas

/** Senjoro telefonas: naujas QR kodas (galioja 15 min.). */
export async function createPairingCode(): Promise<{ token: string; expiresAt: Date }> {
  const { data, error } = await getSupabase()
    .rpc('create_pairing_request')
    .single<{ token: string; expires_at: string }>();
  if (error || !data) throw friendly(error, 'Nepavyko sukurti QR kodo.');
  return { token: data.token, expiresAt: new Date(data.expires_at) };
}

/** Pagalbininkas: nuskenavo QR kodą. Grąžina senjoro id. */
export async function claimPairing(token: string, seniorName: string, relation: Relation): Promise<string> {
  const { data, error } = await getSupabase().rpc('claim_pairing', {
    p_token: token,
    p_senior_name: seniorName.trim(),
    p_relation: relation,
  });
  if (error) throw friendly(error, 'Nepavyko susieti. Bandykite dar kartą.');
  return data as string;
}

type LinkRow = {
  senior_id: string;
  helper_id: string;
  relation: Relation;
  is_admin: boolean;
};

async function loadLinksAndNames(): Promise<{ links: LinkRow[]; names: Map<string, string> }> {
  const supabase = getSupabase();
  const [links, profiles] = await Promise.all([
    supabase.from('care_links').select('senior_id, helper_id, relation, is_admin').order('created_at'),
    supabase.from('profiles').select('id, kind, display_name'),
  ]);
  if (links.error) throw friendly(links.error, 'Nepavyko gauti duomenų.');
  if (profiles.error) throw friendly(profiles.error, 'Nepavyko gauti duomenų.');
  const names = new Map((profiles.data as ProfileRow[]).map((p) => [p.id, p.display_name]));
  return { links: links.data as LinkRow[], names };
}

/** Pagalbininkas: mano senjorai ir jų pagalbininkai. */
export async function getMyCircles(): Promise<SeniorCircle[]> {
  const session = await getSession();
  if (!session) return [];
  const { links, names } = await loadLinksAndNames();

  const mine = links.filter((l) => l.helper_id === session.userId);
  return mine.map((m) => ({
    seniorId: m.senior_id,
    seniorName: names.get(m.senior_id) ?? '',
    iAmAdmin: m.is_admin,
    myRelation: m.relation,
    helpers: links
      .filter((l) => l.senior_id === m.senior_id)
      .map<CircleHelper>((l) => ({
        id: l.helper_id,
        displayName: names.get(l.helper_id) ?? '',
        relation: l.relation,
        isAdmin: l.is_admin,
      })),
  }));
}

/** Senjoras: kas manimi rūpinasi. */
export async function getMyHelpers(): Promise<CircleHelper[]> {
  const session = await getSession();
  if (!session) return [];
  const { links, names } = await loadLinksAndNames();
  return links
    .filter((l) => l.senior_id === session.userId)
    .map((l) => ({
      id: l.helper_id,
      displayName: names.get(l.helper_id) ?? '',
      relation: l.relation,
      isAdmin: l.is_admin,
    }));
}

// --------------------------------------------------------------- kvietimai

export async function createInvite(seniorId: string, relation: Relation): Promise<{ code: string; expiresAt: Date }> {
  const { data, error } = await getSupabase()
    .rpc('create_invite', { p_senior: seniorId, p_relation: relation })
    .single<{ code: string; expires_at: string }>();
  if (error || !data) throw friendly(error, 'Nepavyko sukurti kvietimo.');
  return { code: data.code, expiresAt: new Date(data.expires_at) };
}

/** Grąžina senjoro id. */
export async function acceptInvite(code: string): Promise<string> {
  const { data, error } = await getSupabase().rpc('accept_invite', { p_code: code });
  if (error) throw friendly(error, 'Nepavyko priimti kvietimo.');
  return data as string;
}

export async function removeHelper(seniorId: string, helperId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('care_links')
    .delete()
    .eq('senior_id', seniorId)
    .eq('helper_id', helperId);
  if (error) throw friendly(error, 'Nepavyko pašalinti.');
}
