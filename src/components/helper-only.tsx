import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useHelperAccount } from '@/lib/use-helper-account';

import { Message } from './message';
import { Screen } from './screen';
import { ScreenHeader } from './screen-header';

type Props = {
  /** Kur grįžti po prisijungimo, pvz. „/susieti/abc“. */
  returnTo: string;
  title: string;
  children: ReactNode;
};

/** Rodo turinį tik prisijungusiam pagalbininkui; kitaip veda į prisijungimą. */
export function HelperOnly({ returnTo, title, children }: Props) {
  const account = useHelperAccount();

  if (account.status === 'loading') return null;
  if (account.status === 'signedOut') {
    return <Redirect href={{ pathname: '/prisijungimas', params: { next: returnTo } }} />;
  }
  if (account.status === 'offline') {
    return (
      <Screen>
        <ScreenHeader title={title} back />
        <Message>Ryšys su serveriu dar nenustatytas.</Message>
      </Screen>
    );
  }
  return <>{children}</>;
}
