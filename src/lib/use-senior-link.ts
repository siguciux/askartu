import { useCallback, useEffect, useState } from 'react';

import * as api from './api';
import type { CircleHelper } from './care';

export type SeniorLink =
  | { status: 'loading' }
  /** Serveris dar nenustatytas: rodome pradžios ekraną be artimųjų. */
  | { status: 'offline' }
  | { status: 'error'; message: string }
  | { status: 'pairing'; token: string; expiresAt: Date }
  | { status: 'linked'; helpers: CircleHelper[] };

/** Kas kiek laiko senjoro telefonas tikrina, ar QR kodas jau nuskenuotas. */
export const PAIRING_POLL_MS = 3000;

/**
 * Senjoro telefonas: prisijungia be slaptažodžio ir arba rodo QR kodą
 * susiejimui, arba jau žino savo pagalbininkus.
 */
export function useSeniorLink(): SeniorLink & { retry: () => void } {
  const [state, setState] = useState<SeniorLink>(() =>
    api.isConfigured() ? { status: 'loading' } : { status: 'offline' },
  );
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    if (!api.isConfigured()) return;
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let codeExpiresAt: Date | null = null;

    async function newCode() {
      const { token, expiresAt } = await api.createPairingCode();
      codeExpiresAt = expiresAt;
      if (active) setState({ status: 'pairing', token, expiresAt });
    }

    async function poll() {
      try {
        const helpers = await api.getMyHelpers();
        if (!active) return;
        if (helpers.length > 0) {
          setState({ status: 'linked', helpers });
          if (timer) clearInterval(timer);
          return;
        }
        if (codeExpiresAt && codeExpiresAt.getTime() <= Date.now()) {
          await newCode();
        }
      } catch {
        // Laikina ryšio klaida: bandysime kitą kartą.
      }
    }

    (async () => {
      try {
        await api.ensureSeniorSession();
        const helpers = await api.getMyHelpers();
        if (!active) return;
        if (helpers.length > 0) {
          setState({ status: 'linked', helpers });
          return;
        }
        await newCode();
        timer = setInterval(poll, PAIRING_POLL_MS);
      } catch (e) {
        if (active) {
          setState({ status: 'error', message: e instanceof Error ? e.message : 'Nepavyko prisijungti.' });
        }
      }
    })();

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [attempt]);

  return { ...state, retry };
}
