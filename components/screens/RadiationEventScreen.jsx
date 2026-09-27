'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RADIATION_EVENT } from '@/lib/events';
import { RADIATION_SIM, TICK_MS } from '@/lib/constants';
import { useMission } from '@/lib/store';
import { clamp, mulberry32 } from '@/lib/utils';
import { avatarOf } from '@/lib/astronaut';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import Banner from '@/components/ui/Banner';
import { CapChip } from '@/components/ui/Chips';
import HudBar from '@/components/HudBar';
import LogConsole, { useLog } from '@/components/LogConsole';

export default function RadiationEventScreen() {
  const selected = useMission((s) => s.selectedEquipment);
  const astronaut = useMission((s) => s.astronaut);
  const resolveRadiation = useMission((s) => s.resolveRadiation);
  const go = useMission((s) => s.go);

  const shieldCarried = selected.includes('radiation-shield');
  const R = RADIATION_SIM;
  const avatarEmoji = avatarOf(astronaut.avatarId).emoji;

  const [acts, setActs] = useState({
    stopped: false, returned: false, inside: false, monitor: false,
  });
  const actsRef = useRef(acts);
  const setAct = (key, value) => {
    actsRef.current = { ...actsRef.current, [key]: value };
    setActs(actsRef.current);
  };

  const simRef = useRef({
    clock: 0, level: R.START_LEVEL, hold: 0, workCount: 0,
    flareTimer: 8, flareOn: false, done: false,
  });
  const [ui, setUi] = useState({ level: R.START_LEVEL, flare: false });
  const [resolved, setResolved] = useState(null);

  const [lines, pushLog] = useLog([
    ['T+0.0s · Solar activity rising — radiation advisory issued for the EVA zone.', 'warn'],
  ]);

  // deterministic particles (SSR-safe)
  const motes = useMemo(() => {
    const rand = mulberry32(23);
    return Array.from({ length: 14 }, (_, i) => ({
      top: 6 + i * 6.5,
      d: 3.5 + rand() * 4,
      delay: rand() * 7,
    }));
  }, []);

  // ---- actions ----------------------------------------------------
  function stopEva() {
    if (simRef.current.done || actsRef.current.stopped) return;
    setAct('stopped', true);
    pushLog(`T+${simRef.current.clock.toFixed(1)}s · EVA stopped — tools secured, crew prepares to leave the surface.`, 'good');
  }

  function returnToHabitat() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.returned) return;
    if (!actsRef.current.stopped) {
      pushLog(`T+${sim.clock.toFixed(1)}s · Stop the EVA before leaving the work zone.`, 'warn');
      return;
    }
    setAct('returned', true);
    pushLog(`T+${sim.clock.toFixed(1)}s · Crew returning to the habitat — exposure clock is still running.`, 'good');
  }

  function enterShelter() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.inside) return;
    if (!actsRef.current.returned) {
      pushLog(`T+${sim.clock.toFixed(1)}s · Return to the habitat first — the shelter is inside.`, 'warn');
      return;
    }
    setAct('inside', true);
    pushLog(`T+${sim.clock.toFixed(1)}s · Crew inside the shielded shelter — dose stops building.${shieldCarried ? ' Radiation Shield cargo reinforces the shelter.' : ''}`, 'good');
  }

  function activateMonitor() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.monitor) return;
    if (!actsRef.current.inside) {
      pushLog(`T+${sim.clock.toFixed(1)}s · Enter the shielded shelter first — the monitor tracks recovery inside.`, 'warn');
      return;
    }
    setAct('monitor', true);
    pushLog(`T+${sim.clock.toFixed(1)}s · Radiation monitor active — shelter shielding is shedding the dose.`, 'good');
  }

  function continueWork() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.inside) return;
    sim.workCount++;
    pushLog(
      `T+${sim.clock.toFixed(1)}s · Surface work continues — radiation keeps climbing (${sim.workCount === 1 ? 'shelter is the safe location' : 'dose still building'}).`,
      sim.workCount >= 2 ? 'bad' : 'warn'
    );
  }

  // ---- simulation ---------------------------------------------------
  function finish(outcome, reason = null) {
    const sim = simRef.current;
    if (sim.done) return;
    sim.done = true;
    resolveRadiation({ outcome, reason, shieldCarried });
    setResolved({ outcome, reason });
    if (outcome === 'shielded') {
      pushLog(`T+${sim.clock.toFixed(1)}s · Radiation level back to ${Math.round(sim.level)}% — crew shielded.`, 'good');
    } else {
      pushLog(`T+${sim.clock.toFixed(1)}s · ${RADIATION_EVENT.reasonNotes[reason] || 'Event ended for review.'}`, 'bad');
    }
  }

  useEffect(() => {
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tick() {
    const sim = simRef.current;
    if (sim.done) return;
    const dt = TICK_MS / 1000;
    const a = actsRef.current;
    sim.clock += dt;

    // solar flare bursts come in waves
    sim.flareTimer -= dt;
    if (sim.flareTimer <= 0) {
      sim.flareOn = !sim.flareOn;
      sim.flareTimer = sim.flareOn ? 5 : 9;
      if (sim.flareOn && !a.inside) {
        pushLog('PLASMA BURST · Radiation is climbing faster — get inside shielding.', 'bad');
      }
    }

    if (!a.inside) {
      let rise = R.RISE_PER_SEC;
      if (sim.workCount > 0) rise += R.WORK_RISE_PER_SEC;
      if (sim.flareOn) rise += R.FLARE_RISE_PER_SEC;
      sim.level = Math.min(100, sim.level + rise * dt);
      sim.hold = 0;
    } else {
      let fall = R.FALL_PER_SEC;
      if (shieldCarried) fall = R.FALL_PER_SEC_SHIELD_KIT;
      if (a.monitor) fall += R.MONITOR_FALL_BONUS;
      sim.level = Math.max(R.SAFE_FLOOR, sim.level - fall * dt);

      if (a.monitor && sim.level <= R.SAFE_LEVEL) {
        sim.hold += dt;
        if (sim.hold >= R.STABILIZE_HOLD_SEC) {
          sim.level = R.SAFE_TARGET;
          return finish('shielded');
        }
      } else {
        sim.hold = 0;
      }
    }

    if (sim.level >= R.EXPOSURE_LIMIT) return finish('compromised', 'exposure-risk');
    if (sim.clock >= R.MAX_EVENT_SEC) return finish('compromised', 'timeout');

    setUi({ level: sim.level, flare: sim.flareOn && !a.inside });
  }

  useEffect(() => {
    if (!resolved) return undefined;
    const t = setTimeout(() => go('radiationDebrief'), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const shielded = resolved?.outcome === 'shielded';
  const levelShown = shielded ? R.SAFE_TARGET : ui.level;
  const radTone = levelShown >= 60 ? 'red' : levelShown >= 40 ? 'amber' : 'cyan';
  const alarm = shielded
    ? 'alarm-green'
    : ui.level >= 60 || ui.flare
      ? 'alarm-red'
      : 'alarm-amber';
  const alarmText = shielded
    ? '✓ CREW SHIELDED'
    : ui.flare
      ? '⚠ PLASMA BURST IN PROGRESS'
      : ui.level >= 60
        ? '⚠ RADIATION CRITICAL'
        : '⚠ RADIATION RISING';

  // astronaut position through the sequence
  const astronautSpot = acts.inside
    ? 'left-[62%] top-[58%] opacity-0'
    : acts.returned
      ? 'left-[62%] top-[50%]'
      : 'left-[13%] top-[52%]';

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={3} />

      <HudBar className="mb-4" />

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-coral/40 bg-coral/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
            Moon Event 3 · {RADIATION_EVENT.code}
          </span>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">{RADIATION_EVENT.title}</h1>
          <p className="mt-2.5 leading-relaxed text-slate-400">{RADIATION_EVENT.scenario}</p>
        </div>
        <span role="status" className={`rounded-full border px-4 py-2 font-mono text-xs font-bold tracking-wider ${alarm}`}>
          {alarmText}
        </span>
      </header>

      <AnimatePresence>
        {ui.flare && !acts.inside && !shielded && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Banner tone="bad" icon="☀️" title="SOLAR PLASMA BURST">
              The Moon has no thick atmosphere to absorb this energy. Surface dose is climbing —
              stop work and get the crew into the shielded shelter.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* EVA scene */}
        <Panel title="Lunar Surface — EVA Zone" icon="🌓">
          <div
            className={`relative h-72 overflow-hidden rounded-xl border border-white/10 ${shielded ? 'shelter-safe' : ''}`}
            style={{
              background: ui.flare && !acts.inside
                ? 'radial-gradient(560px 280px at 82% 8%, rgba(255,120,80,.28), transparent 60%), linear-gradient(180deg, #0a1226, #060a18)'
                : 'radial-gradient(560px 280px at 82% 8%, rgba(255,214,120,.16), transparent 60%), linear-gradient(180deg, #0a1226, #060a18)',
            }}
          >
            {/* sun / flare source */}
            <div className={`absolute right-8 top-5 size-14 rounded-full bg-[radial-gradient(circle,#fff6d8,#ffc255_55%,rgba(255,194,85,0)_75%)] shadow-[0_0_40px_rgba(255,194,85,0.5)] ${ui.flare && !acts.inside ? 'flare-active' : ''}`} />

            {/* surface */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,#1a2444,#0d1730)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-16 h-px bg-white/10" />

            {/* habitat with shelter door */}
            <svg viewBox="0 0 360 200" className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="habBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5f76a8" />
                  <stop offset="1" stopColor="#31456e" />
                </linearGradient>
                <radialGradient id="shelterGlow">
                  <stop offset="0" stopColor="rgba(63,216,255,0.55)" />
                  <stop offset="1" stopColor="rgba(63,216,255,0)" />
                </radialGradient>
              </defs>
              {/* habitat dome */}
              <path d="M200 150 a58 58 0 0 1 116 0 Z" fill="url(#habBody)" stroke="#22345c" strokeWidth="2" />
              <rect x="188" y="148" width="140" height="10" rx="4" fill="#22345c" />
              {/* shelter door */}
              <rect x="236" y="106" width="30" height="44" rx="6" fill="#13224a" stroke="#3c537f" strokeWidth="2" />
              <g className={acts.inside ? 'shelter-door on' : 'shelter-door'}>
                <circle cx="251" cy="128" r="7" fill="none" stroke="#8fd8ff" strokeWidth="2.5" />
                <line x1="251" y1="121" x2="251" y2="135" stroke="#8fd8ff" strokeWidth="2" />
              </g>
              {/* shelter glow when shielded */}
              {acts.inside && <circle cx="251" cy="128" r="46" fill="url(#shelterGlow)" className={acts.monitor ? 'shelter-pulse' : ''} />}
              {/* antenna */}
              <line x1="300" y1="96" x2="300" y2="72" stroke="#5f76a8" strokeWidth="3" />
              <circle cx="300" cy="70" r="4" fill={acts.monitor ? '#3fd8ff' : '#33477f'} className={acts.monitor ? 'monitor-beacon' : ''} />
              {/* monitor wave rings */}
              {acts.monitor && (
                <g className="monitor-rings">
                  <circle cx="300" cy="70" r="8" fill="none" stroke="rgba(63,216,255,.8)" strokeWidth="1.5" />
                  <circle cx="300" cy="70" r="14" fill="none" stroke="rgba(63,216,255,.45)" strokeWidth="1.5" />
                </g>
              )}
              {/* rock the EVA started near */}
              <path d="M40 150 l14 -18 16 6 10 -8 12 20 Z" fill="#31456e" stroke="#22345c" />
            </svg>

            {/* astronaut */}
            <div aria-hidden className={`absolute text-4xl transition-all duration-1000 ${astronautSpot}`}>
              <span className="inline-block drop-shadow-[0_0_12px_rgba(63,216,255,0.4)]">
                {acts.inside ? '🚪' : avatarEmoji}
              </span>
            </div>

            {/* radiation wavefront motes */}
            {!acts.inside && !shielded && (
              <div aria-hidden className="absolute inset-0">
                {motes.map((m, i) => (
                  <span
                    key={i}
                    className="rad-mote"
                    style={{
                      left: '88%',
                      top: `${m.top}%`,
                      '--d': `${m.d.toFixed(1)}s`,
                      animationDelay: `-${m.delay.toFixed(1)}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* sequence hint */}
            {!resolved && (
              <span className="absolute bottom-2 left-3 font-mono text-[10px] tracking-[0.14em] text-slate-400">
                {acts.inside
                  ? acts.monitor
                    ? 'MONITOR ACTIVE — SHIELDING SHEDDING DOSE'
                    : 'INSIDE SHELTER — ACTIVATE THE MONITOR'
                  : acts.returned
                    ? 'AT THE HABITAT — ENTER THE SHELTER'
                    : acts.stopped
                      ? 'EVA STOPPED — RETURN TO THE HABITAT'
                      : 'EVA IN PROGRESS — STOP WORK FIRST'}
              </span>
            )}

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
                      shielded
                        ? 'border-mint bg-[rgba(4,20,14,0.65)] text-mint shadow-[0_0_40px_rgba(65,232,165,0.4)]'
                        : 'border-coral bg-[rgba(28,6,14,0.65)] text-coral shadow-[0_0_40px_rgba(255,92,122,0.4)]'
                    }`}
                  >
                    {shielded
                      ? 'CREW SHIELDED'
                      : RADIATION_EVENT.reasonStamps[resolved?.reason] || 'MISSION REVIEW'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <CapChip label="Radiation Shield (reinforces shelter)" carried={shieldCarried} />
          </div>
        </Panel>

        {/* Radiation console */}
        <Panel title="Radiation Alert Console" icon="☢️">
          <div className="grid gap-4 sm:grid-cols-2">
            <Meter
              label="Radiation level"
              value={levelShown}
              tone={shielded ? 'green' : radTone}
              sub={shielded ? 'Back in the safe band' : acts.inside ? 'Sheltered — dose shedding' : `Safe below ${R.SAFE_LEVEL}% · critical at ${R.EXPOSURE_LIMIT}%`}
            />
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shelter status</p>
              <p className={`font-mono text-lg font-black ${acts.inside ? 'text-neon' : 'text-ambr'}`}>
                {acts.inside ? (acts.monitor ? 'SHIELDED + MONITOR' : 'INSIDE — NO MONITOR') : 'EXPOSED'}
              </p>
              <p className="text-[11px] text-slate-400">
                {acts.inside
                  ? shieldCarried
                    ? 'Shield cargo reinforcing the hull'
                    : 'Standard hull shielding'
                  : 'Surface exposure — dose building'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button type="button" onClick={stopEva} disabled={acts.stopped || acts.inside || resolved}
              className={`action-btn ${acts.stopped ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">✋</span>
              <b>Stop EVA</b>
              <small>{acts.stopped ? 'Work stopped ✓' : 'First action — secure the site'}</small>
            </button>

            <button type="button" onClick={returnToHabitat} disabled={acts.returned || acts.inside || resolved}
              className={`action-btn ${acts.returned ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🚶</span>
              <b>Return to Habitat</b>
              <small>{acts.returned ? 'Heading home ✓' : 'Needs Stop EVA first'}</small>
            </button>

            <button type="button" onClick={enterShelter} disabled={acts.inside || resolved}
              className={`action-btn ${acts.inside ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🛡️</span>
              <b>Enter Shielded Shelter</b>
              <small>{acts.inside ? 'Inside ✓' : 'The only protected location'}</small>
            </button>

            <button type="button" onClick={activateMonitor} disabled={acts.monitor || resolved}
              className={`action-btn ${acts.monitor ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">📈</span>
              <b>Activate Radiation Monitor</b>
              <small>{acts.monitor ? 'Tracking recovery ✓' : 'Confirm the dose is falling'}</small>
            </button>

            <button type="button" onClick={continueWork} disabled={acts.inside || resolved}
              className="action-btn action-btn-ghost">
              <span aria-hidden className="text-xl">⛏️</span>
              <b>Continue Surface Work</b>
              <small>Dose keeps building — risky</small>
            </button>
          </div>

          <LogConsole lines={lines} className="mt-4" />
        </Panel>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          hidden={!resolved}
          onClick={() => go('radiationDebrief')}
          className="rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-8 py-3.5 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          📋 Open Mission Debrief
        </button>
      </div>
    </div>
  );
}
