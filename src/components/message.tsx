import { AppText } from './app-text';
import { Card } from './card';

type Props = {
  tone?: 'error' | 'ok' | 'info';
  children: string;
};

/** Trumpas pranešimas kortelėje: klaida, sėkmė arba informacija. */
export function Message({ tone = 'info', children }: Props) {
  const cardTone = tone === 'error' ? 'dangerSoft' : tone === 'ok' ? 'okSoft' : 'soft';
  return (
    <Card tone={cardTone}>
      <AppText accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite">
        {children}
      </AppText>
    </Card>
  );
}
