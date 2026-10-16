import { formatDayMonth, formatTime, formatWeekday, greeting } from '@/lib/date';

describe('datos formatavimas lietuviškai', () => {
  const friday = new Date(2026, 9, 16, 8, 5); // 2026-10-16 08:05, penktadienis

  it('rodo laiką su nuliais', () => {
    expect(formatTime(friday)).toBe('08:05');
    expect(formatTime(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });

  it('rodo savaitės dieną', () => {
    expect(formatWeekday(friday)).toBe('penktadienis');
    expect(formatWeekday(new Date(2026, 9, 18))).toBe('sekmadienis');
  });

  it('rodo mėnesį kilmininku ir dieną', () => {
    expect(formatDayMonth(friday)).toBe('spalio 16 d.');
    expect(formatDayMonth(new Date(2026, 6, 1))).toBe('liepos 1 d.');
  });

  it('parenka pasisveikinimą pagal paros laiką', () => {
    expect(greeting(new Date(2026, 9, 16, 4, 59))).toBe('Labas vakaras');
    expect(greeting(new Date(2026, 9, 16, 5, 0))).toBe('Labas rytas');
    expect(greeting(new Date(2026, 9, 16, 12, 0))).toBe('Laba diena');
    expect(greeting(new Date(2026, 9, 16, 18, 0))).toBe('Labas vakaras');
  });
});
