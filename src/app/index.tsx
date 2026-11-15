import { Redirect } from 'expo-router';

import { useRole } from '@/lib/role';

/** Atidarius programėlę nukreipia į tinkamą pusę pagal išsaugotą pasirinkimą. */
export default function Index() {
  const { role } = useRole();

  // Dar skaitoma iš telefono atminties.
  if (role === undefined) return null;

  if (role === 'senior') return <Redirect href="/senjoras" />;
  if (role === 'helper') return <Redirect href="/pagalbininkas" />;
  return <Redirect href="/pasirinkimas" />;
}
