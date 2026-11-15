/**
 * Supabase projekto adresas ir viešasis (publishable) raktas.
 *
 * Jie nėra slapti: patenka į programėlę, o duomenis saugo duomenų bazės
 * taisyklės (RLS). Slapto „secret“ / „service_role“ rakto čia NIEKADA nedėti.
 *
 * Reikšmes galima perrašyti `.env.local` faile:
 *   EXPO_PUBLIC_SUPABASE_URL=...
 *   EXPO_PUBLIC_SUPABASE_KEY=...
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://tvccmoqiyhvbemdaztfd.supabase.co';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_cgw99sOKy9nWwNy89-QuJA_6zx9OpjZ';

export const isBackendConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_KEY.length > 20;
