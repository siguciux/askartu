import { colors } from '@/theme';

/** WCAG santykinis ryškumas. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Teksto ir fono poros, kurios naudojamos programėlėje.
const pairs: [string, string, string][] = [
  ['tekstas ant fono', colors.ink, colors.background],
  ['antraeilis tekstas ant fono', colors.muted, colors.background],
  ['tekstas ant švelnaus fono', colors.ink, colors.soft],
  ['antraeilis tekstas ant švelnaus fono', colors.muted, colors.soft],
  ['pagrindinis mygtukas', colors.accentInk, colors.accent],
  ['„Viskas gerai“ mygtukas', colors.okInk, colors.ok],
  ['SOS mygtukas', colors.dangerInk, colors.danger],
  ['tekstas ant „gerai“ kortelės', colors.ink, colors.okSoft],
  ['tekstas ant „dėmesio“ kortelės', colors.ink, colors.warnSoft],
  ['tekstas ant pavojaus kortelės', colors.ink, colors.dangerSoft],
  ['aktyvus skirtukas', colors.accent, colors.background],
];

describe('spalvų kontrastas (WCAG AA, bent 4,5:1)', () => {
  it.each(pairs)('%s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
