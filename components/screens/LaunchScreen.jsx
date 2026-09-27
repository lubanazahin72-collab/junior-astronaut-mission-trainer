'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { massOf } from '@/lib/equipment';
import { computeLaunchPlan } from '@/lib/physics';
import { fmt } from '@/lib/utils';
import { useMission } from '@/lib/store';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import Rocket from '@/components/Rocket';
import AstronautAvatar from '@/components/AstronautAvatar';

const TRANSIT_MS = 12000;

export default function LaunchScreen() {
  const selected = useMission((s) => s.selectedEquipment);
  const fuelMass = useMission((s) => s.fuelMass);
  const astronaut = useMission((s) => s.astronaut);
  const go = useMission((s) => s.go);

  const plan = computeLaunchPlan(massOf(selected), fuelMass);
  const propellantPlan = Math.min(
    100,
    Math.round((plan.achievableDeltaV / plan.requiredDeltaV) * 100)
  );

  const [pct, setPct] = useState(0);
  const [thrust, setThrust] = useState(92);
  const [canArrive, setCanArrive] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [particles, setParticles] = useState([]);

  const rocketRef = useRef(null);
  const sceneRef = useRef(null);
  const particleId = useRef(0);
  const arrivedRef = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const timers = [
      setTimeout(() => setCanArrive(true), 1200),
      setInterval(() => setThrust(90 + Math.random() * 5), 700),
      setInterval(() => {
        if (arrivedRef.current) return;
        setPct(Math.min(100, ((performance.now() - t0) / TRANSIT_MS) * 100));
      }, 120),
      setInterval(() => {
        if (arrivedRef.current) return;
        const r = rocketRef.current?.getBoundingClientRect();
        const s = sceneRef.current?.getBoundingClientRect();
        if (!r || !s || !r.width) return;
        const id = ++particleId.current;
        setParticles((prev) => [
          ...prev.slice(-30),
          { id, x: r.left - s.left + 6, y: r.top - s.top + r.height * 0.74 },
        ]);
        setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 830);
      }, 80),
    ];
    return () => timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  }, []);

  function arrive() {
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    setArrived(true);
    setPct(100);
    setTimeout(() => go('power'), 650);
  }

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={2} />
      <header className="mb-6 max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-neon">
          Phase 3 · Transit
        </span>
        <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">Launch — Earth to Moon</h1>
        <p className="mt-2.5 leading-relaxed text-slate-400">
          Plan accepted: <b className="text-slate-200">{fmt(fuelMass)} kg propellant</b> ·{' '}
          <b className="text-slate-200">{fmt(plan.achievableDeltaV)} m/s achievable delta-v</b>. Watch
          the transit, then arrive when ready.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        {/* Transit scene */}
        <div
          ref={sceneRef}
          aria-label="Rocket traveling from Earth toward the Moon"
          className="relative h-72 overflow-hidden rounded-2xl border border-white/10 sm:h-96 md:h-[26rem]"
          style={{
            background:
              'radial-gradient(1200px 500px at 20% 110%, rgba(47,127,224,.25), transparent 60%), radial-gradient(800px 400px at 90% -10%, rgba(200,210,255,.12), transparent 60%), #050a18',
          }}
        >
          <div className="globe -bottom-28 -left-20 size-64" />
          <div className="moon-body right-[6%] top-[10%] size-20 md:size-24" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path className="launch-path-dash" d="M12 74 Q 50 6 86 26" fill="none" stroke="rgba(120,190,255,.3)" strokeWidth="0.6" strokeDasharray="2 2.4" />
          </svg>

          {/* astronaut riding the mission (small avatar near the rocket) */}
          <motion.div
            aria-hidden
            className="absolute z-20"
            initial={{ left: '9%', bottom: '16%' }}
            animate={
              arrived
                ? { left: '87.5%', bottom: '60%' }
                : { left: '82.5%', bottom: '62%' }
            }
            transition={
              arrived
                ? { duration: 0.5, ease: 'easeOut' }
                : { left: { duration: 12, ease: 'linear' }, bottom: { duration: 12, ease: 'easeInOut' } }
            }
            style={{ rotate: 68 }}
          >
            <AstronautAvatar avatarId={astronaut.avatarId} size="sm" glow />
          </motion.div>

          {/* flame trail */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {particles.map((p) => (
              <span key={p.id} className="flame-particle" style={{ left: p.x, top: p.y }} />
            ))}
          </div>

          {/* rocket */}
          <motion.div
            ref={rocketRef}
            className="absolute z-10 w-10 md:w-12"
            initial={{ left: '6%', bottom: '14%' }}
            animate={
              arrived
                ? { left: '84%', bottom: '56%' }
                : { left: '79%', bottom: '58%' }
            }
            transition={
              arrived
                ? { duration: 0.5, ease: 'easeOut' }
                : { left: { duration: 12, ease: 'linear' }, bottom: { duration: 12, ease: 'easeInOut' } }
            }
            style={{ rotate: 68 }}
          >
            <motion.div
              animate={arrived ? {} : { y: [0, -12, 6, -12, 0] }}
              transition={{ duration: 12, ease: 'easeInOut' }}
              className="drop-shadow-[0_0_14px_rgba(63,216,255,0.4)]"
            >
              <Rocket className="w-full" />
            </motion.div>
          </motion.div>

          {/* distance progress */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-neon to-mint transition-[width] duration-150" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 font-mono text-[10px] tracking-wider text-slate-400">
              Distance traveled {Math.round(pct)}%{arrived ? ' · Lunar approach' : ''}
            </p>
          </div>
        </div>

        {/* Mission status */}
        <Panel title="Mission Status" icon="📡" className="self-start">
          <div className="space-y-4">
            <Meter label="Engine Thrust" value={thrust} tone="amber" />
            <Meter label="Guidance System" value={100} tone="cyan" />
            <Meter
              label="Propellant Plan"
              value={propellantPlan}
              tone={propellantPlan >= 100 ? 'green' : 'amber'}
            />
          </div>
          <dl className="mt-4 space-y-1.5 text-[13px]">
            {[
              ['Initial mass', `${fmt(plan.initialMass)} kg`],
              ['Final mass', `${fmt(plan.finalMass)} kg`],
              ['Mass ratio', `${plan.massRatio.toFixed(2)} : 1`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/5 pb-1.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="font-mono font-bold text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex justify-center">
            <span className="rounded-full border border-ambr/50 bg-ambr/10 px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-ambr">
              ⛽ PROPELLANT BURNS → ROCKET MASS DECREASES
            </span>
          </p>
          <button
            type="button"
            disabled={!canArrive}
            onClick={arrive}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-400 to-mint px-5 py-3 font-display text-sm font-extrabold tracking-wide text-[#032018] transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_30px_rgba(65,232,165,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Moon className="size-4" strokeWidth={2.5} /> Arrive at Moon
          </button>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Simplified transit visualization — real missions follow orbital mechanics, with
            correction burns and days of coasting.
          </p>
        </Panel>
      </div>
    </div>
  );
}
