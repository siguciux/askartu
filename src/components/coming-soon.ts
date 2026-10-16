import { Alert } from 'react-native';

/** Laikinas pranešimas mygtukams, kurių funkcija bus sukurta vėlesniuose etapuose. */
export function showComingSoon(what: string) {
  Alert.alert(what, 'Ši dalis dar kuriama. Ji atsiras kituose etapuose.', [{ text: 'Gerai' }]);
}
