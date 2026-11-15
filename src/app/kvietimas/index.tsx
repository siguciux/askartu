import { AcceptInvite } from '@/components/accept-invite';
import { HelperOnly } from '@/components/helper-only';

export default function EnterInviteCode() {
  return (
    <HelperOnly returnTo="/kvietimas" title="Kvietimo kodas">
      <AcceptInvite />
    </HelperOnly>
  );
}
