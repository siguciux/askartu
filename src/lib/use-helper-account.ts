import { useEffect, useState } from 'react';

import * as api from './api';
import type { Profile } from './care';

export type HelperAccount =
  | { status: 'loading' }
  /** Serveris dar nenustatytas: rodome ekranus be duomenų. */
  | { status: 'offline' }
  | { status: 'signedOut' }
  | { status: 'ready'; profile: Profile };

/** Ar šiame telefone prisijungęs pagalbininkas su vardu. */
export function useHelperAccount(): HelperAccount {
  const [state, setState] = useState<HelperAccount>(() =>
    api.isConfigured() ? { status: 'loading' } : { status: 'offline' },
  );

  useEffect(() => {
    if (!api.isConfigured()) return;
    let active = true;

    async function check() {
      try {
        const session = await api.getSession();
        if (!session || session.isAnonymous) {
          if (active) setState({ status: 'signedOut' });
          return;
        }
        const profile = await api.getMyProfile();
        if (!active) return;
        setState(profile?.kind === 'helper' ? { status: 'ready', profile } : { status: 'signedOut' });
      } catch {
        if (active) setState({ status: 'signedOut' });
      }
    }

    check();
    const unsubscribe = api.onSessionChange(() => {
      check();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}
