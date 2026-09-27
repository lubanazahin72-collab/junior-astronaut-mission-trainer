'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { POWER_EVENT } from '@/lib/events';
import { POWER_SIM, TICK_MS } from '@/lib/constants';
import { useMission } from '@/lib/store';
import { clamp, mulberry32 } from '@/lib/utils';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import Banner from '@/components/ui/Banner';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import HudBar from '@/components/HudBar';
import LogConsole, { useLog } from '@/components/LogConsole';

export default function PowerEventScreen() {
  const selected = useMission((s) => s.selectedEquipment);
  const resolvePower = useMission((s) => s.resolvePower);
  const go = useMission((s) => s.go);

  const carriedSolar = selected.includes('solar-panel');
  const carriedBattery = selected.includes('battery');
  const missing = POWER_EVENT.requiredEquipment.filter((r) => !selected.includes(r.id));
  const P = POWER_SIM;

  const [systems, setSystems] = useState(() => POWER_EVENT.systems.map((s) => ({ ...s, on: true })));
  const systemsRef = useRef(systems);
  const [mode, setMode] = useState('normal');
  const modeRef = useRef('normal');

  const simRef = useRef({
    clock: 0, dust: 0, power: 100, battery: 100,
    offTicks: 0, lowTicks: 0, depletedTicks: 0, capTicks: 0, holdTicks: 0,
    done: false, criticalsEverOff: false, hintedDrain: false, hintedReserve: false,
  });
  const [ui, setUi] = useState({
    solar: 100, power: 100, battery: 100, dust: 0, demand: 56, supply: 108, lifeWarning: false, holdPct: 0,
  });
  const [resolved, setResolved] = useState(null); // { outcome, reason }
  const resolvedRef = useRef(null);

  const [lines, pushLog] = useLog([
    ['T+0.0s · Habitat online. Solar output nominal. Dust advisory in effect.', 'good'],
  ]);

  // deterministic dust motes (SSR-safe)
  const motes = useMemo(() => {
    const rand = mulberry32(11);
    return Array.from({ length: 12 }, (_, i) => ({
      top: 8 + i * 7,
      d: 5 + rand() * 6,
      delay: rand() * 8,
    }));
  }, []);

  const demandOf = () => systemsRef.current.filter((s) => s.on).reduce((sum, s) => sum + s.load, 0);

  function toggleSystem(id) {
    if (simRef.current.done) return;
    const next = systemsRef.current.map((s) => (s.id === id ? { ...s, on: !s.on } : s));
    systemsRef.current = next;
    setSystems(next);
    const sys = next.find((s) => s.id === id);
    if (sys.critical && !sys.on) {
      pushLog(`T+${simRef.current.clock.toFixed(1)}s · ⚠ ${sys.name} POWERED DOWN — this is a life-support system!`, 'bad');
    } else {
      pushLog(
        `T+${simRef.current.clock.toFixed(1)}s · ${sys.name} → ${sys.on ? 'ON' : 'OFF'} · demand now ${demandOf()} units.`,
        sys.on ? '' : 'good'
      );
    }
  }

  function setBatteryMode(next) {
    if (simRef.current.done) return;
    modeRef.current = next;
    setMode(next);
    pushLog(
      `T+${simRef.current.clock.toFixed(1)}s · Battery mode → ${next === 'reserve' ? 'EMERGENCY RESERVE' : 'NORMAL'}.`,
      next === 'reserve' ? 'good' : 'warn'
    );
  }

  function finish(outcome, reason = null) {
    const sim = simRef.current;
    if (sim.done) return;
    sim.done = true;
    resolvedRef.current = { outcome, reason };
    resolvePower({
      outcome,
      reason,
      criticalsEverOff: sim.criticalsEverOff,
      failureText: outcome === 'stable' ? null : POWER_EVENT.reasonNotes[reason],
    });
    setResolved({ outcome, reason });
    if (outcome === 'stable') {
      pushLog(`T+${sim.clock.toFixed(1)}s · Power grid stabilized at ${Math.round(sim.power)}%. Habitat stable.`, 'good');
      pushLog(`T+${sim.clock.toFixed(1)}s · Panel output recovering — some dust remains on the array.`, '');
    } else {
      pushLog(`T+${sim.clock.toFixed(1)}s · ${POWER_EVENT.reasonNotes[reason] || 'Event ended for review.'}`, 'bad');
    }
  }

  useEffect(() => {
    if (missing.length) {
      pushLog(
        `T+0.0s · Capability check failed: ${missing.map((m) => m.label).join(' + ')} not loaded on Earth.`,
        'bad'
      );
    }
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tick() {
    const sim = simRef.current;
    if (sim.done) return;
    sim.clock += TICK_MS / 1000;

    if (sim.dust < P.DUST_MAX) sim.dust = Math.min(P.DUST_MAX, sim.dust + P.DUST_RATE_PER_TICK);

    const solar = carriedSolar ? 100 - sim.dust : P.NO_PANEL_SOLAR;
    const demand = demandOf();
    const overload = Math.max(0, demand - P.CRITICAL_BASELINE);
    const boost = carriedBattery && sim.battery > P.MIN_BOOST_BATTERY
      ? (modeRef.current === 'reserve' ? P.RESERVE_BOOST : P.NORMAL_BOOST)
      : 0;
    const target = solar + boost - overload * P.OVERLOAD_PENALTY;
    sim.power = Math.max(0, sim.power + (target - sim.power) * P.GRID_EASE);

    if (carriedBattery) {
      const drain = (P.DRAIN_BASE + overload * P.DRAIN_PER_OVERLOAD)
        * (modeRef.current === 'reserve' ? P.RESERVE_DRAIN_FACTOR : P.NORMAL_DRAIN_FACTOR);
      sim.battery = Math.max(0, sim.battery - drain);
    }

    const criticalsOn =
      systemsRef.current.find((s) => s.id === 'oxygen').on &&
      systemsRef.current.find((s) => s.id === 'recycler').on;
    sim.criticalsEverOff = sim.criticalsEverOff || !criticalsOn;

    let lifeWarning = false;
    if (!criticalsOn) {
      sim.offTicks++;
      lifeWarning = true;
      if (sim.offTicks >= P.CRITICALS_OFF_LIMIT_TICKS) return finish('compromised', 'criticals-off');
    } else {
      sim.offTicks = 0;
    }

    if (sim.power < 12) {
      if (++sim.lowTicks >= P.LOW_POWER_LIMIT_TICKS) return finish('compromised', 'power-collapse');
    } else sim.lowTicks = 0;

    if (carriedBattery && sim.battery <= 0 && demand > P.CRITICAL_BASELINE) {
      if (++sim.depletedTicks >= P.DEPLETED_LIMIT_TICKS) return finish('compromised', 'battery-depleted');
    } else sim.depletedTicks = 0;

    if (missing.length && ++sim.capTicks >= P.CAPABILITY_LIMIT_TICKS) {
      return finish('compromised', 'capability-missing');
    }
    if (sim.clock >= P.MAX_EVENT_SEC) return finish('compromised', 'timeout');

    const nonCriticalsOff = systemsRef.current.filter((s) => !s.critical).every((s) => !s.on);
    if (!sim.hintedDrain && carriedBattery && sim.battery < 85 && overload > 0) {
      sim.hintedDrain = true;
      pushLog('GUIDANCE · Battery drain is high — non-critical loads are drawing stored energy.', 'warn');
    }
    if (
      !sim.hintedReserve && carriedBattery && nonCriticalsOff && criticalsOn &&
      modeRef.current === 'normal' && sim.power < P.STABLE_THRESHOLD
    ) {
      sim.hintedReserve = true;
      pushLog('GUIDANCE · Grid is below the stable range — consider switching the battery to Emergency Reserve Mode.', 'warn');
    }

    let holdPct = 0;
    if (
      carriedSolar && carriedBattery && criticalsOn && nonCriticalsOff &&
      modeRef.current === 'reserve' && sim.power >= P.STABLE_THRESHOLD
    ) {
      sim.holdTicks++;
      holdPct = clamp((sim.holdTicks / P.STABLE_HOLD_TICKS) * 100, 0, 100);
      if (sim.holdTicks >= P.STABLE_HOLD_TICKS) {
        sim.dust = P.DUST_AFTER_SUCCESS; // panel sheds loose dust — some remains
        return finish('stable');
      }
    } else {
      sim.holdTicks = 0;
    }

    setUi({
      solar, power: sim.power, battery: sim.battery, dust: sim.dust,
      demand, supply: Math.round(solar + boost), lifeWarning, holdPct,
    });
  }

  // auto-advance after the outcome animation
  useEffect(() => {
    if (!resolved) return undefined;
    const t = setTimeout(() => go('powerDebrief'), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const stable = resolved?.outcome === 'stable';
  const gridTone = ui.power >= P.STABLE_THRESHOLD ? 'green' : ui.power >= 35 ? 'amber' : 'red';
  const solarTone = ui.solar >= 70 ? 'green' : ui.solar >= 45 ? 'amber' : 'red';
  const alarm =
    ui.power < 35 ? ['alarm-red', '⚠ GRID CRITICAL']
    : ui.power < P.STABLE_THRESHOLD ? ['alarm-amber', '⚠ GRID BELOW STABLE RANGE']
    : ['alarm-green', '✓ GRID NOMINAL'];

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={3} />

      <HudBar className="mb-4" />

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-coral/40 bg-coral/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
            Moon Event 1 · {POWER_EVENT.code}
          </span>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">{POWER_EVENT.title}</h1>
          <p className="mt-2.5 leading-relaxed text-slate-400">{POWER_EVENT.scenario}</p>
        </div>
        <span
          role="status"
          className={`rounded-full border px-4 py-2 font-mono text-xs font-bold tracking-wider ${
            alarm[0] === 'alarm-red' ? 'alarm-red' : alarm[0] === 'alarm-amber' ? 'alarm-amber' : 'alarm-green'
          }`}
        >
          {alarm[1]}
        </span>
      </header>

      {missing.length > 0 && (
        <Banner tone="bad" icon="⛔" title="Required recovery capability unavailable" className="mb-4">
          Not carried from Earth: {missing.map((m) => m.label).join(' + ')}. This capability is
          unavailable for the rest of the event.
        </Banner>
      )}

      <AnimatePresence>
        {ui.lifeWarning && !stable && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <Banner tone="bad" icon="🫁" title="LIFE-SUPPORT WARNING">
              Oxygen Life Support and Water Recycling are critical systems. Turning them off
              threatens the crew — switch them back on immediately.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* Solar array scene */}
        <Panel title="Habitat Exterior — Solar Array" icon="🔭">
          <div
            className={`relative h-72 overflow-hidden rounded-xl border border-white/10 ${carriedSolar ? '' : 'solar-scene-absent'}`}
            style={{
              background:
                'radial-gradient(500px 260px at 18% 0%, rgba(255,214,120,.18), transparent 55%), linear-gradient(180deg, #0a1226, #060a18)',
            }}
          >
            {/* sun */}
            <div className="absolute left-6 top-6 size-12 rounded-full bg-[radial-gradient(circle,#fff6d8,#ffc255_55%,rgba(255,194,85,0)_75%)] shadow-[0_0_40px_rgba(255,194,85,0.5)]" />
            {/* panel */}
            <div className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 md:w-72">
              <div className={stable ? 'solar-panel bright' : 'solar-panel'}>
                {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
              </div>
              <div
                aria-hidden
                className="dust-overlay"
                style={{ opacity: stable ? 0.15 + P.DUST_AFTER_SUCCESS / 100 : clamp(0.15 + ui.dust / 100, 0, 0.92) }}
              />
              {!carriedSolar && (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="rotate-[-6deg] rounded-lg border-2 border-coral/70 bg-black/70 px-4 py-2 font-mono text-xs font-bold tracking-[0.2em] text-coral">
                    NO PANEL DEPLOYED
                  </span>
                </div>
              )}
            </div>
            {/* drifting dust motes */}
            <div aria-hidden className="absolute inset-0">
              {motes.map((m, i) => (
                <span
                  key={i}
                  className="mote"
                  style={{
                    left: '85%',
                    top: `${m.top}%`,
                    '--d': `${m.d.toFixed(1)}s`,
                    animationDelay: `-${m.delay.toFixed(1)}s`,
                  }}
                />
              ))}
            </div>
            {/* outcome stamp */}
            <AnimatePresence>
              {resolved && (
                <motion.div
                  initial={{ opacity: 0, scale: 2.2, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="absolute inset-0 grid place-items-center"
                >
                  <span
                    className={`rounded-xl border-[3px] px-5 py-2.5 font-display text-lg font-black tracking-[0.18em] md:text-2xl ${
                      stable
                        ? 'border-mint bg-[rgba(4,20,14,0.65)] text-mint shadow-[0_0_40px_rgba(65,232,165,0.4)]'
                        : 'border-coral bg-[rgba(28,6,14,0.65)] text-coral shadow-[0_0_40px_rgba(255,92,122,0.4)]'
                    }`}
                  >
                    {stable
                      ? 'HABITAT STABLE'
                      : POWER_EVENT.reasonStamps[resolved?.reason] || 'MISSION REVIEW'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Lunar dust is settling across the array. Watch the dust overlay and the solar output
            meter respond.
          </p>
        </Panel>

        {/* Power management console */}
        <Panel title="Power Management Console" icon="🎛️">
          <div className="grid gap-4 sm:grid-cols-2">
            <Meter
              label="Solar output"
              value={stable ? 100 - P.DUST_AFTER_SUCCESS : ui.solar}
              tone={stable ? 'green' : solarTone}
              sub={stable ? `Dust coverage ${P.DUST_AFTER_SUCCESS}% — partial clearing` : `Dust coverage ${Math.round(ui.dust)}%`}
            />
            <Meter
              label="Habitat power grid"
              value={ui.power}
              tone={stable ? 'green' : gridTone}
              sub={stable ? 'Habitat stabilized' : `Demand ${ui.demand} units · stable target ≥ ${P.STABLE_THRESHOLD}%`}
            />
          </div>

          {carriedBattery ? (
            <div className="mt-4">
              <Meter
                label="Battery reserve"
                value={ui.battery}
                tone={ui.battery > 50 ? 'cyan' : ui.battery > 20 ? 'amber' : 'red'}
                sub={`Mode: ${mode === 'reserve' ? 'Emergency Reserve' : 'Normal'}`}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-coral/40 bg-coral/10 px-3.5 py-2.5 text-xs text-coral">
              ✕ Battery: <b>Not carried</b> — no stored energy available
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Battery mode">
            <button
              type="button"
              disabled={!carriedBattery}
              onClick={() => setBatteryMode('normal')}
              aria-pressed={mode === 'normal'}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'normal'
                  ? 'border-azur bg-azur/20 text-slate-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25'
              }`}
            >
              Normal Mode
            </button>
            <button
              type="button"
              disabled={!carriedBattery}
              onClick={() => setBatteryMode('reserve')}
              aria-pressed={mode === 'reserve'}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'reserve'
                  ? 'border-ambr bg-ambr/20 text-ambr'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25'
              }`}
            >
              ⚡ Emergency Reserve
            </button>
          </div>

          <p className="mt-3 font-mono text-[11px] text-slate-400">
            Demand {ui.demand} units · supply {stable ? Math.round(100 - P.DUST_AFTER_SUCCESS + P.RESERVE_BOOST) : ui.supply} units
          </p>

          <div className="mt-3 space-y-2">
            {systems.map((sys) => (
              <ToggleSwitch
                key={sys.id}
                sys={sys}
                on={sys.on}
                onToggle={() => toggleSystem(sys.id)}
                className={
                  !sys.critical && sys.on && !stable && ui.power < 45 ? 'flicker' : ''
                }
              />
            ))}
          </div>

          {ui.holdPct > 0 && !resolved && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-mint">
                Stabilizing habitat power…
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-mint transition-[width] duration-200" style={{ width: `${ui.holdPct}%` }} />
              </div>
            </div>
          )}

          <LogConsole lines={lines} className="mt-4" />
        </Panel>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          hidden={!resolved}
          onClick={() => go('powerDebrief')}
          className="rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-8 py-3.5 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          📋 Open Mission Debrief
        </button>
      </div>
    </div>
  );
}
