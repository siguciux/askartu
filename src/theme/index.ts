/**
 * Askartu stiliaus pagrindas: spalvos, šriftai ir tarpai.
 *
 * Spalvos paimtos iš „Šalia“ prototipo. Teksto ir fono poros atitinka
 * WCAG AA (kontrastas bent 4,5:1), žr. __tests__/theme.test.ts.
 */

export const colors = {
  /** Pagrindinis fonas */
  background: '#ffffff',
  /** Tekstas */
  ink: '#12202a',
  /** Antraeilis tekstas */
  muted: '#4f606b',
  /** Linijos ir rėmeliai */
  line: '#ccd6dc',
  /** Pagrindinė spalva: gilus žalsvai mėlynas */
  accent: '#0b5d6b',
  accentInk: '#ffffff',
  /** Švelnus fonas kortelėms ir antraeiliams mygtukams */
  soft: '#e0eff1',
  /** „Gerai“ */
  ok: '#1f7a3a',
  okInk: '#ffffff',
  okSoft: '#e0f2e5',
  /** „Dėmesio“ */
  warn: '#8a5a00',
  warnSoft: '#fff1cc',
  /** Tik SOS ir pavojams */
  danger: '#b3261e',
  dangerInk: '#ffffff',
  dangerSoft: '#fde4e1',
} as const;

export type ColorName = keyof typeof colors;

export const fonts = {
  regular: 'AtkinsonHyperlegible_400Regular',
  bold: 'AtkinsonHyperlegible_700Bold',
} as const;

/** Šrifto dydžiai. Senjoro pusėje naudojami didesni. */
export const fontSize = {
  small: 15,
  body: 18,
  seniorBody: 20,
  button: 23,
  title: 26,
  clock: 44,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
} as const;

/** Mažiausias paspaudžiamo elemento aukštis senjoro pusėje. */
export const minTouchSize = 72;
