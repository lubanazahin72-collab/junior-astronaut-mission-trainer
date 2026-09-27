'use client';

import { useMemo, useRef, useState } from 'react';
import { Rocket } from 'lucide-react';
import { FUEL_MIN_KG, FUEL_MAX_KG, FUEL_STEP_KG, ROCKET_DRY_MASS_KG, SAFETY_RESERVE_FRACTION } from '@/lib/constants';
import { EQUIPMENT_BY_ID, massOf } from '@/lib/equipment';
import { computeLaunchPlan } from '@/lib/physics';
import { fmt } from '@/lib/utils';
import { useMission } from '@/lib/store';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Banner from '@/components/ui/Banner';
import { Chip } from '@/components/ui/Chips';
import EngineTest from '@/components/EngineTest';

function KvRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-mono text-[13px] font-bold text-slate-100">{children}</dd>
    </div>
  );
}

/** Rocket on the pad — payload section, propellant tank, engine, flame, fuel truck. */
function PadRocket({ fillPct, shaking }) {
  const tankY = 150 - 84 * (fillPct / 100);
  const tankH = 84 * (fillPct / 100);
  return (
    <div
      aria-label="Rocket on the launch pad, propellant tank filling"
      className={`relative flex h-64 items-end justify-center overflow-hidden rounded-xl border border-white/10 ${shaking ? 'rocket-shake' : ''}`}
      style={{
        background:
          'radial-gradient(420px 200px at 50% 0%, rgba(63,216,255,.12), transparent 60%), linear-gradient(180deg, #0a1226, #060a18)',
      }}
    >
      {/* pad surface */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,#101c38,#0a1226)]" />
      <div aria-hidden className="absolute bottom-10 h-px w-full bg-neon/20" />

      <svg viewBox="0 0 150 260" className="relative z-10 h-[92%]" aria-hidden>
        <defs>
          <linearGradient id="padBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d7e3ff" />
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#9fb6e8" />
          </linearGradient>
          <linearGradient id="padFuel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc255" />
            <stop offset="1" stopColor="#ff7a2e" />
          </linearGradient>
          <clipPath id="padTank"><rect x="52" y="66" width="46" height="84" rx="8" /></clipPath>
        </defs>

        {/* payload section */}
        <path d="M75 8 C91 26 96 42 97 62 L53 62 C54 42 59 26 75 8 Z" fill="url(#padBody)" stroke="#5b74b8" strokeWidth="2" />
        <circle cx="75" cy="40" r="8" fill="#0f2a5e" stroke="#8fd8ff" strokeWidth="2.5" />
        <rect x="53" y="62" width="44" height="6" fill="#33477f" />

        {/* propellant tank — fills orange as fuel is loaded */}
        <rect x="52" y="66" width="46" height="84" rx="8" fill="#0b1c3a" stroke="#33477f" strokeWidth="2" />
        <g clipPath="url(#padTank)">
          <rect
            x="52"
            y={tankY}
            width="46"
            height={tankH}
            fill="url(#padFuel)"
            style={{ transition: 'y 0.15s ease-out, height 0.15s ease-out' }}
          />
        </g>
        <rect x="52" y="148" width="46" height="6" fill="#33477f" />

        {/* fins + engine section */}
        <path d="M52 158 L34 210 L52 200 Z" fill="#ff5c7a" />
        <path d="M98 158 L116 210 L98 200 Z" fill="#ff5c7a" />
        <rect x="52" y="152" width="46" height="18" rx="4" fill="#33477f" />
        <path className="rocket-flame" d="M63 172 C68 196 82 196 87 172 C82 182 68 182 63 172 Z" fill="#ff9c3f" opacity="0.9" />

        {/* hold-down clamps */}
        <rect x="30" y="168" width="24" height="5" rx="2" fill="#22345c" />
        <rect x="96" y="168" width="24" height="5" rx="2" fill="#22345c" />
      </svg>

      {/* fuel truck + pump */}
      <div aria-hidden className="absolute bottom-2 left-3 flex items-end gap-1.5">
        <svg viewBox="0 0 64 34" className="h-7 w-14" aria-hidden>
          <rect x="2" y="10" width="34" height="14" rx="4" fill="#3c537f" stroke="#22345c" />
          <rect x="38" y="4" width="16" height="20" rx="4" fill="#46608f" stroke="#22345c" />
          <circle cx="14" cy="26" r="6" fill="#0f2a5e" stroke="#8fd8ff" strokeWidth="2" />
          <circle cx="46" cy="26" r="6" fill="#0f2a5e" stroke="#8fd8ff" strokeWidth="2" />
          <rect x="20" y="14" width="18" height="4" rx="2" fill="#ffc255" />
        </svg>
        <span className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.16em] text-slate-400">
          FUEL TRUCK
        </span>
      </div>

      <span className="absolute right-3 top-3 rounded-full border border-ambr/40 bg-black/50 px-2.5 py-1 font-mono text-[10px] font-bold text-ambr">
        ⛽ {Math.round(fillPct)}% LOADED
      </span>
    </div>
  );
}

export default function PlannerScreen() {
  const selected = useMission((s) => s.selectedEquipment);
  const fuelMass = useMission((s) => s.fuelMass);
  const setFuel = useMission((s) => s.setFuel);
  const confirmLaunch = useMission((s) => s.confirmLaunch);

  const payload = massOf(selected);
  const plan = useMemo(() => computeLaunchPlan(payload, fuelMass), [payload, fuelMass]);
  const fillPct = ((fuelMass - FUEL_MIN_KG) / (FUEL_MAX_KG - FUEL_MIN_KG)) * 100;
  const tankPct = ((fuelMass - FUEL_MIN_KG) / (FUEL_MAX_KG - FUEL_MIN_KG)) * 100;

  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef(null);
  function handleFuel(kg) {
    setFuel(kg);
    setShaking(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShaking(false), 260);
  }

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={1} />
      <header className="mb-6 max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-neon">
          Phase 2 · Launch Planning
        </span>
        <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">Fuel &amp; Delta-v Planner</h1>
        <p className="mt-2.5 leading-relaxed text-slate-400">
          Set the propellant load for your habitat launch. Burning propellant makes the rocket
          lighter, and the ratio between initial and final mass decides how much velocity the engine
          can deliver.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Propellant load */}
        <Panel title="Propellant Load" icon="🚀">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fuel selected
            </span>
            <output className="font-mono text-3xl font-black text-ambr">{fuelMass} kg</output>
          </div>
          <input
            type="range"
            className="fuel-slider mt-4"
            id="fuel-slider"
            min={FUEL_MIN_KG}
            max={FUEL_MAX_KG}
            step={FUEL_STEP_KG}
            value={fuelMass}
            style={{ '--fill': `${fillPct}%` }}
            aria-label="Propellant mass in kilograms"
            aria-valuetext={`${fuelMass} kilograms`}
            onChange={(e) => handleFuel(Number(e.target.value))}
          />
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
            <span>{FUEL_MIN_KG} kg</span>
            <span>{FUEL_MAX_KG} kg</span>
          </div>

          {/* Launch mass composition */}
          <div
            aria-hidden
            className="mt-5 flex h-4 overflow-hidden rounded-full border border-white/10 bg-black/40"
          >
            <span className="bg-gradient-to-r from-lav to-[#7c5cd6] transition-all duration-300" style={{ width: `${(plan.payloadMass / plan.initialMass) * 100}%` }} />
            <span className="bg-gradient-to-r from-azur to-[#3a5fd0] transition-all duration-300" style={{ width: `${(plan.dryMass / plan.initialMass) * 100}%` }} />
            <span className="bg-gradient-to-r from-[#ffc255] to-[#ff7a2e] transition-all duration-300" style={{ width: `${(plan.fuelMass / plan.initialMass) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-lav" />Payload <b className="font-mono text-slate-200">{fmt(plan.payloadMass)} kg</b></span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-azur" />Dry rocket <b className="font-mono text-slate-200">{ROCKET_DRY_MASS_KG} kg</b></span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#ff9c3f]" />Propellant <b className="font-mono text-slate-200">{fmt(plan.fuelMass)} kg</b></span>
          </div>

          <h4 className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            <span aria-hidden>📦</span> Carried payload
          </h4>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {selected.length ? (
              selected.map((id) => (
                <Chip key={id}>
                  <span aria-hidden>{EQUIPMENT_BY_ID[id].icon}</span> {EQUIPMENT_BY_ID[id].name} ·{' '}
                  {EQUIPMENT_BY_ID[id].weight} kg
                </Chip>
              ))
            ) : (
              <Chip empty>No systems selected — payload 0 kg</Chip>
            )}
          </div>
        </Panel>

        {/* Flight computer */}
        <Panel title="Flight Computer" icon="🖥️">
          <dl>
            <KvRow label="Payload mass">{fmt(plan.payloadMass)} kg</KvRow>
            <KvRow label="Rocket dry mass">{ROCKET_DRY_MASS_KG} kg</KvRow>
            <KvRow label="Propellant selected">{fmt(plan.fuelMass)} kg</KvRow>
            <KvRow label="Initial launch mass">{fmt(plan.initialMass)} kg</KvRow>
            <KvRow label="Final mass after burn">{fmt(plan.finalMass)} kg</KvRow>
            <KvRow label="Achievable delta-v">{fmt(plan.achievableDeltaV)} m/s</KvRow>
            <KvRow label={`Safe mission target (${Math.round(SAFETY_RESERVE_FRACTION * 100)}% reserve)`}>
              {fmt(plan.requiredDeltaV)} m/s
            </KvRow>
            <KvRow label="Delta-v margin">
              <span className={plan.safe ? 'text-mint' : 'text-coral'}>
                {plan.safe
                  ? `+${fmt(plan.margin)} m/s reserve`
                  : `−${fmt(Math.abs(plan.margin))} m/s shortfall`}
              </span>
            </KvRow>
            <KvRow label="Mass ratio (initial / final)">{plan.massRatio.toFixed(2)} : 1</KvRow>
          </dl>

          <div className="mt-4">
            {plan.safe ? (
              <Banner tone="good" icon="✅" title="MISSION PLAN APPROVED">
                Trajectory achievable within the safety reserve. Delta-v margin +
                {fmt(plan.margin)} m/s. Launch enabled.
              </Banner>
            ) : (
              <Banner tone="bad" icon="🚫" title="LAUNCH PLAN UNSAFE">
                Achievable delta-v {fmt(plan.achievableDeltaV)} m/s is below the safe target{' '}
                {fmt(plan.requiredDeltaV)} m/s. Add propellant or reduce payload.
              </Banner>
            )}
          </div>

          <button
            type="button"
            disabled={!plan.safe}
            onClick={() => confirmLaunch(plan)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-neon via-azur to-lav px-5 py-3.5 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50"
          >
            <Rocket className="size-4" strokeWidth={2.5} /> Begin Launch Sequence
          </button>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            This is a simplified educational model. Real mission trajectories require much more
            detailed engineering.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Engineering note: a safe plan needs most of the launch mass to be propellant — real
            rockets fly with roughly 85–90% propellant at liftoff.
          </p>
        </Panel>

        {/* Rocket on pad */}
        <Panel title="Launch Pad — Fuel Loading" icon="🛰️">
          <PadRocket fillPct={tankPct} shaking={shaking} />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Move the fuel slider — the fuel truck pumps propellant, the orange tank fills, and the
            rocket settles on its clamps.
          </p>
        </Panel>

        {/* Engine test micro-simulation */}
        <Panel title="Rocket Science — Test Engine" icon="🔥">
          <EngineTest />
        </Panel>
      </div>
    </div>
  );
}
