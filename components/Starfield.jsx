'use client';

import { useMemo } from 'react';
import { mulberry32 } from '@/lib/utils';

/** Fixed animated starfield behind every screen (deterministic for SSR). */
export default function Starfield() {
  const stars = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: 150 }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: rand() < 0.85 ? 1 + rand() * 1.4 : 2.4 + rand(),
      d: 2.5 + rand() * 5,
      delay: rand() * 6,
    }));
  }, []);

  const shooters = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 3 }, () => ({
      top: 6 + rand() * 32,
      d: 9 + rand() * 8,
      delay: rand() * 14,
    }));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={`s${i}`}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size.toFixed(1)}px`,
            height: `${s.size.toFixed(1)}px`,
            '--d': `${s.d.toFixed(2)}s`,
            animationDelay: `-${s.delay.toFixed(2)}s`,
          }}
        />
      ))}
      {shooters.map((s, i) => (
        <span
          key={`m${i}`}
          className="shooting-star"
          style={{
            top: `${s.top.toFixed(0)}%`,
            '--d': `${s.d.toFixed(1)}s`,
            animationDelay: `-${s.delay.toFixed(1)}s`,
          }}
        />
      ))}
    </div>
  );
}
