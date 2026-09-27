'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WATER_EVENT } from '@/lib/events';
import { WATER_SIM, TICK_MS } from '@/lib/constants';
import { useMission } from '@/lib/store';
import { clamp } from '@/lib/utils';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import Banner from '@/components/ui/Banner';
import { CapChip } from '@/components/ui/Chips';
import HudBar from '@/components/HudBar';
import LogConsole, { useLog } from '@/components/LogConsole';

export default function WaterEventScreen() {
  const selected = useMission((s) => s.selectedEquipment);
  const resolveWater = useMission((s) => s.resolveWater);
  const go = useMission((s) => s.go);

  const carriedRecycler = selected.includes('water-recycler');
  const carriedKit = selected.includes('repair-kit');
  const missing = WATER_EVENT.requiredEquipment.filter((r) => !selected.includes(r.id));
  const W = WATER_SIM;

  // valve / isolation / tank / patch state — React state for UI + ref for the sim loop
  const [acts, setActs] = useState({
    valve: false, isolated: false, backup: false, weakPatch: false, sealed: false,
  });
  const actsRef = useRef(acts);
  const setAct = (key, value) => {
    actsRef.current = { ...actsRef.current, [key]: value };
    setActs(actsRef.current);
  };

  const simRef = useRef({
    clock: 0, reserve: W.START_RESERVE, leaked: 0, hold: 0,
    staleTime: 0, capTime: 0, grace: W.GRACE_SEC, done: false, hintedIsolate: false,
  });
  const ignoredRef = useRef(0);
  const [ui, setUi] = useState({ reserve: W.START_RESERVE, leak: 0, leaked: 0 });
  const [resolved, setResolved] = useState(null); // { outcome, reason }
  const [droplets, setDroplets] = useState([]);
  const dropletId = useRef(0);
  const [partialWarning, setPartialWarning] = useState(false);

  const [lines, pushLog] = useLog([
    ['T+0.0s · Pressure anomaly on the water-recycling line. Seal failure suspected.', 'warn'],
  ]);

  function leakPerSec() {
    const a = actsRef.current;
    let leak = W.BASE_LEAK_PER_SEC;
    if (!carriedRecycler) leak *= W.NO_RECYCLER_FACTOR;
    if (a.isolated) leak *= W.ISOLATE_FACTOR;
    else if (a.valve) leak *= W.VALVE_FACTOR;
    if (a.weakPatch && !a.sealed) leak *= W.WEAK_PATCH_FACTOR;
    return simRef.current.grace > 0 ? 0 : leak;
  }

  // water droplet animation
  useEffect(() => {
    const interval = setInterval(() => {
      const sim = simRef.current;
      if (sim.done || actsRef.current.sealed || leakPerSec() <= 0) return;
      const id = ++dropletId.current;
      setDroplets((prev) => [...prev.slice(-24), { id, x: Math.random() * 12 }]);
      setTimeout(() => setDroplets((prev) => prev.filter((d) => d.id !== id)), 920);
    }, 160);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- actions --------------------------------------------------
  function closeValve() {
    if (simRef.current.done || actsRef.current.isolated) return;
    const next = !actsRef.current.valve;
    setAct('valve', next);
    pushLog(
      `T+${simRef.current.clock.toFixed(1)}s · Main valve ${next ? 'CLOSED — flow to the damaged line reduced' : 'OPEN'}.`,
      next ? 'good' : ''
    );
  }

  function isolateLine() {
    if (simRef.current.done || actsRef.current.isolated) return;
    setAct('isolated', true);
    pushLog(`T+${simRef.current.clock.toFixed(1)}s · Damaged line isolated — pressure removed from the crack.`, 'good');
    if (actsRef.current.weakPatch) {
      pushLog(`T+${simRef.current.clock.toFixed(1)}s · The earlier patch can now be reinforced — use the Repair Kit.`, 'warn');
    }
  }

  function toggleBackup() {
    if (simRef.current.done) return;
    const next = !actsRef.current.backup;
    setAct('backup', next);
    pushLog(
      `T+${simRef.current.clock.toFixed(1)}s · Backup tank ${next ? 'OPEN — the shared reserve now drains faster. The leak is unaffected.' : 'CLOSED'}.`,
      next ? 'bad' : ''
    );
  }

  function useKit() {
    const sim = simRef.current;
    if (sim.done || !carriedKit || actsRef.current.sealed) return;
    if (actsRef.current.isolated) {
      setAct('sealed', true);
      pushLog(`T+${sim.clock.toFixed(1)}s · Spare seal applied to the isolated line — leak stopped at the source.`, 'good');
    } else {
      setAct('weakPatch', true);
      resolveWater({ repairedEarly: true });
      setPartialWarning(true);
      pushLog(`T+${sim.clock.toFixed(1)}s · Patch applied under pressure — it slows the leak but cannot hold. Isolate the line.`, 'warn');
    }
  }

  function ignoreAlert() {
    if (simRef.current.done) return;
    ignoredRef.current++;
    resolveWater({ ignoredAlerts: ignoredRef.current });
    pushLog(
      `T+${simRef.current.clock.toFixed(1)}s · Alert acknowledged — no action taken. Reserve keeps falling.`,
      ignoredRef.current >= 3 ? 'bad' : 'warn'
    );
  }

  // ---- simulation -------------------------------------------------
  function finish(outcome, reason = null) {
    const sim = simRef.current;
    if (sim.done) return;
    sim.done = true;
    resolveWater({
      outcome,
      reason,
      failureText: outcome === 'restored' ? null : WATER_EVENT.reasonNotes[reason],
    });
    setResolved({ outcome, reason });
    if (outcome === 'restored') {
      pushLog(`T+${sim.clock.toFixed(1)}s · Reserve stable at ${Math.round(sim.reserve + W.RESCUE_RECOVER)}%. Water system restored.`, 'good');
    } else {
      pushLog(`T+${sim.clock.toFixed(1)}s · ${WATER_EVENT.reasonNotes[reason] || 'Event ended for review.'}`, 'bad');
    }
  }

  function tick() {
    const sim = simRef.current;
    if (sim.done) return;
    const dt = TICK_MS / 1000;
    sim.clock += dt;
    if (sim.grace > 0) sim.grace -= dt;

    const leak = leakPerSec();
    const drain = leak + (actsRef.current.backup ? W.BACKUP_TANK_DRAIN_PER_SEC : 0);
    sim.reserve = Math.max(0, sim.reserve - drain * dt);
    sim.leaked += drain * dt;

    if (actsRef.current.sealed) {
      sim.hold += dt;
      if (sim.hold >= W.STABILIZE_HOLD_SEC) {
        return finish('restored');
      }
    } else {
      if (sim.reserve <= W.CRITICAL_RESERVE) return finish('compromised', 'reserve-critical');
      if (actsRef.current.isolated && !carriedKit) {
        sim.staleTime += dt;
        if (sim.staleTime >= W.STALE_ISOLATED_SEC) return finish('compromised', 'stale-isolated');
      }
      if (missing.length) {
        sim.capTime += dt;
        if (sim.capTime >= W.CAPABILITY_LIMIT_SEC) return finish('compromised', 'capability-missing');
      }
      if (sim.clock >= W.MAX_EVENT_SEC) return finish('compromised', 'timeout');
      if (!sim.hintedIsolate && sim.clock > 12 && !actsRef.current.isolated && !actsRef.current.valve) {
        sim.hintedIsolate = true;
        pushLog('GUIDANCE · The leak continues — consider isolating the damaged line.', 'warn');
      }
    }

    setUi({ reserve: sim.reserve, leak, leaked: sim.leaked });
  }

  useEffect(() => {
    if (!resolved) return undefined;
    const t = setTimeout(() => go('waterDebrief'), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const restored = resolved?.outcome === 'restored';
  const leak = restored ? 0 : ui.leak;
  const reserveShown = restored ? ui.reserve + W.RESCUE_RECOVER : ui.reserve;
  const waterTone = reserveShown > 50 ? 'cyan' : reserveShown > W.CRITICAL_RESERVE ? 'amber' : 'red';

  const kitLabel = acts.sealed
    ? 'Seal applied ✓'
    : acts.isolated && acts.weakPatch
      ? 'Reinforce patch with spare seal'
      : acts.weakPatch
        ? 'Weak patch — isolate the line first'
        : carriedKit
          ? 'Spare seal inside'
          : 'Not in cargo';

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={3} />

      <HudBar className="mb-4" />

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-coral/40 bg-coral/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
            Moon Event 2 · {WATER_EVENT.code}
          </span>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">{WATER_EVENT.title}</h1>
          <p className="mt-2.5 leading-relaxed text-slate-400">{WATER_EVENT.scenario}</p>
        </div>
        <span role="status" className={restored ? 'alarm-green rounded-full border px-4 py-2 font-mono text-xs font-bold tracking-wider' : 'alarm-red rounded-full border px-4 py-2 font-mono text-xs font-bold tracking-wider'}>
          {restored ? '✓ LINE SEALED' : ui.reserve < 30 ? '⚠ RESERVE CRITICAL' : '⚠ LEAK DETECTED'}
        </span>
      </header>

      {missing.length > 0 && (
        <Banner tone="bad" icon="⛔" title="Required water-management capability unavailable" className="mb-4">
          Not carried from Earth: {missing.map((m) => m.label).join(' + ')}. The habitat lacks
          systems it needs to manage this failure.
        </Banner>
      )}

      <AnimatePresence>
        {partialWarning && !acts.isolated && !restored && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Banner tone="warn" icon="⚠️" title="PARTIAL REPAIR">
              The patch was applied against line pressure, so it only partly holds. Isolate the
              damaged line first, then reinforce the seal.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* Pipe scene */}
        <Panel title="Habitat Interior — Recycling Line" icon="🚰">
          <div
            className="relative h-64 overflow-hidden rounded-xl border border-white/10 sm:h-72"
            style={{ background: 'linear-gradient(180deg, #131f3d, #0a1226)' }}
          >
            <span aria-hidden className={`absolute right-5 top-4 size-4 rounded-full ${restored ? 'bg-mint shadow-[0_0_14px_#41e8a5]' : 'alarm-red bg-coral shadow-[0_0_14px_#ff5c7a]'}`} />
            <span aria-hidden className="absolute right-12 top-4 font-mono text-[10px] tracking-[0.2em] text-slate-400">
              {restored ? 'OK' : 'LEAK'}
            </span>

            <svg viewBox="0 0 360 210" className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#9fb4d8" />
                  <stop offset="0.5" stopColor="#5f76a8" />
                  <stop offset="1" stopColor="#31456e" />
                </linearGradient>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#7fd8ff" />
                  <stop offset="1" stopColor="#1f7dd9" />
                </linearGradient>
              </defs>
              <g opacity="0.22" stroke="#3350a0" strokeWidth="1">
                <line x1="0" y1="40" x2="360" y2="40" />
                <line x1="0" y1="172" x2="360" y2="172" />
                <line x1="56" y1="0" x2="56" y2="210" />
                <line x1="304" y1="0" x2="304" y2="210" />
              </g>
              <rect x="24" y="86" width="312" height="30" rx="8" fill="url(#pipeGrad)" stroke="#22345c" strokeWidth="1.5" />
              <rect x="26" y="94" width="308" height="6" rx="3" fill="url(#waterGrad)" opacity="0.85" />
              <rect x="62" y="80" width="14" height="42" rx="3" fill="#46608f" />
              <rect x="238" y="80" width="14" height="42" rx="3" fill="#46608f" />
              {/* isolation valve */}
              <g transform="translate(130,86)">
                <rect x="-7" y="-8" width="14" height="46" rx="3" fill="#3c537f" />
                <g className={acts.valve || acts.isolated ? 'valve-wheel closed' : 'valve-wheel'}>
                  <circle cx="0" cy="-18" r="13" fill="none" stroke="#ffc255" strokeWidth="4" />
                  <line x1="-13" y1="-18" x2="13" y2="-18" stroke="#ffc255" strokeWidth="3" />
                  <line x1="0" y1="-31" x2="0" y2="-5" stroke="#ffc255" strokeWidth="3" />
                </g>
              </g>
              {/* crack */}
              <path d="M243 86 l6 8 -5 7 6 8 -4 7" fill="none" stroke="#0c1530" strokeWidth="3" strokeLinecap="round" />
              {/* spare-seal patch */}
              <g className={acts.sealed ? 'pipe-patch show' : 'pipe-patch'}>
                <rect x="226" y="79" width="36" height="44" rx="6" fill="#ffb84d" stroke="#8a5a00" strokeWidth="2" />
                <line x1="233" y1="86" x2="255" y2="116" stroke="#8a5a00" strokeWidth="2" />
                <line x1="255" y1="86" x2="233" y2="116" stroke="#8a5a00" strokeWidth="2" />
              </g>
              {/* backup tank */}
              <g transform="translate(322,52)">
                <rect x="-18" y="0" width="36" height="46" rx="6" fill="#3c537f" stroke="#22345c" strokeWidth="1.5" />
                <rect x="-12" y="6" width="24" height="12" rx="3" fill="#7fd8ff" opacity={acts.backup ? 0.95 : 0.45} />
                <line x1="-18" y1="28" x2="18" y2="28" stroke="#22345c" strokeWidth="2" />
              </g>
            </svg>

            {/* droplets fall from the crack (crack at ~67% width) */}
            <div aria-hidden className="absolute left-[64%] top-[52%] h-px w-px">
              {droplets.map((d) => (
                <span key={d.id} className="drop" style={{ left: d.x }} />
              ))}
            </div>
            <i
              aria-hidden
              className="absolute bottom-6 left-[60%] h-2 rounded-full bg-sky-400/50 transition-all"
              style={{ width: `${clamp(8 + ui.leaked * 2.2, 8, 120)}px`, opacity: acts.sealed ? 0.35 : 0.6 }}
            />

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
                      restored
                        ? 'border-mint bg-[rgba(4,20,14,0.65)] text-mint shadow-[0_0_40px_rgba(65,232,165,0.4)]'
                        : 'border-coral bg-[rgba(28,6,14,0.65)] text-coral shadow-[0_0_40px_rgba(255,92,122,0.4)]'
                    }`}
                  >
                    {restored
                      ? 'WATER SYSTEM RESTORED'
                      : WATER_EVENT.reasonStamps[resolved?.reason] || 'MISSION REVIEW'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <CapChip label="Water Recycling System" carried={carriedRecycler} />
            <CapChip label="Repair Kit + Spare Seal" carried={carriedKit} />
          </div>
        </Panel>

        {/* Emergency console */}
        <Panel title="Water System Emergency Console" icon="🛠️">
          <div className="grid gap-4 sm:grid-cols-2">
            <Meter
              label="Water reserve"
              value={reserveShown}
              tone={restored ? 'green' : waterTone}
              sub={acts.sealed ? 'Stable — line sealed' : `Critical below ${W.CRITICAL_RESERVE}%`}
            />
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Leak rate</p>
              <p className={`font-mono text-xl font-black ${acts.sealed ? 'text-mint' : leak > 0.4 ? 'text-coral' : 'text-ambr'}`}>
                {leak.toFixed(2)} %/s
              </p>
              <p className="text-[11px] text-slate-400">
                {acts.sealed
                  ? 'SEALED ✓'
                  : acts.isolated
                    ? 'ISOLATED — residual drip'
                    : acts.valve
                      ? 'VALVE CLOSED — slowed'
                      : 'SEAL FAILED'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button type="button" onClick={closeValve} disabled={acts.isolated || acts.sealed || restored}
              aria-pressed={acts.valve}
              className={`action-btn ${acts.valve ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🚰</span>
              <b>Close Main Valve</b>
              <small>{acts.isolated ? 'Line already isolated' : acts.valve ? 'Valve CLOSED — leak slowed' : 'Optional safety step'}</small>
            </button>

            <button type="button" onClick={isolateLine} disabled={acts.isolated || acts.sealed || restored}
              className={`action-btn ${acts.isolated ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🚧</span>
              <b>Isolate Damaged Line</b>
              <small>{acts.isolated ? 'Line ISOLATED ✓' : 'Stops flow to the crack'}</small>
            </button>

            <button type="button" onClick={toggleBackup} disabled={restored}
              aria-pressed={acts.backup}
              className={`action-btn ${acts.backup ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🛢️</span>
              <b>Open Backup Tank</b>
              <small>Extra supply — shared reserve</small>
            </button>

            <button type="button" onClick={useKit} disabled={!carriedKit || acts.sealed || restored}
              className="action-btn">
              <span aria-hidden className="text-xl">🧰</span>
              <b>Use Repair Kit</b>
              <small>{kitLabel}</small>
            </button>

            <button type="button" onClick={ignoreAlert} disabled={restored} className="action-btn action-btn-ghost">
              <span aria-hidden className="text-xl">🙈</span>
              <b>Ignore Alert</b>
              <small>Log only — leak continues</small>
            </button>
          </div>

          <LogConsole lines={lines} className="mt-4" />
        </Panel>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          hidden={!resolved}
          onClick={() => go('waterDebrief')}
          className="rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-8 py-3.5 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          📋 Open Mission Debrief
        </button>
      </div>
    </div>
  );
}
