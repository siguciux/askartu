import { useEffect, useState } from 'react';

/** Dabartinis laikas, atnaujinamas kas minutę. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    // Pirmą kartą atnaujiname tiksliai minutės pradžioje, paskui kas 60 s.
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return now;
}
