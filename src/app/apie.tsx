import Constants from 'expo-constants';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';

/** „Apie“ ekranas su privalomu įspėjimu, kad tai ne medicinos priemonė. */
export default function About() {
  const version = Constants.expoConfig?.version ?? '';

  return (
    <Screen>
      <ScreenHeader title="Apie programėlę" back />
      <AppText>
        „Aš kartu“ padeda senjorams nepamiršti vaistų ir lengvai susisiekti su artimaisiais.
      </AppText>
      <Card tone="warnSoft">
        <AppText bold>
          Programėlė „Aš kartu“ nėra medicinos priemonė ir nepakeičia gydytojo ar vaistininko patarimo.
        </AppText>
        <AppText>SOS mygtukas nepakeičia 112. Esant grėsmei gyvybei, skambinkite 112.</AppText>
      </Card>
      <AppText size="small" color="muted">
        Versija {version}
      </AppText>
    </Screen>
  );
}
