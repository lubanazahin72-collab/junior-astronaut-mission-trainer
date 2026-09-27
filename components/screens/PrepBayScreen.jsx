'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AVATARS, PREP_ITEMS, prepComplete, prepCount } from '@/lib/astronaut';
import { FACTS } from '@/lib/facts';
import { useMission } from '@/lib/store';
import { cn } from '@/lib/utils';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import FactCard from '@/components/ui/FactCard';

// where each completed item's badge floats around the avatar
const LAYER_POS = {
  suit: 'left-1/2 top-0 -translate-x-1/2',
  helmet: 'left-[6%] top-[12%]',
  oxygen: 'right-[6%] top-[12%]',
  comms: 'left-[4%] bottom-[16%]',
  medical: 'right-[4%] bottom-[16%]',
};

export default function PrepBayScreen() {
  const astronaut = useMission((s) => s.astronaut);
  const selectAstronaut = useMission((s) => s.selectAstronaut);
  const completePrep = useMission((s) => s.completePrep);
  const go = useMission((s) => s.go);

  const [justDone, setJustDone] = useState(null);
  const done = prepCount(astronaut.prep);
  const ready = prepComplete(astronaut.prep);

  function handlePrep(id) {
    if (astronaut.prep[id]) return;
    completePrep(id);
    setJustDone(id);
    setTimeout(() => setJustDone((v) => (v === id ? null : v)), 900);
  }

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={0} />
      <header className="mb-6 max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-neon">
          Phase 1 · Mission Preparation Bay
        </span>
        <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">
          Astronaut Preparation
        </h1>
        <p className="mt-2.5 leading-relaxed text-slate-400">
          NASA astronauts train with spacesuits, spacecraft systems, medical operations, exercise
          systems, and emergency procedures before lunar missions. Run all five readiness checks —
          the fuel console stays locked until the astronaut is mission-ready.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Prep room scene */}
        <Panel title="Prep Room — Launchpad" icon="🧑‍🚀">
          {/* avatar picker */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose your astronaut">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Astronaut
            </span>
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAstronaut(a.id)}
                aria-pressed={astronaut.avatarId === a.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon',
                  astronaut.avatarId === a.id
                    ? 'border-neon bg-neon/10 text-slate-100 shadow-[0_0_0_1px_var(--color-neon)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-neon/40 hover:bg-white/[0.06]'
                )}
              >
                <span aria-hidden className="text-xl">{a.emoji}</span> {a.name}
              </button>
            ))}
          </div>

          {/* avatar + gear layers */}
          <div
            className="relative mx-auto mt-5 h-64 w-full max-w-md overflow-hidden rounded-xl border border-white/10"
            style={{
              background:
                'radial-gradient(420px 220px at 50% 0%, rgba(63,216,255,.14), transparent 60%), linear-gradient(180deg, #0a1226, #060a18)',
            }}
            aria-label="Astronaut in the preparation bay"
          >
            {/* floor grid */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-20 opacity-30"
              style={{
                background:
                  'repeating-linear-gradient(90deg, rgba(63,216,255,.25) 0 1px, transparent 1px 42px), repeating-linear-gradient(0deg, rgba(63,216,255,.18) 0 1px, transparent 1px 20px)',
              }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl"
              animate={
                ready
                  ? { y: [0, -6, 0], filter: ['drop-shadow(0 0 10px rgba(63,216,255,.5))', 'drop-shadow(0 0 26px rgba(65,232,165,.7))', 'drop-shadow(0 0 10px rgba(63,216,255,.5))'] }
                  : { y: 0 }
              }
              transition={ready ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              {astronaut.name ? (
                <span role="img" aria-label={`${astronaut.name} the astronaut`}>
                  {AVATARS.find((a) => a.id === astronaut.avatarId)?.emoji}
                </span>
              ) : null}
            </motion.div>

            {/* completed gear layers */}
            {PREP_ITEMS.filter((p) => astronaut.prep[p.id]).map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, scale: 0.4, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className={cn(
                  'absolute rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.14em]',
                  LAYER_POS[p.id],
                  'border-mint/50 bg-[rgba(4,20,14,0.75)] text-mint shadow-[0_0_16px_rgba(65,232,165,0.35)]'
                )}
              >
                {p.icon} {p.layer}
              </motion.span>
            ))}

            {ready && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-0 bottom-3 text-center"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-mint/60 bg-[rgba(4,20,14,0.8)] px-4 py-1.5 font-mono text-[11px] font-bold tracking-[0.2em] text-mint shadow-[0_0_28px_rgba(65,232,165,0.4)]">
                  ✓ ASTRONAUT MISSION-READY
                </span>
              </motion.div>
            )}
          </div>

          <div className="mt-4">
            <Meter
              label="Readiness"
              value={done}
              max={PREP_ITEMS.length}
              unit={` / ${PREP_ITEMS.length}`}
              tone={ready ? 'green' : 'cyan'}
              sub={ready ? 'All five checks complete — fuel console unlocked' : `${PREP_ITEMS.length - done} checks remaining before the fuel console unlocks`}
            />
          </div>
        </Panel>

        {/* Prep actions */}
        <Panel title="Readiness Checks" icon="🧰" badge={`${done}/${PREP_ITEMS.length} complete`}>
          <div className="space-y-2.5">
            {PREP_ITEMS.map((item) => {
              const isDone = astronaut.prep[item.id];
              const pop = justDone === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-pressed={isDone}
                  disabled={isDone}
                  onClick={() => handlePrep(item.id)}
                  animate={pop ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon',
                    isDone
                      ? 'border-mint/45 bg-mint/[0.08]'
                      : 'border-white/10 bg-white/[0.03] hover:border-neon/40 hover:bg-white/[0.06]'
                  )}
                >
                  <span aria-hidden className="text-2xl">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm text-slate-100">{item.name}</b>
                    <small className="text-xs text-slate-400">{item.action}</small>
                  </span>
                  {isDone ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-mint/50 bg-mint/10 px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.14em] text-mint">
                      ✓ {item.badge}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.14em] text-neon">
                      PERFORM CHECK
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!ready}
            onClick={() => go('prepare')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-neon via-azur to-lav px-5 py-3 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50"
          >
            Open Cargo Bay <ArrowRight className="size-4" strokeWidth={2.5} />
          </button>
          {!ready && (
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Complete all five readiness checks to continue.
            </p>
          )}
        </Panel>
      </div>

      <div className="mt-5">
        <FactCard fact={FACTS.prep} />
      </div>
    </div>
  );
}
