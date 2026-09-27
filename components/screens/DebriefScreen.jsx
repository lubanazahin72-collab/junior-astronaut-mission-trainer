'use client';

import { POWER_EVENT, WATER_EVENT, RADIATION_EVENT, THERMAL_EVENT } from '@/lib/events';
import { FACTS } from '@/lib/facts';
import { useMission } from '@/lib/store';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Banner from '@/components/ui/Banner';
import FactCard from '@/components/ui/FactCard';
import { CapChip } from '@/components/ui/Chips';
import HudBar from '@/components/HudBar';
import { ArrowRight, RotateCcw } from 'lucide-react';

const DEBRIEFS = {
  power: {
    cfg: POWER_EVENT,
    pick: (s) => s.powerEvent,
    success: 'stable',
    fact: FACTS.dust,
    next: 'water',
    nextLabel: '🌙 Proceed to Moon Event 2 — Water Leak',
    capRow: (carried) => (
      <>
        <CapChip label="Solar Panel" carried={carried('solar-panel')} />
        <CapChip label="Battery" carried={carried('battery')} />
      </>
    ),
  },
  water: {
    cfg: WATER_EVENT,
    pick: (s) => s.waterEvent,
    success: 'restored',
    fact: FACTS.water,
    next: 'radiation',
    nextLabel: '☀️ Proceed to Moon Event 3 — Radiation Alert',
    capRow: (carried) => (
      <>
        <CapChip label="Water Recycling System" carried={carried('water-recycler')} />
        <CapChip label="Repair Kit + Spare Seal" carried={carried('repair-kit')} />
      </>
    ),
  },
  radiation: {
    cfg: RADIATION_EVENT,
    pick: (s) => s.radiationEvent,
    success: 'shielded',
    fact: FACTS.radiation,
    next: 'thermal',
    nextLabel: '🌡️ Proceed to Moon Event 4 — Thermal Control',
    capRow: (carried) => <CapChip label="Radiation Shield (optional)" carried={carried('radiation-shield')} />,
  },
  thermal: {
    cfg: THERMAL_EVENT,
    pick: (s) => s.thermalEvent,
    success: 'stable',
    fact: FACTS.thermal,
    next: 'report',
    nextLabel: '📋 Final Mission Report',
    capRow: () => <CapChip label="Suit thermal control (from prep bay)" carried />,
  },
};

export default function DebriefScreen({ eventKey }) {
  const go = useMission((s) => s.go);
  const selected = useMission((s) => s.selectedEquipment);
  const restart = useMission((s) => s.restart);
  const mission = useMission((s) => s.mission);
  const result = useMission(DEBRIEFS[eventKey].pick);

  const { cfg, success, fact, next, nextLabel, capRow } = DEBRIEFS[eventKey];
  const ok = result.outcome === success;
  const d = cfg.debrief[ok ? success : 'compromised'];
  const reasonNote = !ok && result.reason ? cfg.reasonNotes[result.reason] : null;
  const carried = (id) => selected.includes(id);

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={3} />

      <HudBar className="mb-4" />

      <header className="mb-5">
        <span className="inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-neon">
          Mission Debrief · {cfg.code}
        </span>
        <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">
          {cfg.title} — Debrief
        </h1>
      </header>

      <div
        role="status"
        className={`mb-5 rounded-2xl border p-5 ${
          ok ? 'border-mint/40 bg-mint/10' : 'border-coral/40 bg-coral/10'
        }`}
      >
        <small className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
          Mission Status
        </small>
        <strong className={`mt-1 block font-display text-2xl font-extrabold ${ok ? 'text-mint' : 'text-coral'}`}>
          {ok ? '✓' : '⚠'} {ok ? d.status : 'MISSION FAILED'}
        </strong>
        <p className="mt-1.5 text-sm text-slate-300">
          {ok ? d.headline : 'The crew is safe — mission control has secured the situation and ended this mission attempt. Review the notes and try again.'}
        </p>
      </div>

      {reasonNote && (
        <Banner tone="info" icon="🛠️" title="Mission-control review notes" className="mb-5">
          {reasonNote}
        </Banner>
      )}

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <Panel title="System Response" icon="📡">
          <p className="text-sm leading-relaxed text-slate-300">{d.systemResponse}</p>
          <div className="mt-3 flex flex-wrap gap-2">{capRow(carried)}</div>
        </Panel>
        <Panel title="What Happened" icon="🌋">
          <p className="text-sm leading-relaxed text-slate-300">{d.whatHappened}</p>
        </Panel>
        <Panel title="Why It Matters" icon="🌍">
          <p className="text-sm leading-relaxed text-slate-300">{d.whyItMatters}</p>
        </Panel>
        <Panel title="Recommended Procedure" icon="🧭">
          <ol className="space-y-2">
            {cfg.procedure.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-neon/15 font-mono text-[10px] font-bold text-neon">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="mb-5">
        <FactCard fact={fact} />
      </div>

      <Panel title="Learning Reinforcement" icon="🔗" className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {cfg.diagram.map((step, i, arr) => {
            const isNode = typeof step === 'object';
            return (
              <span key={i} className="flex items-center gap-3">
                <span className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3">
                  {isNode ? (
                    <>
                      <span aria-hidden className="text-2xl">{step.icon}</span>
                      <b className="mt-1 text-sm text-slate-100">{step.name}</b>
                      <small className="text-[11px] text-slate-400">{step.role}</small>
                    </>
                  ) : (
                    <b className="text-sm font-bold text-slate-100">{step}</b>
                  )}
                </span>
                {i < arr.length - 1 && <span aria-hidden className="text-xl text-neon">→</span>}
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{cfg.diagramNote}</p>
      </Panel>

      <div className="mb-8 rounded-2xl border border-lav/30 bg-lav/10 p-5">
        <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-lav">
          🎓 Learning Outcome
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{d.learningOutcome}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {ok ? (
          <button
            type="button"
            onClick={() => go(next)}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-8 py-4 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
          >
            {nextLabel}
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-mint px-8 py-4 font-display text-sm font-extrabold tracking-wide text-[#032018] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(65,232,165,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              <RotateCcw className="size-4" strokeWidth={2.5} /> Restart Mission
            </button>
            <button
              type="button"
              onClick={() => go('report')}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-8 py-4 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
            >
              📋 Mission Report <ArrowRight className="size-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => go('intro')}
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-bold text-slate-300 transition-all hover:border-neon/40 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
            >
              Back to Intro
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function PowerDebriefScreen() {
  return <DebriefScreen eventKey="power" />;
}
export function WaterDebriefScreen() {
  return <DebriefScreen eventKey="water" />;
}
export function RadiationDebriefScreen() {
  return <DebriefScreen eventKey="radiation" />;
}
export function ThermalDebriefScreen() {
  return <DebriefScreen eventKey="thermal" />;
}
