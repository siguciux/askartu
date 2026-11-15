import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Vietoj tikro serverio testuose naudojamas netikras (test-utils/fake-backend.ts).
jest.mock('@/lib/api', () => jest.requireActual('./test-utils/fake-backend'));

jest.mock('react-native-qrcode-svg', () => {
  const { Text } = jest.requireActual('react-native');
  return function QRCode({ value }: { value: string }) {
    return <Text testID="qr-value">{value}</Text>;
  };
});
