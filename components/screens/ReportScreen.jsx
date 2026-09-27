'use client';

import { RotateCcw, Home } from 'lucide-react';
import { EQUIPMENT_BY_ID, massOf } from '@/lib/equipment';
import { computeLaunchPlan } from '@/lib/physics';
import { fmt } from '@/lib/utils';
import { DISCLAIMER, SOURCE_CREDITS } from '@/lib/facts';
import { prepComplete, prepCount, PREP_ITEMS } from '@/lib/astronaut';
import { useMission } from '@/lib/store';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import AstronautAvatar from '@/components/AstronautAvatar';
import { Chip } from '@/components/ui/Chips';

const LEARNING_OUTCOMES = [
  'Burning propellant makes a rocket lighter — and lower mass changes what the engine can do',
  'Fuel and payload must balance: the mass ratio decides achievable delta-v',
  'Lunar dust can cut solar output — critical systems come first, comfort loads get shed',
  'A water leak must be isolated before it can be repaired — adding water never stops a leak',
  'With no thick atmosphere, radiation alerts mean shelter — stopping work is step one',
  'Lunar sunlight and shadow swing extreme temperatures — location then cooling keeps a suit stable',
];

export default function ReportScreen() {
  const astronaut = useMission((s) => s.astronaut);
  const selected = useMission((s) => s.selectedEquipment);
  const fuelMass = useMission((s) => s.fuelMass);
  const launch = useMission((s) => s.launch);
  const mission = useMission((s) => s.mission);
  const powerEvent = useMission((s) => s.powerEvent);
  const waterEvent = useMission((s) => s.waterEvent);
  const radiationEvent = useMission((s) => s.radiationEvent);
  const thermalEvent = useMission((s) => s.thermalEvent);
  const restart = useMission((s) => s.restart);
  const go = useMission((s) => s.go);

  const plan = computeLaunchPlan(massOf(selected), fuelMass);
  const prepOK = prepComplete(astronaut.prep);
  const launchOK = launch.approved;
  const powerOK = powerEvent.outcome === 'stable';
  const waterOK = waterEvent.outcome === 'restored';
  const radiationOK = radiationEvent.outcome === 'shielded';
  const thermalOK = thermalEvent.outcome === 'stable';
  const perfect = mission.score === 100 && prepOK && launchOK && powerOK && waterOK && radiationOK && thermalOK;

  const areas = [
    {
      icon: '🧑‍🚀',
      title: 'Astronaut Preparation',
      ok: prepOK,
      good: 'All Five Checks Complete',
      bad: `Incomplete — ${prepCount(astronaut.prep)}/${PREP_ITEMS.length} checks`,
      detail: prepOK
        ? `${PREP_ITEMS.map((p) => p.badge).join(' · ')}`
        : 'Suit, helmet, oxygen, comms, and medical checks gate launch readiness.',
    },
    {
      icon: '🚀',
      title: 'Rocket Fuel Plan',
      ok: launchOK,
      good: 'Mission Plan Approved',
      bad: 'Review Fuel and Payload Balance',
      detail: `${fmt(fuelMass)} kg propellant · ${fmt(plan.achievableDeltaV)} m/s achievable Δv vs ${fmt(plan.requiredDeltaV)} m/s required (with 5% reserve)`,
    },
    {
      icon: '⚡',
      title: 'Dust / Power Response',
      ok: powerOK,
      good: 'Habitat Stable',
      bad: 'Review Power Strategy',
      detail: powerOK
        ? 'Non-critical loads shed, Emergency Reserve Mode active, grid recovered to ~62%.'
        : 'The dust/power emergency ended in review — see the Moon Event 1 debrief notes.',
    },
    {
      icon: '💧',
      title: 'Water Leak Response',
      ok: waterOK,
      good: 'Water System Restored',
      bad: 'Review Leak Procedure',
      detail: waterOK
        ? 'Damaged line isolated before repair; spare seal stopped the leak at the source.'
        : 'The water emergency ended in review — see the Moon Event 2 debrief notes.',
    },
    {
      icon: '☢️',
      title: 'Radiation Alert Response',
      ok: radiationOK,
      good: 'Crew Shielded',
      bad: 'Review Shelter Procedure',
      detail: radiationOK
        ? 'EVA stopped, crew reached the shielded shelter, monitor confirmed the recovery.'
        : 'The radiation alert ended in review — see the Moon Event 3 debrief notes.',
    },
    {
      icon: '🌡️',
      title: 'Thermal Control Response',
      ok: thermalOK,
      good: 'Suit Temperature Stable',
      bad: 'Review Thermal Procedure',
      detail: thermalOK
        ? 'Moved out of direct sunlight, cooling increased, temperature settled near 26°C.'
        : 'The thermal emergency ended in review — see the Moon Event 4 debrief notes.',
    },
  ];

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={4} />

      {/* Header + verdict */}
      <header className="mb-6 text-center">
        <span className="inline-flex items-center rounded-full border border-mint/40 bg-mint/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-mint">
          Mission Complete
        </span>
        <h1 className="mt-3.5 font-display text-4xl font-black md:text-5xl">
          <span className="bg-gradient-to-r from-slate-100 via-sky-200 to-neon bg-clip-text text-transparent">
            MOON MISSION REPORT
          </span>
        </h1>

        <div className="mt-6 flex flex-col items-center gap-3">
          <AstronautAvatar avatarId={astronaut.avatarId} size="xl" glow={perfect} />
          <b className="font-display text-xl text-slate-100">{astronaut.name}</b>
        </div>

        <div
          className={`mx-auto mt-5 max-w-xl rounded-2xl border p-5 ${
            perfect ? 'border-mint/50 bg-mint/10' : 'border-coral/50 bg-coral/10'
          }`}
          role="status"
        >
          <small className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
            Final Score
          </small>
          <p className={`font-mono text-4xl font-black ${perfect ? 'text-mint' : 'text-coral'}`}>
            {mission.score} / 100
          </p>
          <strong className={`mt-2 block font-display text-2xl font-extrabold ${perfect ? 'text-mint' : 'text-coral'}`}>
            {perfect ? '🏆 MOON MISSION SUCCESSFUL' : '⚠ MISSION FAILED'}
          </strong>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            {perfect
              ? 'You protected the crew, managed limited resources, and completed the simplified Moon survival mission.'
              : mission.failureReason ||
                'Review the emergency log, improve your preparation, and try again.'}
          </p>
        </div>
      </header>

      {/* Status cards */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => (
          <section
            key={a.title}
            className={`rounded-2xl border p-5 ${a.ok ? 'border-mint/40 bg-mint/[0.07]' : 'border-coral/40 bg-coral/[0.07]'}`}
          >
            <span aria-hidden className="text-3xl">{a.icon}</span>
            <h3 className="mt-2 font-display text-sm font-extrabold uppercase tracking-[0.14em] text-slate-300">
              {a.title}
            </h3>
            <strong className={`mt-1.5 block text-base font-bold ${a.ok ? 'text-mint' : 'text-coral'}`}>
              {a.ok ? '✓ ' : '⚠ '}
              {a.ok ? a.good : a.bad}
            </strong>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{a.detail}</p>
          </section>
        ))}
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <Panel title="Mission Configuration" icon="🧾">
          <div className="flex flex-wrap gap-2">
            {selected.length ? (
              selected.map((id) => (
                <Chip key={id}>
                  <span aria-hidden>{EQUIPMENT_BY_ID[id].icon}</span> {EQUIPMENT_BY_ID[id].name}
                </Chip>
              ))
            ) : (
              <Chip empty>No systems carried</Chip>
            )}
          </div>
          <dl className="mt-4 space-y-1.5 text-[13px]">
            {[
              ['Cargo mass', `${massOf(selected)} of 75 kg`],
              ['Propellant selected', `${fmt(fuelMass)} kg`],
              ['Mass ratio', `${plan.massRatio.toFixed(2)} : 1`],
              ['Moon days survived', `${mission.day}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/5 pb-1.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="font-mono font-bold text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Learning Outcomes" icon="🎓">
          <ul className="space-y-2">
            {LEARNING_OUTCOMES.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-200">
                <span aria-hidden className="mt-0.5 text-neon">✦</span>
                {c}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="NASA Source Credits" icon="📚" className="mb-6">
        <ul className="grid gap-2 md:grid-cols-2">
          {SOURCE_CREDITS.map((s) => (
            <li key={s.url} className="text-[13px]">
              <a
                className="text-neon underline decoration-neon/40 underline-offset-2 transition-colors hover:text-sky-300"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </Panel>

      <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-ambr/90">
        🛈 {DISCLAIMER}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-9 py-4 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          <RotateCcw className="size-4" strokeWidth={2.5} /> Restart Mission
        </button>
        <button
          type="button"
          onClick={() => go('intro')}
          className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-slate-300 transition-all hover:border-neon/40 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          <Home className="size-4" strokeWidth={2.5} /> Back to Intro
        </button>
      </div>
    </div>
  );
}
