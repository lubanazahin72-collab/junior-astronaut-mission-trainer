'use client';

import { STEPS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/** Mission progress rail shown across screens. */
export default function StepsRail({ active }) {
  return (
    <ol className="mb-6 flex flex-wrap gap-2" aria-label="Mission progress">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
            i < active && 'border-mint/40 bg-mint/5 text-mint',
            i === active && 'border-transparent bg-gradient-to-r from-neon to-azur text-[#031024]',
            i > active && 'border-white/10 bg-white/5 text-slate-400'
          )}
        >
          <span
            className={cn(
              'grid size-5 place-items-center rounded-full text-[10px]',
              i < active && 'bg-mint/20',
              i === active && 'bg-[#031024]/20',
              i > active && 'bg-white/10'
            )}
          >
            {i < active ? <Check size={11} strokeWidth={3} /> : i + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
