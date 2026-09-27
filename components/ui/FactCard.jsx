'use client';

/** NASA-informed fact panel with real-science vs game-scenario split. */
export default function FactCard({ fact }) {
  return (
    <section
      aria-label="NASA-informed fact"
      className="relative overflow-hidden rounded-2xl border border-neon/30 bg-gradient-to-br from-neon/[0.08] via-panel/60 to-lav/[0.08] p-5 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-neon/50 bg-neon/15 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-neon">
          NASA-INFORMED FACT
        </span>
        <h4 className="font-display text-base font-bold text-slate-100">{fact.title}</h4>
      </div>

      <p className="mt-3 border-l-2 border-neon/50 pl-3 text-sm italic leading-relaxed text-slate-200">
        {fact.fact}
      </p>
      <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{fact.plain}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-mint/25 bg-mint/5 p-3">
          <b className="font-mono text-[10px] tracking-[0.18em] text-mint">REAL SCIENCE FACT</b>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-200">{fact.realScience}</p>
        </div>
        <div className="rounded-xl border border-ambr/25 bg-ambr/5 p-3">
          <b className="font-mono text-[10px] tracking-[0.18em] text-ambr">SIMPLIFIED GAME SCENARIO</b>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-200">{fact.gameScenario}</p>
        </div>
      </div>

      <p className="mt-3.5 text-[13px] leading-relaxed text-slate-300">
        <b className="text-slate-100">Simplified Simulation Connection:</b> {fact.simConnection}
      </p>
      <p className="mt-2.5 text-xs text-slate-400">
        Source:{' '}
        <a
          className="text-neon underline decoration-neon/40 underline-offset-2 transition-colors hover:text-sky-300"
          href={fact.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {fact.source}
        </a>
      </p>
    </section>
  );
}
