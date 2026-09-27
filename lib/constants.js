// ============================================================
// JUNIOR ASTRONAUT MISSION TRAINER — simulation constants
// Local static data only. All values are simplified for learning.
// ============================================================

// --- Earth preparation ---------------------------------------
export const CARGO_CAPACITY_KG = 75;

// --- Launch planner (simplified rocket model) -----------------
export const ROCKET_DRY_MASS_KG = 120;      // kg
export const EXHAUST_VELOCITY_MPS = 4500;   // m/s (effective exhaust velocity)
export const REQUIRED_DELTA_V_MPS = 9400;   // m/s (mission requirement)
export const SAFETY_RESERVE_FRACTION = 0.05;

// NOTE ON THE FUEL RANGE:
// The prototype brief capped fuel at 700 kg. With an exhaust velocity of
// 4500 m/s and a 9400 m/s delta-v target, the ideal rocket equation makes
// that range impossible (about 8650 m/s absolute best case, with zero
// cargo). Real launch vehicles solve this exactly the way this simulation
// now does: roughly 85-90% of liftoff mass must be propellant. The slider
// therefore extends to 1600 kg so a safe mass ratio is reachable and the
// payload-vs-propellant trade-off stays playable and physically honest.
export const FUEL_MIN_KG = 100;
export const FUEL_MAX_KG = 1600;
export const FUEL_STEP_KG = 10;
export const DEFAULT_FUEL_KG = 450;

// --- Shared simulation timing ---------------------------------
export const TICK_MS = 250;

// --- Mission progress rail ------------------------------------
export const STEPS = ['Preparation', 'Launch Plan', 'Transit', 'Moon Events', 'Mission Report'];

// --- Moon Event 1: power emergency tuning (percent units) ------
export const POWER_SIM = {
  DUST_MAX: 55,                // dust coverage % at worst point
  DUST_RATE_PER_TICK: 1.6,     // dust accumulates over ~9 seconds
  NO_PANEL_SOLAR: 22,          // solar output % when no panel was carried
  CRITICAL_BASELINE: 28,       // O2 life support (16) + water recycling (12)
  RESERVE_BOOST: 20,           // grid support from battery (reserve mode)
  NORMAL_BOOST: 8,             // grid support from battery (normal mode)
  OVERLOAD_PENALTY: 0.9,       // grid % lost per demand unit above baseline
  GRID_EASE: 0.09,             // grid drift toward its target per tick
  DRAIN_BASE: 0.08,            // battery %/tick at baseline load
  DRAIN_PER_OVERLOAD: 0.045,   // extra battery %/tick per overload unit
  RESERVE_DRAIN_FACTOR: 0.6,   // reserve mode uses stored energy efficiently
  NORMAL_DRAIN_FACTOR: 1.5,
  MIN_BOOST_BATTERY: 8,        // battery stops assisting below this level
  STABLE_THRESHOLD: 58,        // grid % considered "stable"
  STABLE_HOLD_TICKS: 20,       // hold 5 s to declare "Habitat Stable"
  CRITICALS_OFF_LIMIT_TICKS: 32, // life support off > 8 s -> review
  LOW_POWER_LIMIT_TICKS: 12,     // grid < 12% for 3 s -> collapse
  DEPLETED_LIMIT_TICKS: 24,      // empty battery under heavy load -> review
  CAPABILITY_LIMIT_TICKS: 72,    // missing hardware -> review after 18 s
  MAX_EVENT_SEC: 100,
  DUST_AFTER_SUCCESS: 34,      // some dust always remains after stabilization
};

// --- Moon Event 2: water leak tuning (percent units) -----------
export const WATER_SIM = {
  START_RESERVE: 70,
  GRACE_SEC: 1.5,                 // reading time before the leak starts
  BASE_LEAK_PER_SEC: 0.7,
  VALVE_FACTOR: 0.35,             // closing the main valve slows the leak
  ISOLATE_FACTOR: 0.08,           // isolating the line nearly stops it
  WEAK_PATCH_FACTOR: 0.55,        // patch applied against pressure holds partly
  BACKUP_TANK_DRAIN_PER_SEC: 0.45, // backup water drains the shared reserve
  NO_RECYCLER_FACTOR: 1.3,        // no processing loop: leak hurts more
  CRITICAL_RESERVE: 18,
  STABILIZE_HOLD_SEC: 4,
  STALE_ISOLATED_SEC: 14,         // isolated but no repair kit -> review
  CAPABILITY_LIMIT_SEC: 16,       // missing required hardware -> review
  MAX_EVENT_SEC: 110,
  RESCUE_RECOVER: 3,              // small reserve recovery after sealing
};

// --- Moon Event 3: solar radiation alert (percent units) --------
export const RADIATION_SIM = {
  START_LEVEL: 20,
  RISE_PER_SEC: 2.1,           // storm builds toward the habitat floor
  WORK_RISE_PER_SEC: 1.3,      // extra dose while surface work continues
  FLARE_RISE_PER_SEC: 1.1,     // extra dose during plasma burst peaks
  SAFE_FLOOR: 16,              // inside the shielded shelter
  FALL_PER_SEC: 5.5,           // shelter shielding sheds the dose
  FALL_PER_SEC_SHIELD_KIT: 8.0, // radiation-shield cargo speeds recovery
  MONITOR_FALL_BONUS: 1.6,     // monitor fine-tunes the shelter systems
  SAFE_LEVEL: 24,              // meter considered "crew shielded"
  STABILIZE_HOLD_SEC: 4,
  EXPOSURE_LIMIT: 88,          // meter above this -> review
  MAX_EVENT_SEC: 110,
  SAFE_TARGET: 22,             // settled level after recovery
};

// --- Moon Event 4: extreme temperature / suit cooling (°C) ------
export const THERMAL_SIM = {
  START_TEMP: 24,
  SUN_RISE_PER_SEC: 0.62,      // direct sunlight on the suit
  SHADE_RISE_PER_SEC: 0.14,    // shade slows but heat soaks continue
  HABITAT_RISE_PER_SEC: 0.05,  // inside the habitat
  REDUCE_BONUS_PER_SEC: 0.55,  // reducing cooling lets heat soak faster
  COOLING_IN_SUN_PER_SEC: 0.3, // cooler struggles against direct sun
  COOLING_IN_SHADE_PER_SEC: 0.85,
  COOLING_IN_HABITAT_PER_SEC: 1.05,
  SETTLE_TEMP: 26,             // temperature settles near this value
  STABLE_BAND: 27.5,           // within band + cooling on = stable hold
  STABILIZE_HOLD_SEC: 4,
  CRITICAL_TEMP: 40,           // suit thermal redline -> review
  MAX_EVENT_SEC: 110,
};
