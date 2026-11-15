import { useLocalSearchParams } from 'expo-router';

import { AcceptInvite } from '@/components/accept-invite';
import { HelperOnly } from '@/components/helper-only';
import { normalizeInviteCode } from '@/lib/care';

/** Atidaryta per kvietimo nuorodą askartu://kvietimas/KODAS. */
export default function InviteLink() {
  const { kodas } = useLocalSearchParams<{ kodas: string }>();
  const code = normalizeInviteCode(String(kodas ?? ''));
  return (
    <HelperOnly returnTo={`/kvietimas/${code}`} title="Kvietimo kodas">
      <AcceptInvite initialCode={code} />
    </HelperOnly>
  );
}
