// ============================================================
// Moon event scenarios, habitat systems, and debrief content.
// Language note: debriefs describe outcomes and reviews — they
// never use quiz-style terminology.
// ============================================================

export const POWER_EVENT = {
  key: 'power',
  code: 'ME-1 · DUST & POWER',
  title: 'Lunar Dust — Power Emergency',
  scenario: 'Fine lunar dust has collected on the habitat solar panel. Less sunlight is reaching the cells, and electrical power output is falling.',
  requiredEquipment: [
    { id: 'solar-panel', label: 'Solar Panel' },
    { id: 'battery', label: 'Battery' },
  ],
  systems: [
    { id: 'oxygen', name: 'Oxygen Life Support', icon: '🫁', critical: true, load: 16 },
    { id: 'recycler', name: 'Water Recycling', icon: '💧', critical: true, load: 12 },
    { id: 'lab', name: 'Research Lab', icon: '🔬', critical: false, load: 14 },
    { id: 'lights', name: 'Decorative Lights', icon: '💡', critical: false, load: 8 },
    { id: 'media', name: 'Entertainment Display', icon: '📺', critical: false, load: 6 },
  ],
  procedure: [
    'Switch the battery to Emergency Reserve Mode',
    'Power down the Research Lab',
    'Power down the Decorative Lights',
    'Power down the Entertainment Display',
    'Keep Oxygen Life Support and Water Recycling running',
    'Hold the power grid above 58% until the habitat stabilizes',
  ],
  diagram: [
    { icon: '🔆', name: 'Solar Panel', role: 'Generates electricity' },
    { icon: '🔋', name: 'Battery', role: 'Stores electricity for later use' },
  ],
  diagramNote: 'Informational only — this diagram explains the energy flow and does not control mission success. The panel generates electricity and the battery keeps it for later; demand decides how fast it runs out.',
  debrief: {
    stable: {
      status: 'Habitat Stable',
      headline: 'Mission continued — the habitat rode out the power emergency.',
      systemResponse: 'Battery switched to Emergency Reserve Mode. Research Lab, Decorative Lights, and Entertainment Display were powered down. Oxygen Life Support and Water Recycling stayed online, and the power grid climbed back to about 62%.',
      whatHappened: 'Dust cut solar output from 100% toward 45%, but habitat demand was still near its peak. The gap between supply and demand was draining the battery. Shedding non-critical loads closed most of the gap, and stored battery energy covered the rest until the grid stabilized.',
      whyItMatters: 'The Moon has no power line to plug into. Generation (solar), storage (battery), and demand must stay balanced continuously — and life support always has first claim on the energy.',
      learningOutcome: 'In a power emergency: cut non-critical demand first, protect life-support loads, and use stored energy deliberately. Carrying a solar panel and a battery during Earth preparation is what made this recovery possible.',
    },
    compromised: {
      status: 'Power Emergency — Review Required',
      headline: 'Mission continued under backup power — the emergency response needs review.',
      systemResponse: 'The habitat survived on backup modes, but the grid never reached a stable state. Read the mission-control review notes below, then compare them with the recommended procedure.',
      whatHappened: 'Solar output fell while demand stayed high. Without the full response, the gap between supply and demand kept growing and stored energy kept draining.',
      whyItMatters: 'The Moon has no power line to plug into. If generation, storage, and demand drift out of balance, life support is the last system that can ever be allowed to fail.',
      learningOutcome: 'Review the notes, then re-plan: carry the systems that enable recovery (solar panel + battery), shed non-critical loads early, protect life support, and keep an emergency reserve strategy ready.',
    },
  },
  reasonNotes: {
    'capability-missing': 'Required recovery capability unavailable — hardware that was not loaded during Earth preparation is missing on the Moon. Without it, the grid cannot be brought back above the stable range.',
    'criticals-off': 'A life-support system was switched off during the emergency. Mission control engaged autonomous backup modes and ended the exercise for review — oxygen and water systems are the last systems that may be interrupted.',
    'power-collapse': 'Grid power fell below safe levels before loads were balanced. Backup cells carried the habitat, and mission control ended the exercise for review.',
    'battery-depleted': 'The battery drained to empty while non-critical systems were still drawing power. Energy spent on comfort loads was not available for life support.',
    'timeout': 'The exercise clock expired before the habitat reached a stable power state.',
  },
  reasonStamps: {
    'capability-missing': 'CAPABILITY UNAVAILABLE',
    'criticals-off': 'LIFE-SUPPORT REVIEW',
    'power-collapse': 'POWER COLLAPSE',
    'battery-depleted': 'BATTERY DEPLETED',
    'timeout': 'EXERCISE TIMEOUT',
  },
};

export const WATER_EVENT = {
  key: 'water',
  code: 'ME-2 · WATER LEAK',
  title: 'Water System Emergency',
  scenario: 'A seal in the habitat water-recycling line has failed. Water is leaking and the stored supply is decreasing.',
  requiredEquipment: [
    { id: 'water-recycler', label: 'Water Recycling System' },
    { id: 'repair-kit', label: 'Repair Kit + Spare Seal' },
  ],
  procedure: [
    'Detect the leak and confirm the falling reserve',
    'Close the main valve (optional safety step)',
    'Isolate the damaged line',
    'Apply the spare seal with the Repair Kit',
    'Confirm a stable water reserve',
  ],
  diagram: ['Detect leak', 'Isolate damaged line', 'Apply spare seal', 'Confirm stable reserve'],
  diagramNote: 'Reference procedure — informational only, not part of the interface controls. Leak response is a sequence, not a single action.',
  debrief: {
    restored: {
      status: 'Water System Restored',
      headline: 'Mission continued — the leak was stopped at the source.',
      systemResponse: 'Damaged line isolated against pressure, spare seal applied, leak stopped. The reserve held steady and the recycling loop returned to normal operation.',
      whatHappened: 'A failed seal let pressurized water escape through a crack in the recycling line. Isolating the line removed the pressure so the spare seal could actually hold; the patch then stopped the loss before the reserve reached critical levels.',
      whyItMatters: 'Water is drinking supply, oxygen production, and radiation shielding for a Moon crew — and resupply is 380,000 km away. A small leak can become a mission-ending loss within hours.',
      learningOutcome: 'Leak response is a sequence: detect → isolate → repair → confirm. Repairing against active pressure only partly works — isolation first is what lets a seal hold. Carrying the water recycling system and repair kit made the fix possible.',
    },
    compromised: {
      status: 'Water Emergency — Review Required',
      headline: 'Mission continued on rationing — the emergency response needs review.',
      systemResponse: 'Mission control switched the habitat to emergency rationing. Read the review notes below, then compare them with the recommended procedure.',
      whatHappened: 'Water kept leaving the system faster than the response could stop it, and the reserve fell toward rationing levels.',
      whyItMatters: 'A Moon habitat cannot call a plumber. Protecting a limited water supply depends on preparation plus a disciplined isolation-and-repair sequence.',
      learningOutcome: 'Review the notes, then re-plan: carry the water recycling system and repair kit, isolate damaged lines before repairing, and avoid opening backup supplies that drain the shared reserve faster.',
    },
  },
  reasonNotes: {
    'capability-missing': 'Required water-management capability unavailable — hardware that was not loaded during Earth preparation is missing on the Moon, so the leak could not be properly managed.',
    'reserve-critical': 'The stored reserve fell below 18% before the line was sealed. Mission control switched the habitat to emergency rationing and ended the exercise for review.',
    'stale-isolated': 'The line was successfully isolated, but without a Repair Kit the damaged seal could not be replaced. The leak was slowed, not stopped.',
    'timeout': 'The exercise clock expired before the water system was restored.',
  },
  reasonStamps: {
    'capability-missing': 'CAPABILITY UNAVAILABLE',
    'reserve-critical': 'RESERVE CRITICAL',
    'stale-isolated': 'LINE NOT SEALED',
    'timeout': 'EXERCISE TIMEOUT',
  },
};

export const RADIATION_EVENT = {
  key: 'radiation',
  code: 'ME-3 · RADIATION ALERT',
  title: 'Solar Radiation Alert',
  scenario: 'A burst of solar plasma is heading toward the lunar surface. With no thick atmosphere to absorb it, radiation levels at the surface are climbing while the crew is outside on an EVA.',
  requiredEquipment: [],
  bonusEquipment: [{ id: 'radiation-shield', label: 'Radiation Shield' }],
  procedure: [
    'Stop the EVA and secure tools',
    'Return to the habitat',
    'Enter the shielded shelter',
    'Activate the radiation monitor',
    'Hold until the radiation meter falls back into the safe band',
  ],
  diagram: ['Stop EVA', 'Return to habitat', 'Enter shielded shelter', 'Activate monitor'],
  diagramNote: 'Reference procedure — informational only, not part of the interface controls. Radiation response is a sequence: get inside shielding first, then monitor the levels down.',
  debrief: {
    shielded: {
      status: 'Crew Shielded',
      headline: 'Mission continued — the crew reached shielding before the plasma peak.',
      systemResponse: 'EVA stopped, crew returned to the habitat and entered the shielded shelter. The radiation monitor tracked the dose falling back into the safe band as the shelter did its job.',
      whatHappened: 'The Moon has no thick atmosphere to absorb solar plasma, so the surface dose climbed quickly. Stopping surface work and moving into shielding removed the crew from exposure while the storm passed.',
      whyItMatters: 'The Moon does not have Earth-like atmospheric shielding, and the magnetic bubble that protects Earth does not extend to the lunar surface. Shelter is the first line of defense during a solar radiation alert.',
      learningOutcome: 'During a radiation alert: stop surface work immediately, return to the habitat, and get inside protected shielding before monitoring recovery. The shelter — not speed — is what protects the crew.',
    },
    compromised: {
      status: 'Radiation Alert — Review Required',
      headline: 'Mission control moved the crew to protected quarters — the response needs review.',
      systemResponse: 'Autonomous protocols recalled the crew and placed them in protected quarters. Read the mission-control review notes below, then compare them with the recommended procedure.',
      whatHappened: 'Radiation levels kept climbing while surface work continued. Without reaching the shielded shelter in time, exposure risk grew past the safety limit.',
      whyItMatters: 'The Moon does not have thick atmospheric shielding like Earth. During a radiation alert, astronauts should stop surface work and move to protected shelter — every minute outside raises the dose.',
      learningOutcome: 'Review the notes, then re-plan: stop the EVA at the first alert, return to the habitat, enter the shielded shelter, and let the monitor confirm recovery before going back outside.',
    },
  },
  reasonNotes: {
    'exposure-risk': 'Radiation levels climbed past the exposure limit before the crew reached shielding. Autonomous protocols recalled the crew to protected quarters and ended the exercise for review.',
    'timeout': 'The exercise clock expired before the crew was confirmed shielded.',
  },
  reasonStamps: {
    'exposure-risk': 'EXPOSURE RISK',
    'timeout': 'EXERCISE TIMEOUT',
  },
};

export const THERMAL_EVENT = {
  key: 'thermal',
  code: 'ME-4 · THERMAL CONTROL',
  title: 'Extreme Temperature — Suit Cooling',
  scenario: 'The astronaut is working in direct sunlight, where lunar surface temperatures climb past the boiling point of water. The suit thermal-control system is fighting a rising temperature trend.',
  requiredEquipment: [],
  procedure: [
    'Move out of direct sunlight (shade or habitat)',
    'Increase suit cooling',
    'Keep life-support systems running',
    'Hold until the suit temperature settles near cabin-normal',
  ],
  diagram: ['Move to shade', 'Increase suit cooling', 'Life support stays ON', 'Temperature settles ~26°C'],
  diagramNote: 'Reference procedure — informational only, not part of the interface controls. Location first, then cooling: the cooler sheds heat far more easily out of direct sunlight.',
  debrief: {
    stable: {
      status: 'Suit Temperature Stable',
      headline: 'Mission continued — the suit thermal-control system caught the trend in time.',
      systemResponse: 'The astronaut moved out of direct sunlight and increased suit cooling. Life support stayed active, and the suit temperature settled back near 26°C.',
      whatHappened: 'Lunar sunlight and shadow create extreme temperature differences — surface rock can swing hundreds of degrees between sun and shade. Direct sunlight kept adding heat faster than the cooler could shed it; moving to shade flipped that balance.',
      whyItMatters: 'There is no air on the Moon to carry heat away or smooth the swings between sunlight and shadow. Suits rely on thermal-control systems, and location — sun versus shade — decides how hard they work.',
      learningOutcome: 'When a suit heats up: change location first (shade or habitat), then increase cooling, and keep life support running. Reducing cooling or ignoring the warning lets the trend run toward the thermal redline.',
    },
    compromised: {
      status: 'Thermal Alert — Review Required',
      headline: 'Mission control recalled the astronaut — the thermal response needs review.',
      systemResponse: 'Autonomous protocols recalled the astronaut to the habitat airlock. Read the mission-control review notes below, then compare them with the recommended procedure.',
      whatHappened: 'The suit kept absorbing heat in direct sunlight while the response lagged. Temperature crossed the suit thermal redline before the trend was reversed.',
      whyItMatters: 'Lunar sunlight and shadow can create extreme temperature differences. Without working thermal control in a safe location, a suit can go from warm to critical within minutes.',
      learningOutcome: 'Review the notes, then re-plan: treat a rising suit temperature as an immediate location problem — shade or habitat first, then increase cooling, and never reduce cooling while the trend is climbing.',
    },
  },
  reasonNotes: {
    'thermal-critical': 'The suit temperature crossed the thermal redline while still absorbing heat. Mission control recalled the astronaut to the habitat airlock and ended the exercise for review.',
    'timeout': 'The exercise clock expired before the suit temperature settled into the stable band.',
  },
  reasonStamps: {
    'thermal-critical': 'THERMAL CRITICAL',
    'timeout': 'EXERCISE TIMEOUT',
  },
};
