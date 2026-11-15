import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { EmptyTab } from '@/components/empty-tab';
import * as api from '@/lib/api';
import type { Profile, SessionInfo } from '@/lib/care';
import { useRole } from '@/lib/role';

export default function HelperSettings() {
  const { clearRole } = useRole();
  const [me, setMe] = useState<{ profile: Profile | null; session: SessionInfo | null } | null>(null);

  useEffect(() => {
    if (!api.isConfigured()) return;
    let active = true;
    Promise.all([api.getMyProfile(), api.getSession()])
      .then(([profile, session]) => active && setMe({ profile, session }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function switchRole() {
    await clearRole();
    router.replace('/pasirinkimas');
  }

  async function signOut() {
    await api.signOut();
    await clearRole();
    router.replace('/pasirinkimas');
  }

  return (
    <EmptyTab
      title="Nustatymai"
      comingSoon="Čia nustatysite, kurie mygtukai rodomi senjorui, balso priminimus ir „Viskas gerai“ laiką.">
      {me?.profile ? (
        <Card>
          <AppText bold>{me.profile.displayName}</AppText>
          {me.session?.email ? (
            <AppText size="small" color="muted">
              {me.session.email}
            </AppText>
          ) : null}
        </Card>
      ) : null}
      <BigButton compact variant="soft" label="Apie programėlę" onPress={() => router.push('/apie')} />
      <BigButton compact variant="soft" label="Keisti vaidmenį" onPress={switchRole} />
      {me?.session ? <BigButton compact variant="soft" label="Atsijungti" onPress={signOut} /> : null}
    </EmptyTab>
  );
}
