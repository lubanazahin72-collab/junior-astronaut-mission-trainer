// ============================================================
// Astronaut selection + Mission Preparation Bay readiness items.
// Five prep checks gate the flow into the fuel console, and the
// completed prep set gates launch approval later.
// ============================================================

export const AVATARS = [
  { id: 'nova', name: 'Nova', emoji: '🧑‍🚀' },
  { id: 'orion', name: 'Orion', emoji: '👩‍🚀' },
  { id: 'comet', name: 'Comet', emoji: '👨‍🚀' },
];

export const DEFAULT_AVATAR_ID = 'nova';

export const AVATAR_BY_ID = Object.fromEntries(AVATARS.map((a) => [a.id, a]));

export function avatarOf(id) {
  return AVATAR_BY_ID[id] ?? AVATAR_BY_ID[DEFAULT_AVATAR_ID];
}

// Prep checklist — each item is a performed action, NOT a checkbox.
export const PREP_ITEMS = [
  {
    id: 'suit',
    name: 'Spacesuit',
    icon: '🧥',
    badge: 'SUIT READY',
    action: 'Suit up and run the pressure checks',
    layer: 'Suit pressure sealed',
  },
  {
    id: 'helmet',
    name: 'Helmet / Visor',
    icon: '🪖',
    badge: 'VISOR READY',
    action: 'Fit the helmet and gold visor',
    layer: 'Visor locked',
  },
  {
    id: 'oxygen',
    name: 'Oxygen / Life-Support Check',
    icon: '🫁',
    badge: 'O2 READY',
    action: 'Verify O2 flow and scrubbers',
    layer: 'O2 flow nominal',
  },
  {
    id: 'comms',
    name: 'Communication Device',
    icon: '📡',
    badge: 'COMMS READY',
    action: 'Sync radio with mission control',
    layer: 'Comms link up',
  },
  {
    id: 'medical',
    name: 'Medical Kit',
    icon: '🩺',
    badge: 'MEDICAL READY',
    action: 'Stow the medical kit and vitals sensors',
    layer: 'Medical kit stowed',
  },
];

export const PREP_ITEM_BY_ID = Object.fromEntries(PREP_ITEMS.map((p) => [p.id, p]));

export const ALL_PREP_IDS = PREP_ITEMS.map((p) => p.id);

export function prepComplete(prep) {
  return ALL_PREP_IDS.every((id) => prep?.[id]);
}

export function prepCount(prep) {
  return ALL_PREP_IDS.filter((id) => prep?.[id]).length;
}
