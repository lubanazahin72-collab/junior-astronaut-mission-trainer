'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

let nextLogId = 1;

/** Console log hook: newest line first, capped history. */
export function useLog(initial = []) {
  const [lines, setLines] = useState(() =>
    initial.map(([text, tone]) => ({ id: nextLogId++, text, tone }))
  );
  const push = useCallback((text, tone = '') => {
    setLines((prev) => [{ id: nextLogId++, text, tone }, ...prev].slice(0, 40));
  }, []);
  return [lines, push];
}

const TONE_CLASS = {
  good: 'text-mint',
  warn: 'text-ambr',
  bad: 'text-coral',
};

/** Mission-control console readout. */
export default function LogConsole({ lines, className, label = 'Mission log' }) {
  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={cn(
        'log-scroll h-36 overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] leading-relaxed',
        className
      )}
    >
      {lines.map((line) => (
        <div key={line.id} className={cn('text-slate-300', TONE_CLASS[line.tone])}>
          {line.text}
        </div>
      ))}
    </div>
  );
}
