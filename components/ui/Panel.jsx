'use client';

import { cn } from '@/lib/utils';

/** Glass-effect panel with optional header. */
export default function Panel({ title, icon, badge, className, bodyClassName, children }) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-panel/60 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-neon/40 before:to-transparent',
        className
      )}
    >
      {title && (
        <h3 className="flex items-center gap-2.5 px-5 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {icon && <span aria-hidden className="text-base">{icon}</span>}
          <span>{title}</span>
          {badge && (
            <span className="ml-auto rounded-full border border-neon/30 bg-neon/10 px-2.5 py-1 font-mono text-[10px] normal-case tracking-normal text-neon">
              {badge}
            </span>
          )}
        </h3>
      )}
      <div className={cn(title ? 'p-5' : 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
