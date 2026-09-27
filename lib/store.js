// ============================================================
// Mission state — zustand store (main application controller).
// Global gameState: astronaut, rocket plan, and mission progress
// (score + event results) persist across all post-Intro screens.
// ============================================================

import { create } from 'zustand';
import { DEFAULT_FUEL_KG } from './constants';
import { DEFAULT_AVATAR_ID, avatarOf } from './astronaut';

/** Event registry: store slice → doc eventResult key + success outcome. */
const EVENT_KEYS = {
  powerEvent: { resultKey: 'dust', success: 'stable' },
  waterEvent: { resultKey: 'water', success: 'restored' },
  radiationEvent: { resultKey: 'radiation', success: 'shielded' },
  thermalEvent: { resultKey: 'thermal', success: 'stable' },
};

const initialState = () => ({
  screen: 'intro',

  // --- astronaut -------------------------------------------------
  astronaut: {
    avatarId: DEFAULT_AVATAR_ID,
    name: avatarOf(DEFAULT_AVATAR_ID).name,
    prep: {
      suit: false,
      helmet: false,
      oxygen: false,
      comms: false,
      medical: false,
    },
  },

  // --- rocket / cargo --------------------------------------------
  selectedEquipment: [], // array of equipment ids (payload mass + capabilities)
  fuelMass: DEFAULT_FUEL_KG, // kg of propellant chosen in the planner
  launch: { approved: false, achievableDeltaV: 0, requiredDeltaV: 0 },

  // --- moon events (detail slices) --------------------------------
  powerEvent: { outcome: null, reason: null, criticalsEverOff: false },
  waterEvent: { outcome: null, reason: null, ignoredAlerts: 0, repairedEarly: false },
  radiationEvent: { outcome: null, reason: null, shieldCarried: false },
  thermalEvent: { outcome: null, reason: null },

  // --- mission progress (doc gameState.mission) -------------------
  mission: {
    day: 1,
    score: 0, // 0–100, +25 per survived event
    power: 'Nominal',
    water: 'Nominal',
    suitStatus: 'Standby',
    commsStatus: 'Standby',
    currentEventIndex: 0,
    eventResults: {
      dust: 'pending',
      water: 'pending',
      radiation: 'pending',
      thermal: 'pending',
    },
    failed: false,
    failureReason: null,
  },
});

/** Shared write-through: detail slice + doc eventResult + score/failure. */
function applyEventResult(set, get, sliceKey, payload) {
  const { resultKey, success } = EVENT_KEYS[sliceKey];
  const survived = payload.outcome === success;
  const s = get();
  const mission = { ...s.mission, eventResults: { ...s.mission.eventResults } };
  mission.eventResults[resultKey] = survived ? 'survived' : 'failed';
  if (survived) {
    mission.score = Math.min(100, mission.score + 25);
  } else {
    mission.failed = true;
    mission.failureReason =
      payload.failureText || 'The emergency response ended in review.';
  }
  mission.day = 1 + Object.values(mission.eventResults).filter((r) => r !== 'pending').length;

  const statusByKey = payload.statusUpdate || {};
  for (const [k, v] of Object.entries(statusByKey)) mission[k] = v;

  set({
    [sliceKey]: { ...s[sliceKey], ...payload, failureText: undefined },
    mission,
  });
}

export const useMission = create((set, get) => ({
  ...initialState(),

  go: (screen) => set({ screen }),

  // --- astronaut ---------------------------------------------------
  selectAstronaut: (avatarId) =>
    set({ astronaut: { ...get().astronaut, avatarId, name: avatarOf(avatarId).name } }),

  completePrep: (id) =>
    set((s) =>
      s.astronaut.prep[id]
        ? s
        : { astronaut: { ...s.astronaut, prep: { ...s.astronaut.prep, [id]: true } } }
    ),

  // --- cargo -------------------------------------------------------
  toggleEquipment: (id) =>
    set((s) => ({
      selectedEquipment: s.selectedEquipment.includes(id)
        ? s.selectedEquipment.filter((x) => x !== id)
        : [...s.selectedEquipment, id],
    })),

  setFuel: (kg) => set({ fuelMass: kg }),

  /** Store the approved plan and move to the launch scene in one update. */
  confirmLaunch: (plan) =>
    set((s) => ({
      launch: {
        approved: plan.safe,
        achievableDeltaV: plan.achievableDeltaV,
        requiredDeltaV: plan.requiredDeltaV,
      },
      mission: {
        ...s.mission,
        suitStatus: 'Active',
        commsStatus: s.astronaut.prep.comms ? 'Online' : 'Limited',
      },
      screen: 'launch',
    })),

  // --- moon events ---------------------------------------------------
  resolvePower: (payload) => {
    const { outcome } = payload;
    if (!outcome) return;
    applyEventResult(set, get, 'powerEvent', {
      ...payload,
      statusUpdate:
        outcome === 'stable' ? { power: 'Stable · 62%' } : { power: 'Backup power' },
    });
  },

  resolveWater: (payload) => {
    const { outcome } = payload;
    // mid-event partial updates (ignoredAlerts / repairedEarly) pass through
    // without touching mission progress.
    if (!outcome) {
      set((s) => ({ waterEvent: { ...s.waterEvent, ...payload } }));
      return;
    }
    applyEventResult(set, get, 'waterEvent', {
      ...payload,
      statusUpdate:
        outcome === 'restored' ? { water: 'Restored' } : { water: 'Rationing' },
    });
  },

  resolveRadiation: (payload) => {
    const { outcome } = payload;
    if (!outcome) {
      set((s) => ({ radiationEvent: { ...s.radiationEvent, ...payload } }));
      return;
    }
    applyEventResult(set, get, 'radiationEvent', {
      ...payload,
      statusUpdate:
        outcome === 'shielded'
          ? { suitStatus: 'Shielded' }
          : { suitStatus: 'Exposure review' },
    });
  },

  resolveThermal: (payload) => {
    const { outcome } = payload;
    if (!outcome) {
      set((s) => ({ thermalEvent: { ...s.thermalEvent, ...payload } }));
      return;
    }
    applyEventResult(set, get, 'thermalEvent', {
      ...payload,
      statusUpdate:
        outcome === 'stable'
          ? { suitStatus: 'Temp stable · 26°C' }
          : { suitStatus: 'Thermal critical' },
    });
  },

  /** Full reset: astronaut, cargo, fuel, events, score — everything. */
  restart: () => set({ ...initialState(), screen: 'prepBay' }),
}));
