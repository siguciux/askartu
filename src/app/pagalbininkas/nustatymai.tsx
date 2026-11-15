import { router } from 'expo-router';

import { BigButton } from '@/components/big-button';
import { EmptyTab } from '@/components/empty-tab';
import { useRole } from '@/lib/role';

export default function HelperSettings() {
  const { clearRole } = useRole();

  async function switchRole() {
    await clearRole();
    router.replace('/pasirinkimas');
  }

  return (
    <EmptyTab
      title="Nustatymai"
      comingSoon="Čia nustatysite, kurie mygtukai rodomi senjorui, balso priminimus ir „Viskas gerai“ laiką.">
      <BigButton compact variant="soft" label="Apie programėlę" onPress={() => router.push('/apie')} />
      <BigButton compact variant="soft" label="Keisti vaidmenį" onPress={switchRole} />
    </EmptyTab>
  );
}
