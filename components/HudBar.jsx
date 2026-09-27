'use client';

import { useMission } from '@/lib/store';
import { cn } from '@/lib/utils';
import AstronautAvatar from '@/components/AstronautAvatar';

function HudStatus({ label, value, bad }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
        bad ? 'border-ambr/50 bg-ambr/10 text-ambr' : 'border-mint/40 bg-mint/10 text-mint'
      }`}
    >
      <span className="text-slate-400">{label}</span>
      <b>{value}</b>
    </span>
  );
}

const BAD_VALUES = ['Backup', 'Rationing', 'review', 'critical', 'Limited', 'Standby'];

/**
 * Persistent mission HUD shown across the Moon event screens:
 * Score · Astronaut · Moon Day · Power / Water / Suit / Comms.
 */
export default function HudBar({ className }) {
  const astronaut = useMission((s) => s.astronaut);
  const mission = useMission((s) => s.mission);

  const isBad = (v) => BAD_VALUES.some((b) => String(v).toLowerCase().includes(b.toLowerCase()));

  return (
    <div
      aria-label="Mission HUD"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-neon/25 bg-panel/70 px-4 py-3 backdrop-blur-xl',
        className
      )}
    >
      <span className="flex items-center gap-2.5">
        <AstronautAvatar avatarId={astronaut.avatarId} size="sm" />
        <span className="leading-tight">
          <b className="block font-display text-sm text-slate-100">{astronaut.name}</b>
          <small className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
            Moon Day {mission.day}
          </small>
        </span>
      </span>

      <span className="rounded-xl border border-neon/40 bg-neon/10 px-3 py-1.5 text-center leading-tight">
        <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Score
        </small>
        <b className="font-mono text-sm text-neon">{mission.score} / 100</b>
      </span>

      <span className="ml-auto flex flex-wrap items-center gap-1.5">
        <HudStatus label="⚡ Power" value={mission.power} bad={isBad(mission.power)} />
        <HudStatus label="💧 Water" value={mission.water} bad={isBad(mission.water)} />
        <HudStatus label="🧯 Suit" value={mission.suitStatus} bad={isBad(mission.suitStatus)} />
        <HudStatus label="📡 Comms" value={mission.commsStatus} bad={isBad(mission.commsStatus)} />
      </span>
    </div>
  );
}
