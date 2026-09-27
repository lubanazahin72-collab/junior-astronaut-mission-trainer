// ============================================================
// Static cargo catalog.
// Selections here unlock (or withhold) the habitat capabilities
// that are needed during the Moon events.
// ============================================================

export const EQUIPMENT = [
  {
    id: 'solar-panel',
    name: 'Solar Panel',
    icon: '🔆',
    weight: 20,
    tag: 'Power',
    purpose: 'Generates electrical power from sunlight',
    learning: 'Lunar dust can reduce sunlight reaching solar cells',
  },
  {
    id: 'battery',
    name: 'Battery',
    icon: '🔋',
    weight: 15,
    tag: 'Power',
    purpose: 'Stores backup electrical energy',
    learning: 'Stored energy supports essential systems when solar output falls',
  },
  {
    id: 'water-recycler',
    name: 'Water Recycling System',
    icon: '💧',
    weight: 20,
    tag: 'Life Support',
    purpose: 'Stores and recycles water for crew use',
    learning: 'Remote habitats must protect limited water supplies',
  },
  {
    id: 'repair-kit',
    name: 'Repair Kit + Spare Seal',
    icon: '🧰',
    weight: 10,
    tag: 'Maintenance',
    purpose: 'Repairs pipes, seals, and equipment failures',
    learning: 'Early repair can stop a small failure from becoming critical',
  },
  {
    id: 'food-storage',
    name: 'Food Storage',
    icon: '🥫',
    weight: 15,
    tag: 'Consumables',
    purpose: 'Carries food for the crew',
    learning: 'Long-duration missions need planned consumables',
  },
  {
    id: 'radiation-shield',
    name: 'Radiation Shield',
    icon: '🛡️',
    weight: 25,
    tag: 'Protection',
    purpose: 'Adds radiation protection',
    learning: 'The Moon does not have Earth-like atmospheric protection',
  },
];

export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map((item) => [item.id, item]));

export function massOf(ids) {
  return ids.reduce((sum, id) => sum + (EQUIPMENT_BY_ID[id]?.weight ?? 0), 0);
}
