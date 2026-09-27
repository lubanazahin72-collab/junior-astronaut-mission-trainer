// ============================================================
// Game formulas — simplified ideal rocket equation (Tsiolkovsky).
// Educational model only; not a real trajectory solver.
// ============================================================

import {
  ROCKET_DRY_MASS_KG,
  EXHAUST_VELOCITY_MPS,
  REQUIRED_DELTA_V_MPS,
  SAFETY_RESERVE_FRACTION,
} from './constants';

export function computeLaunchPlan(payloadMassKg, fuelMassKg) {
  const finalMass = ROCKET_DRY_MASS_KG + payloadMassKg;   // dry rocket + payload
  const initialMass = finalMass + fuelMassKg;             // everything at liftoff
  const achievableDeltaV =
    EXHAUST_VELOCITY_MPS * Math.log(initialMass / finalMass);
  const requiredDeltaV = REQUIRED_DELTA_V_MPS * (1 + SAFETY_RESERVE_FRACTION);
  const margin = achievableDeltaV - requiredDeltaV;

  return {
    payloadMass: payloadMassKg,
    fuelMass: fuelMassKg,
    dryMass: ROCKET_DRY_MASS_KG,
    finalMass,
    initialMass,
    achievableDeltaV,
    requiredDeltaV,
    margin,
    safe: achievableDeltaV >= requiredDeltaV,
    massRatio: initialMass / finalMass,
    propellantFraction: fuelMassKg / initialMass,
  };
}

export function fmt(value, digits = 0) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
