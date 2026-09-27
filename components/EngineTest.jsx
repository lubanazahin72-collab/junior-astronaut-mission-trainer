'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { computeLaunchPlan } from '@/lib/physics';
import { massOf } from '@/lib/equipment';
import { fmt } from '@/lib/utils';
import { useMission } from '@/lib/store';
import { EXHAUST_VELOCITY_MPS } from '@/lib/constants';
import { Chip } from '@/components/ui/Chips';

const BURN_MS = 4600; // burn animation length
const BURN_FRACTION = 0.16; // fraction of propellant burned during the test

const MICRO_COPY = [
  { at: 400, text: 'Propellant exits backward as exhaust.' },
  { at: 1600, text: 'Rocket mass decreases during powered flight.' },
  { at: 2900, text: 'Lower mass helps the rocket continue changing velocity.' },
];

/**
 * Rocket-science micro-simulation ("Test Engine"):
 * flame down → rocket up → fuel meter down → mass meter down → badge.
 */
export default function EngineTest() {
  const selected = useMission((s) => s.selectedEquipment);
  const fuelMass = useMission((s) => s.fuelMass);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [lines, setLines] = useState([]);
  const timers = useRef([]);

  const plan = computeLaunchPlan(massOf(selected), fuelMass);
  const burned = plan.fuelMass * BURN_FRACTION * progress;
  const fuelNow = Math.max(0, plan.fuelMass - burned);
  const massNow = Math.max(plan.finalMass, plan.initialMass - burned);

  const tankFill = fuelMass > 0 ? fuelNow / plan.initialMass : 0;
  const massFill = plan.initialMass > 0 ? massNow / plan.initialMass : 0;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function runTest() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setProgress(0);
    setLines([]);

    const t0 = performance.now();
    const tick = setInterval(() => {
      setProgress(Math.min(1, (performance.now() - t0) / BURN_MS));
    }, 60);
    timers.current.push(tick);

    MICRO_COPY.forEach(({ at, text }) => {
      timers.current.push(
        setTimeout(() => setLines((prev) => [...prev, text]), at)
      );
    });

    timers.current.push(
      setTimeout(() => {
        clearInterval(tick);
        setProgress(1);
        setRunning(false);
        setDone(true);
      }, BURN_MS)
    );
  }

  return (
    <div>
      <div className="grid items-stretch gap-4 sm:grid-cols-[220px_1fr]">
        {/* test stand */}
        <div
          className="relative flex h-56 items-end justify-center overflow-hidden rounded-xl border border-white/10"
          style={{ background: 'linear-gradient(180deg, #0a1226, #060a18)' }}
          aria-label="Engine test stand"
        >
          <motion.div
            className="relative z-10 w-14"
            animate={
              running || done
                ? { y: -(14 + progress * 26), x: [0, 1, -1, 0] }
                : { y: 0, x: 0 }
            }
            transition={
              running
                ? { y: { duration: 0.4, ease: 'easeOut' }, x: { duration: 0.3, repeat: Infinity } }
                : { duration: 0.4 }
            }
          >
            {/* mini rocket with live tank fill */}
            <svg viewBox="0 0 64 140" className="w-full drop-shadow-[0_0_12px_rgba(63,216,255,0.35)]" aria-hidden>
              <defs>
                <linearGradient id="etBody" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#d7e3ff" />
                  <stop offset="0.5" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#9fb6e8" />
                </linearGradient>
                <linearGradient id="etFlame" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffd76a" />
                  <stop offset="1" stopColor="#ff4d2e" />
                </linearGradient>
                <clipPath id="etTank"><rect x="18" y="60" width="28" height="44" rx="6" /></clipPath>
              </defs>
              <path d="M32 4 C44 26 46 44 46 66 L46 104 L18 104 L18 66 C18 44 20 26 32 4 Z" fill="url(#etBody)" stroke="#5b74b8" strokeWidth="1.5" />
              <circle cx="32" cy="40" r="7" fill="#0f2a5e" stroke="#8fd8ff" strokeWidth="2.5" />
              {/* propellant tank */}
              <rect x="18" y="60" width="28" height="44" rx="6" fill="#0b1c3a" stroke="#33477f" strokeWidth="1.5" />
              <rect
                x="18"
                y={104 - 44 * tankFill}
                width="28"
                height={44 * tankFill}
                fill="#ff9c3f"
                clipPath="url(#etTank)"
                style={{ transition: 'y 0.12s linear' }}
              />
              <rect x="18" y="104" width="28" height="10" rx="3" fill="#33477f" />
              {/* exhaust flame — moves downward while burning */}
              {(running || done) && (
                <g className={running ? 'et-flame' : ''} opacity={running ? 1 : 0.25}>
                  <path d="M24 116 C26 132 38 132 40 116 C37 124 27 124 24 116 Z" fill="url(#etFlame)" />
                  <path d="M27 116 C29 126 35 126 37 116 Z" fill="#fff3c4" />
                </g>
              )}
              <path d="M18 78 L6 110 L18 104 Z" fill="#ff5c7a" />
              <path d="M46 78 L58 110 L46 104 Z" fill="#ff5c7a" />
            </svg>
            {/* downward exhaust streaks */}
            {(running || done) && (
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2">
                {running &&
                  [0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="et-exhaust"
                      style={{ left: `${38 + i * 12}%`, animationDelay: `${i * 0.22}s` }}
                    />
                  ))}
              </div>
            )}
          </motion.div>
          <span className="absolute bottom-1.5 font-mono text-[9px] tracking-[0.2em] text-slate-500">
            TEST STAND
          </span>
        </div>

        {/* meters + micro-copy */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Fuel meter</p>
              <p className="font-mono text-lg font-black text-ambr">{fmt(fuelNow)} kg</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-ambr to-[#ff8c3f] transition-[width] duration-100" style={{ width: `${(fuelNow / plan.fuelMass) * 100}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Rocket mass meter</p>
              <p className="font-mono text-lg font-black text-neon">{fmt(massNow)} kg</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-neon to-azur transition-[width] duration-100" style={{ width: `${massFill * 100}%` }} />
              </div>
            </div>
          </div>

          <div aria-live="polite" className="min-h-[74px] space-y-1.5 font-mono text-[11px] leading-relaxed">
            {lines.map((line, i) => (
              <motion.p key={line} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-slate-300">
                <span className="text-neon">›</span> {line}
                {i === lines.length - 1 && <span className="ml-1 animate-pulse text-neon">▌</span>}
              </motion.p>
            ))}
          </div>

          <button
            type="button"
            onClick={runTest}
            disabled={running}
            className="flex items-center justify-center gap-2 self-start rounded-xl border border-ambr/50 bg-ambr/10 px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-[0.14em] text-ambr transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-ambr/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ambr disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <>Burning…</>
            ) : done ? (
              <><RotateCcw className="size-4" strokeWidth={2.5} /> Run Test Again</>
            ) : (
              <><FlaskConical className="size-4" strokeWidth={2.5} /> Test Engine</>
            )}
          </button>
        </div>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-mint/40 bg-mint/[0.08] px-4 py-3"
        >
          <span className="rounded-full border border-mint/60 bg-mint/15 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.16em] text-mint shadow-[0_0_18px_rgba(65,232,165,0.35)]">
            ✓ BURNING PROPELLANT MAKES THE ROCKET LIGHTER
          </span>
          <span className="font-mono text-[11px] text-slate-300">
            {fmt(plan.fuelMass)} → {fmt(plan.fuelMass * (1 - BURN_FRACTION))} kg propellant ·{' '}
            {fmt(plan.initialMass)} → {fmt(plan.initialMass - plan.fuelMass * BURN_FRACTION)} kg total ·{' '}
            v<sub>e</sub> {fmt(EXHAUST_VELOCITY_MPS)} m/s
          </span>
        </motion.div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        💡 NASA fact — during powered flight, rocket propellant is expelled through the nozzle, so
        the rocket mass continually changes. Source:{' '}
        <a
          className="text-neon underline decoration-neon/40 underline-offset-2 transition-colors hover:text-sky-300"
          href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/"
          target="_blank"
          rel="noopener noreferrer"
        >
          NASA Glenn — Ideal Rocket Equation
        </a>
      </p>
      <div className="mt-2">
        <Chip empty>Simplified game simulation — not an actual NASA flight calculation</Chip>
      </div>
    </div>
  );
}
