import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { pairingQrValue } from '@/lib/care';
import { colors, spacing } from '@/theme';

import { AppText } from './app-text';
import { Card } from './card';

/** Senjoro telefone: didelis QR kodas, kurį nuskenuoja pagalbininkas. */
export function SeniorPairing({ token }: { token: string }) {
  return (
    <>
      <AppText bold size="title" accessibilityRole="header">
        Susiekime su artimuoju
      </AppText>
      <AppText size="seniorBody">
        Paprašykite artimojo savo telefone atidaryti „Aš kartu“ ir nuskenuoti šį kodą.
      </AppText>
      <View
        style={styles.qr}
        accessible
        accessibilityLabel="QR kodas susiejimui"
        testID="susiejimo-qr">
        <QRCode value={pairingQrValue(token)} size={260} color={colors.ink} backgroundColor={colors.background} />
      </View>
      <Card tone="soft">
        <AppText size="small">
          Kodas atsinaujina pats kas 15 minučių. Kai artimasis nuskenuos, šis ekranas pasikeis savaime.
        </AppText>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  qr: {
    alignSelf: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
