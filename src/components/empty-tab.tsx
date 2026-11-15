import type { ReactNode } from 'react';

import { AppText } from './app-text';
import { Card } from './card';
import { Screen } from './screen';
import { ScreenHeader } from './screen-header';

type Props = {
  title: string;
  /** Kas čia atsiras vėliau. */
  comingSoon: string;
  children?: ReactNode;
};

/** Tuščias pagalbininko skirtukas su paaiškinimu, kas čia bus. */
export function EmptyTab({ title, comingSoon, children }: Props) {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title={title} />
      <Card tone="soft">
        <AppText>{comingSoon}</AppText>
      </Card>
      {children}
    </Screen>
  );
}
