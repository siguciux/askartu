import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { HelperOnly } from '@/components/helper-only';
import { Message } from '@/components/message';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { parsePairingQr } from '@/lib/care';
import { colors, radius } from '@/theme';

/** Pagalbininkas nuskenuoja senjoro telefone rodomą QR kodą. */
export default function ScanSeniorQr() {
  return (
    <HelperOnly returnTo="/susieti" title="Susieti senjoro telefoną">
      <Scanner />
    </HelperOnly>
  );
}

function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const handled = useRef(false);

  function handleCode(raw: string) {
    if (handled.current) return;
    const token = parsePairingQr(raw);
    if (!token) {
      setError('Tai ne „Aš kartu“ QR kodas. Nuskenuokite kodą senjoro telefone.');
      return;
    }
    handled.current = true;
    router.replace({ pathname: '/susieti/[kodas]', params: { kodas: token } });
  }

  const onScanned = (result: BarcodeScanningResult) => handleCode(result.data);
  const canUseCamera = Platform.OS !== 'web';

  return (
    <Screen>
      <ScreenHeader title="Susieti senjoro telefoną" back />
      <AppText>
        Senjoro telefone pasirinkite „Aš senjoras“. Atsiras QR kodas. Nukreipkite šio telefono kamerą į jį.
      </AppText>

      {canUseCamera && permission?.granted ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned}
          />
        </View>
      ) : null}

      {canUseCamera && permission && !permission.granted ? (
        <>
          <Message>Kad nuskenuotume QR kodą, reikia leisti naudotis kamera.</Message>
          <BigButton compact label="Leisti naudoti kamerą" onPress={requestPermission} />
        </>
      ) : null}

      {error ? <Message tone="error">{error}</Message> : null}

      {!canUseCamera ? (
        <>
          <TextField
            label="Arba įklijuokite kodą"
            value={manual}
            onChangeText={setManual}
            autoCapitalize="none"
            placeholder="askartu://susieti/…"
          />
          <BigButton compact label="Toliau" disabled={!manual.trim()} onPress={() => handleCode(manual)} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
});
