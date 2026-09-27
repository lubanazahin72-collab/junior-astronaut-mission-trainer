// ============================================================
// NASA-informed content: facts, sources, and the simulation
// disclaimer shown on the intro screen and final report.
// ============================================================

export const DISCLAIMER =
  'NASA-informed educational simulation. Mission values, resource values, and outcomes are simplified for learning and do not represent an actual NASA flight plan.';

export const FACTS = {
  prep: {
    title: 'Training for a Mission Around the Moon',
    fact: '“NASA astronauts train with spacesuits, spacecraft systems, medical operations, exercise systems, and emergency procedures before lunar missions.”',
    plain: 'Before flying Artemis II — the first crewed mission around the Moon in over fifty years — the crew rehearsed every phase: suiting up, spacecraft systems, medical response, exercise routines, and emergency procedures, until the responses became reflexes.',
    realScience: 'Astronaut preparation covers spacesuits, spacecraft systems, medical operations, exercise systems, and emergency procedures.',
    gameScenario: 'In this simulation, five readiness checks — suit, helmet/visor, oxygen, comms, and medical — must be completed before the mission plan can proceed to launch.',
    source: 'NASA — Preparing for Artemis II: Training for a Mission Around the Moon',
    url: 'https://www.nasa.gov/centers-and-facilities/johnson/preparing-for-artemis-ii-training-for-a-mission-around-the-moon/',
    simConnection: 'Each completed prep check adds a readiness badge and layers equipment onto the astronaut. All five gate the fuel console — and launch approval.',
  },
  rocket: {
    title: 'Fuel, Mass, and Delta-v',
    fact: '“A rocket becomes lighter as it burns propellant. Its ability to change velocity depends on engine performance and the ratio between initial mass and final mass.”',
    plain: 'Every kilogram of propellant makes the rocket heavier at liftoff, but burning that propellant makes it lighter. The lighter it gets, the more the same engine can accelerate it. Engineers use this balance — the mass ratio — to work out delta-v: how much the rocket can change its velocity.',
    realScience: 'Delta-v depends on effective exhaust velocity and the ratio between initial mass and final mass (the ideal rocket equation).',
    gameScenario: 'Moving the fuel slider changes the launch mass; the flight computer recalculates achievable delta-v after every change.',
    source: 'NASA Glenn Research Center — Ideal Rocket Equation',
    url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/',
    simConnection: 'Cargo choices add payload mass and the slider adds propellant mass. Together they set the mass ratio that decides whether the mission is approved for launch.',
  },
  dust: {
    title: 'Lunar Dust and Equipment',
    fact: '“Moon dust is part of lunar regolith and can create challenges for human and robotic explorers. It can affect equipment and mission operations.”',
    plain: 'Lunar dust grains are tiny, sharp, and cling to surfaces. Coated surfaces behave differently: solar panels covered in dust receive less sunlight, radiators release heat less easily, and seals and moving parts wear faster.',
    realScience: 'Lunar regolith dust can degrade equipment surfaces and complicate mission operations.',
    gameScenario: 'In this simulation, dust lowers solar-panel output and the habitat must rebalance its power budget.',
    source: 'NASA Science — Moon Dust',
    url: 'https://science.nasa.gov/moon/moon-dust/',
    simConnection: 'Dust on the habitat panel cuts solar output from 100% toward 45%, forcing a choice between non-critical demand and stored battery energy.',
  },
  water: {
    title: 'Water for Moon Exploration',
    fact: '“Water is important for future Moon exploration and crew needs. Protecting limited supplies is essential when resupply is difficult.”',
    plain: 'Water serves a Moon crew as drinking supply, oxygen generation, food preparation, and radiation shielding. The nearest resupply is about 380,000 km away, so every litre in the habitat loop is precious.',
    realScience: 'Protecting limited water supplies is essential for Moon exploration because resupply is difficult.',
    gameScenario: 'In this simulation, a failed seal drains the habitat reserve until the line is isolated and repaired with a spare seal.',
    source: 'NASA — A Few Things Artemis Will Teach Us About Living and Working on the Moon',
    url: 'https://www.nasa.gov/centers-and-facilities/goddard/a-few-things-artemis-will-teach-us-about-living-and-working-on-the-moon/',
    simConnection: 'The reserve falls from 70% while the leak runs. Isolating the damaged line and applying the spare seal is what stops the loss.',
  },
  radiation: {
    title: 'Radiation at the Moon’s South Pole',
    fact: '“The Moon does not have a thick atmosphere or a global magnetic field, so the surface is exposed to solar radiation and plasma.”',
    plain: 'Earth’s thick atmosphere and magnetic field soak up or deflect most solar radiation. The Moon has neither, so solar storms and plasma can reach the surface directly — astronauts need shielding, monitoring, and shelter procedures.',
    realScience: 'With no thick atmospheric shielding, the lunar surface is exposed to solar radiation and energetic particles.',
    gameScenario: 'In this simulation, a solar plasma burst drives the radiation meter from 20% upward; stopping the EVA and entering the shielded shelter lets the level fall again.',
    source: 'NASA Science — Phenomena NASA Astronauts Will Encounter at the Moon’s South Pole',
    url: 'https://science.nasa.gov/solar-system/moon/phenomena-nasa-astronauts-will-encounter-at-moons-south-pole/',
    simConnection: 'The meter climbs while surface work continues. Shelter stops the dose from building, and the monitor confirms the recovery.',
  },
  thermal: {
    title: 'Artemis Spacesuits and Thermal Control',
    fact: '“Lunar sunlight and shadow can create extreme temperature differences, and spacesuits use thermal-control systems to protect the astronaut.”',
    plain: 'With no air to carry or buffer heat, lunar surfaces in sunlight can exceed the boiling point of water while shaded areas plunge far below freezing. Suits use thermal-control systems — and astronauts manage where they work — to stay in a safe band.',
    realScience: 'Suits use thermal-control systems to handle the extreme temperature swings between lunar sunlight and shadow.',
    gameScenario: 'In this simulation, a suit heats from 24°C toward its redline in direct sunlight; moving to shade and increasing cooling settles it near 26°C.',
    source: 'NASA — Artemis Spacesuits (Houston We Have a Podcast)',
    url: 'https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-spacesuits/',
    simConnection: 'Location decides the heat load: in the Sun the cooler struggles, in shade it wins. Cooling plus shade is what settles the temperature.',
  },
};

export const SOURCE_CREDITS = [
  {
    name: 'NASA — Preparing for Artemis II: Training for a Mission Around the Moon',
    url: 'https://www.nasa.gov/centers-and-facilities/johnson/preparing-for-artemis-ii-training-for-a-mission-around-the-moon/',
  },
  {
    name: 'NASA Glenn Research Center — Ideal Rocket Equation',
    url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/',
  },
  {
    name: 'NASA Science — Moon Dust',
    url: 'https://science.nasa.gov/moon/moon-dust/',
  },
  {
    name: 'NASA — A Few Things Artemis Will Teach Us About Living and Working on the Moon',
    url: 'https://www.nasa.gov/centers-and-facilities/goddard/a-few-things-artemis-will-teach-us-about-living-and-working-on-the-moon/',
  },
  {
    name: 'NASA Science — Phenomena NASA Astronauts Will Encounter at the Moon’s South Pole',
    url: 'https://science.nasa.gov/solar-system/moon/phenomena-nasa-astronauts-will-encounter-at-moons-south-pole/',
  },
  {
    name: 'NASA — Artemis Spacesuits (Houston We Have a Podcast)',
    url: 'https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-spacesuits/',
  },
];
