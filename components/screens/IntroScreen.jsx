'use client';

import { motion } from 'framer-motion';
import { useMission } from '@/lib/store';
import { DISCLAIMER } from '@/lib/facts';
import Rocket from '@/components/Rocket';
import { Chip } from '@/components/ui/Chips';
import { Rocket as RocketIcon } from 'lucide-react';

const FEATURES = [
  ['🧰', 'Cargo trade-offs'],
  ['🚀', 'Fuel & delta-v planning'],
  ['⚡', 'Emergency operations'],
  ['📋', 'Mission debrief'],
];

export default function IntroScreen() {
  const go = useMission((s) => s.go);

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      {/* Scene */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 620" preserveAspectRatio="none">
          <path
            d="M140 540 C 340 260, 620 220, 880 140"
            fill="none"
            stroke="rgba(120,190,255,.35)"
            strokeWidth="2"
            strokeDasharray="6 12"
          />
          <path
            className="launch-path-dash"
            d="M140 540 C 340 260, 620 220, 880 140"
            fill="none"
            stroke="rgba(63,216,255,.18)"
            strokeWidth="6"
            strokeDasharray="2 26"
            strokeLinecap="round"
          />
        </svg>
        <div className="globe -bottom-44 -left-32 size-[26rem] md:size-[30rem]" />
        <div className="moon-body -right-16 top-[8%] size-52 md:size-60" />
        <motion.div
          className="absolute left-[36%] top-[30%] w-14 md:w-20"
          animate={{ x: [0, 70, 0], y: [0, -38, 0], rotate: [46, 43, 46] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="drop-shadow-[0_0_24px_rgba(63,216,255,0.45)]">
            <Rocket className="w-full" />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex max-w-3xl flex-col items-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-neon">
          Mission Trainer · Stage 1 Prototype
        </span>

        <h1 className="mt-6 font-display text-4xl font-black leading-[1.08] md:text-6xl">
          <span className="bg-gradient-to-r from-slate-100 via-sky-200 to-neon bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(90,150,255,0.35)]">
            Junior Astronaut
          </span>
          <br />
          <span className="bg-gradient-to-r from-neon via-azur to-lav bg-clip-text text-transparent">
            Mission Trainer
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
          Plan a Moon mission, manage limited resources, and learn through mission
          decisions and consequences.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {FEATURES.map(([icon, label]) => (
            <Chip key={label}>
              <span aria-hidden>{icon}</span> {label}
            </Chip>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => go('prepBay')}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-9 py-4 font-display text-lg font-extrabold tracking-wide text-[#031024] shadow-[0_10px_40px_rgba(63,124,255,0.45)] transition-shadow hover:shadow-[0_14px_50px_rgba(63,216,255,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon"
        >
          <RocketIcon className="size-5" strokeWidth={2.5} />
          Start Mission
        </motion.button>

        <div className="mt-9 max-w-xl rounded-2xl border border-ambr/30 bg-panel/70 p-4 backdrop-blur-xl">
          <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-ambr/90">
            <span aria-hidden>🛈</span>
            {DISCLAIMER}
          </p>
          <p className="mt-2 text-left text-[11px] text-slate-400">
            Stage 1 · Earth → Moon · Two training events · About 10 minutes
          </p>
        </div>
      </motion.div>
    </div>
  );
}
