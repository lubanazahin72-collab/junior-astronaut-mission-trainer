'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { EQUIPMENT, EQUIPMENT_BY_ID, massOf } from '@/lib/equipment';
import { CARGO_CAPACITY_KG } from '@/lib/constants';
import { useMission } from '@/lib/store';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import { cn } from '@/lib/utils';

export default function PrepareScreen() {
  const selected = useMission((s) => s.selectedEquipment);
  const toggleEquipment = useMission((s) => s.toggleEquipment);
  const go = useMission((s) => s.go);

  const mass = massOf(selected);
  const free = CARGO_CAPACITY_KG - mass;
  const [warning, setWarning] = useState(null);
  const [shakeId, setShakeId] = useState(null);

  function handleCard(id) {
    const already = selected.includes(id);
    if (!already) {
      const nextMass = mass + EQUIPMENT_BY_ID[id].weight;
      if (nextMass > CARGO_CAPACITY_KG) {
        setWarning(
          `Adding ${EQUIPMENT_BY_ID[id].name} would exceed the ${CARGO_CAPACITY_KG} kg cargo limit (${nextMass} kg). Remove something first.`
        );
        setShakeId(id);
        setTimeout(() => setShakeId(null), 450);
        setTimeout(() => setWarning(null), 3800);
        return;
      }
    }
    setWarning(null);
    toggleEquipment(id);
  }

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={0} />
      <header className="mb-6 max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-neon">
          Phase 1 · Earth
        </span>
        <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">
          Earth Preparation — Cargo Loading
        </h1>
        <p className="mt-2.5 leading-relaxed text-slate-400">
          Choose what the habitat carries to the Moon. Every kilogram counts twice: cargo fills the
          habitat <b className="text-slate-200">and</b> adds launch mass in the planner. Some systems
          unlock emergency capabilities later.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <Panel title="Equipment Bay" icon="🧰" badge={`${selected.length}/${EQUIPMENT.length} selected`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {EQUIPMENT.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleCard(item.id)}
                  animate={shakeId === item.id ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'relative flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon',
                    isSelected
                      ? 'border-neon bg-neon/10 shadow-[0_0_0_1px_var(--color-neon),0_8px_28px_rgba(63,216,255,0.15)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-neon/40 hover:bg-white/[0.06]'
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span aria-hidden className="text-2xl">{item.icon}</span>
                    <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                      {item.weight} kg
                    </span>
                  </span>
                  <span className="text-sm font-bold text-slate-100">{item.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-lav">
                    {item.tag}
                  </span>
                  <span className="text-xs leading-relaxed text-slate-400">{item.purpose}</span>
                  <span className="text-[11px] leading-relaxed text-ambr/80">🔗 {item.learning}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'absolute right-3 top-3 grid size-5 place-items-center rounded-full text-[11px] font-bold transition-all',
                      isSelected ? 'bg-neon text-[#031024]' : 'border border-white/15 text-transparent'
                    )}
                  >
                    ✓
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Cargo Manifest" icon="📦" className="self-start">
          <Meter
            label="Cargo mass"
            value={mass}
            max={CARGO_CAPACITY_KG}
            unit=" kg"
            tone={mass >= 70 ? 'amber' : 'cyan'}
            sub={`${mass} of ${CARGO_CAPACITY_KG} kg · ${free} kg free`}
          />

          {warning && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-coral/50 bg-coral/10 px-3.5 py-2.5 text-xs leading-relaxed text-coral"
            >
              ⚠ {warning}
            </div>
          )}

          <ul className="mt-4 space-y-1.5 text-[13px]">
            {selected.length ? (
              selected.map((id) => (
                <li key={id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                  <span aria-hidden>{EQUIPMENT_BY_ID[id].icon}</span>
                  <span className="flex-1 text-slate-200">{EQUIPMENT_BY_ID[id].name}</span>
                  <b className="font-mono text-xs text-slate-400">{EQUIPMENT_BY_ID[id].weight} kg</b>
                </li>
              ))
            ) : (
              <li className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-slate-400">
                No systems selected yet.
              </li>
            )}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            💡 Systems left behind are unavailable during Moon emergencies.
          </p>

          <button
            type="button"
            onClick={() => go('planner')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-neon via-azur to-lav px-5 py-3 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon active:translate-y-0"
          >
            Continue to Launch Planner <ArrowRight className="size-4" strokeWidth={2.5} />
          </button>
        </Panel>
      </div>
    </div>
  );
}
