'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { THERMAL_EVENT } from '@/lib/events';
import { THERMAL_SIM, TICK_MS } from '@/lib/constants';
import { avatarOf } from '@/lib/astronaut';
import { useMission } from '@/lib/store';
import StepsRail from '@/components/ui/StepsRail';
import Panel from '@/components/ui/Panel';
import Meter from '@/components/ui/Meter';
import Banner from '@/components/ui/Banner';
import HudBar from '@/components/HudBar';
import LogConsole, { useLog } from '@/components/LogConsole';

export default function ThermalEventScreen() {
  const astronaut = useMission((s) => s.astronaut);
  const resolveThermal = useMission((s) => s.resolveThermal);
  const go = useMission((s) => s.go);

  const T = THERMAL_SIM;
  const avatarEmoji = avatarOf(astronaut.avatarId).emoji;

  const [acts, setActs] = useState({
    location: 'sun', // 'sun' | 'shade' | 'habitat'
    cooling: 'normal', // 'normal' | 'increased' | 'reduced'
  });
  const actsRef = useRef(acts);
  const setAct = (patch) => {
    actsRef.current = { ...actsRef.current, ...patch };
    setActs(actsRef.current);
  };

  const simRef = useRef({ clock: 0, temp: T.START_TEMP, hold: 0, done: false, hinted: false });
  const [ui, setUi] = useState({ temp: T.START_TEMP });
  const [resolved, setResolved] = useState(null);

  const [lines, pushLog] = useLog([
    ['T+0.0s · Suit thermal advisory — surface temperature in direct sunlight is extreme.', 'warn'],
  ]);

  const locationLabel = { sun: 'Direct sunlight', shade: 'Shade', habitat: 'Inside habitat' };

  // ---- actions ----------------------------------------------------
  function increaseCooling() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.cooling === 'increased') return;
    setAct({ cooling: 'increased' });
    if (actsRef.current.location === 'sun') {
      pushLog(`T+${sim.clock.toFixed(1)}s · Suit cooling increased — but direct sunlight keeps adding heat faster than the cooler can shed.`, 'warn');
    } else {
      pushLog(`T+${sim.clock.toFixed(1)}s · Suit cooling increased — thermal-control system pulling the temperature down.`, 'good');
    }
  }

  function reduceCooling() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.cooling === 'reduced') return;
    setAct({ cooling: 'reduced' });
    pushLog(`T+${sim.clock.toFixed(1)}s · ⚠ Suit cooling reduced — heat soak will now build faster.`, 'bad');
  }

  function moveToShade() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.location === 'shade') return;
    setAct({ location: 'shade' });
    pushLog(`T+${sim.clock.toFixed(1)}s · Astronaut moved to shade — direct solar heating cut sharply.`, 'good');
  }

  function returnToHabitat() {
    const sim = simRef.current;
    if (sim.done || actsRef.current.location === 'habitat') return;
    setAct({ location: 'habitat' });
    pushLog(`T+${sim.clock.toFixed(1)}s · Astronaut back inside the habitat — out of the Sun entirely.`, 'good');
  }

  function ignoreWarning() {
    const sim = simRef.current;
    if (sim.done) return;
    pushLog(`T+${sim.clock.toFixed(1)}s · Thermal warning acknowledged — no action taken. Temperature keeps climbing.`, 'bad');
  }

  // ---- simulation ---------------------------------------------------
  function finish(outcome, reason = null) {
    const sim = simRef.current;
    if (sim.done) return;
    sim.done = true;
    resolveThermal({ outcome, reason });
    setResolved({ outcome, reason });
    if (outcome === 'stable') {
      pushLog(`T+${sim.clock.toFixed(1)}s · Suit temperature settled at ${sim.temp.toFixed(1)}°C — thermal control stable.`, 'good');
    } else {
      pushLog(`T+${sim.clock.toFixed(1)}s · ${THERMAL_EVENT.reasonNotes[reason] || 'Event ended for review.'}`, 'bad');
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

    // heat load by location
    let rate =
      a.location === 'sun' ? T.SUN_RISE_PER_SEC
        : a.location === 'shade' ? T.SHADE_RISE_PER_SEC
          : T.HABITAT_RISE_PER_SEC;

    // cooling by location (a cooler fights hardest out of the Sun)
    if (a.cooling === 'increased') {
      rate -= a.location === 'sun' ? T.COOLING_IN_SUN_PER_SEC
        : a.location === 'shade' ? T.COOLING_IN_SHADE_PER_SEC
          : T.COOLING_IN_HABITAT_PER_SEC;
    } else if (a.cooling === 'reduced') {
      rate += T.REDUCE_BONUS_PER_SEC;
    }

    sim.temp = Math.max(T.SETTLE_TEMP, sim.temp + rate * dt);

    const safeZone = a.location !== 'sun';
    if (safeZone && a.cooling === 'increased' && sim.temp <= T.STABLE_BAND) {
      sim.hold += dt;
      if (sim.hold >= T.STABILIZE_HOLD_SEC) {
        sim.temp = T.SETTLE_TEMP;
        return finish('stable');
      }
    } else {
      sim.hold = 0;
    }

    if (!sim.hinted && sim.clock > 10 && a.location === 'sun') {
      sim.hinted = true;
      pushLog('GUIDANCE · In direct sunlight the cooler cannot win — move to shade or return to the habitat.', 'warn');
    }

    if (sim.temp >= T.CRITICAL_TEMP) return finish('compromised', 'thermal-critical');
    if (sim.clock >= T.MAX_EVENT_SEC) return finish('compromised', 'timeout');

    setUi({ temp: sim.temp });
  }

  useEffect(() => {
    if (!resolved) return undefined;
    const t = setTimeout(() => go('thermalDebrief'), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const stable = resolved?.outcome === 'stable';
  const tempShown = stable ? T.SETTLE_TEMP : ui.temp;
  const tempTone = tempShown >= 36 ? 'red' : tempShown >= 30 ? 'amber' : 'green';
  const alarm = stable ? 'alarm-green' : tempShown >= 36 ? 'alarm-red' : 'alarm-amber';
  const alarmText = stable
    ? '✓ SUIT TEMPERATURE STABLE'
    : tempShown >= 36
      ? '⚠ THERMAL CRITICAL'
      : tempShown >= 30
        ? '⚠ SUIT HEATING UP'
        : 'TEMPERATURE ELEVATED';

  const astroSpot =
    acts.location === 'habitat'
      ? 'left-[74%] top-[46%]'
      : acts.location === 'shade'
        ? 'left-[52%] top-[52%]'
        : 'left-[10%] top-[48%]';

  return (
    <div className="screen mx-auto max-w-6xl px-4 pb-24 pt-7">
      <StepsRail active={3} />

      <HudBar className="mb-4" />

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-coral/40 bg-coral/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
            Moon Event 4 · {THERMAL_EVENT.code}
          </span>
          <h1 className="mt-3.5 font-display text-3xl font-extrabold md:text-4xl">{THERMAL_EVENT.title}</h1>
          <p className="mt-2.5 leading-relaxed text-slate-400">{THERMAL_EVENT.scenario}</p>
        </div>
        <span role="status" className={`rounded-full border px-4 py-2 font-mono text-xs font-bold tracking-wider ${alarm}`}>
          {alarmText}
        </span>
      </header>

      <AnimatePresence>
        {!stable && acts.cooling === 'reduced' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Banner tone="bad" icon="🌡️" title="COOLING REDUCED">
              Reducing suit cooling while the suit absorbs heat lets the trend run toward the
              thermal redline. Restore cooling and get out of direct sunlight.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* Surface scene */}
        <Panel title="Lunar Surface — Work Site" icon="☀️">
          <div
            className={`relative h-72 overflow-hidden rounded-xl border border-white/10 ${acts.location === 'sun' && !stable ? 'heat-shimmer' : ''}`}
            style={{
              background:
                'radial-gradient(600px 300px at 12% 0%, rgba(255,214,120,.28), transparent 55%), linear-gradient(180deg, #0a1226, #060a18)',
            }}
          >
            {/* blazing sun */}
            <div className={`absolute left-6 top-5 size-14 rounded-full bg-[radial-gradient(circle,#fff6d8,#ffc255_55%,rgba(255,194,85,0)_75%)] shadow-[0_0_46px_rgba(255,194,85,0.55)] ${acts.location === 'sun' ? 'flare-active' : ''}`} />

            {/* sun rays */}
            <div aria-hidden className="sun-rays left-4 top-3" />

            {/* surface */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,#241f33,#120f22)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-16 h-px bg-white/10" />

            <svg viewBox="0 0 360 200" className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="rockBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4a5578" />
                  <stop offset="1" stopColor="#2a3352" />
                </linearGradient>
                <linearGradient id="shadeZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(63,216,255,0.22)" />
                  <stop offset="1" stopColor="rgba(63,216,255,0.04)" />
                </linearGradient>
              </defs>
              {/* shade zone cast by the rock */}
              <path d="M158 168 L214 96 L262 96 L318 168 Z" fill="url(#shadeZone)" className={acts.location === 'shade' ? 'shade-zone on' : 'shade-zone'} />
              {/* boulder casting it */}
              <path d="M204 96 l16 -26 22 4 16 22 -6 10 -44 2 Z" fill="url(#rockBody)" stroke="#1c2440" strokeWidth="2" />
              {/* habitat module */}
              <rect x="272" y="112" width="66" height="42" rx="8" fill="#3c537f" stroke="#22345c" strokeWidth="2" />
              <rect x="296" y="126" width="18" height="28" rx="4" fill="#13224a" stroke="#5f76a8" strokeWidth="2" />
              <circle cx="282" cy="126" r="4" fill="#8fd8ff" opacity={acts.location === 'habitat' ? 1 : 0.4} />
              {/* thermometer stake in the sun zone */}
              <line x1="60" y1="150" x2="60" y2="128" stroke="#5f76a8" strokeWidth="3" />
              <circle cx="60" cy="124" r="5" fill={tempShown >= 36 ? '#ff5c7a' : tempShown >= 30 ? '#ffc255' : '#41e8a5'} />
            </svg>

            {/* astronaut */}
            <div aria-hidden className={`absolute text-4xl transition-all duration-1000 ${astroSpot}`}>
              <span className={`inline-block drop-shadow-[0_0_12px_rgba(63,216,255,0.4)] ${acts.location === 'sun' ? 'astro-sunlit' : 'astro-shaded'}`}>
                {avatarEmoji}
              </span>
            </div>

            {/* zone labels */}
            <span aria-hidden className="absolute bottom-2 left-8 font-mono text-[9px] tracking-[0.16em] text-ambr/80">
              ☀ SUN · {Math.round(tempShown)}°C
            </span>
            <span aria-hidden className="absolute bottom-2 left-[54%] font-mono text-[9px] tracking-[0.16em] text-sky-300/80">
              ⛆ SHADE · COOLER WINS
            </span>
            <span aria-hidden className="absolute bottom-2 right-3 font-mono text-[9px] tracking-[0.16em] text-mint/80">
              🏠 HABITAT
            </span>

            {!resolved && (
              <span className="absolute bottom-7 left-3 font-mono text-[10px] tracking-[0.14em] text-slate-400">
                {acts.location === 'sun'
                  ? 'IN DIRECT SUNLIGHT — MOVE TO SHADE OR RETURN'
                  : acts.cooling === 'increased'
                    ? 'COOLING ACTIVE — TEMPERATURE FALLING'
                    : 'SAFE LOCATION — INCREASE SUIT COOLING'}
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
                      stable
                        ? 'border-mint bg-[rgba(4,20,14,0.65)] text-mint shadow-[0_0_40px_rgba(65,232,165,0.4)]'
                        : 'border-coral bg-[rgba(28,6,14,0.65)] text-coral shadow-[0_0_40px_rgba(255,92,122,0.4)]'
                    }`}
                  >
                    {stable
                      ? 'SUIT TEMPERATURE STABLE'
                      : THERMAL_EVENT.reasonStamps[resolved?.reason] || 'MISSION REVIEW'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Lunar sunlight and shadow can differ by hundreds of degrees. The suit&apos;s thermal-control
            system fights the heat — but location decides who wins.
          </p>
        </Panel>

        {/* Thermal console */}
        <Panel title="Suit Thermal Console" icon="🌡️">
          <div className="grid gap-4 sm:grid-cols-2">
            <Meter
              label="Suit temperature"
              value={tempShown}
              max={45}
              unit="°C"
              tone={stable ? 'green' : tempTone}
              sub={stable ? 'Settled at cabin-normal' : `Redline at ${T.CRITICAL_TEMP}°C · target ≤ ${T.STABLE_BAND}°C`}
            />
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thermal control</p>
              <p className={`font-mono text-lg font-black ${
                acts.cooling === 'increased' ? 'text-mint' : acts.cooling === 'reduced' ? 'text-coral' : 'text-ambr'
              }`}>
                {acts.cooling === 'increased' ? 'COOLING ↑' : acts.cooling === 'reduced' ? 'COOLING ↓' : 'NORMAL'}
              </p>
              <p className="text-[11px] text-slate-400">
                Location: <b className="text-slate-200">{locationLabel[acts.location]}</b> · life support ON
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button type="button" onClick={increaseCooling} disabled={acts.cooling === 'increased' || resolved}
              className={`action-btn ${acts.cooling === 'increased' ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">❄️</span>
              <b>Increase Suit Cooling</b>
              <small>{acts.cooling === 'increased' ? 'Cooling max ✓' : 'Fights hardest out of the Sun'}</small>
            </button>

            <button type="button" onClick={reduceCooling} disabled={acts.cooling === 'reduced' || resolved}
              className={`action-btn ${acts.cooling === 'reduced' ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🔥</span>
              <b>Reduce Suit Cooling</b>
              <small>{acts.cooling === 'reduced' ? 'Cooling reduced ⚠' : 'Lets heat soak build faster'}</small>
            </button>

            <button type="button" onClick={moveToShade} disabled={acts.location === 'shade' || resolved}
              className={`action-btn ${acts.location === 'shade' ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">⛱️</span>
              <b>Move to Shade</b>
              <small>{acts.location === 'shade' ? 'In shade ✓' : 'Rock shadow cuts the heat'}</small>
            </button>

            <button type="button" onClick={returnToHabitat} disabled={acts.location === 'habitat' || resolved}
              className={`action-btn ${acts.location === 'habitat' ? 'action-btn-on' : ''}`}>
              <span aria-hidden className="text-xl">🏠</span>
              <b>Return to Habitat</b>
              <small>{acts.location === 'habitat' ? 'Inside ✓' : 'Safest location of all'}</small>
            </button>

            <button type="button" onClick={ignoreWarning} disabled={resolved} className="action-btn action-btn-ghost">
              <span aria-hidden className="text-xl">🙈</span>
              <b>Ignore Thermal Warning</b>
              <small>Temperature keeps rising</small>
            </button>
          </div>

          <LogConsole lines={lines} className="mt-4" />
        </Panel>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          hidden={!resolved}
          onClick={() => go('thermalDebrief')}
          className="rounded-2xl bg-gradient-to-br from-neon via-azur to-lav px-8 py-3.5 font-display text-sm font-extrabold tracking-wide text-[#031024] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(63,124,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
        >
          📋 Open Mission Debrief
        </button>
      </div>
    </div>
  );
}
