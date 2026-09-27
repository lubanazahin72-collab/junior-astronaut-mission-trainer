'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMission } from '@/lib/store';
import Starfield from '@/components/Starfield';
import IntroScreen from '@/components/screens/IntroScreen';
import PrepBayScreen from '@/components/screens/PrepBayScreen';
import PrepareScreen from '@/components/screens/PrepareScreen';
import PlannerScreen from '@/components/screens/PlannerScreen';
import LaunchScreen from '@/components/screens/LaunchScreen';
import PowerEventScreen from '@/components/screens/PowerEventScreen';
import WaterEventScreen from '@/components/screens/WaterEventScreen';
import RadiationEventScreen from '@/components/screens/RadiationEventScreen';
import ThermalEventScreen from '@/components/screens/ThermalEventScreen';
import DebriefScreen, {
  PowerDebriefScreen,
  WaterDebriefScreen,
  RadiationDebriefScreen,
  ThermalDebriefScreen,
} from '@/components/screens/DebriefScreen';
import ReportScreen from '@/components/screens/ReportScreen';

const SCREENS = {
  intro: IntroScreen,
  prepBay: PrepBayScreen,
  prepare: PrepareScreen,
  planner: PlannerScreen,
  launch: LaunchScreen,
  power: PowerEventScreen,
  powerDebrief: PowerDebriefScreen,
  water: WaterEventScreen,
  waterDebrief: WaterDebriefScreen,
  radiation: RadiationEventScreen,
  radiationDebrief: RadiationDebriefScreen,
  thermal: ThermalEventScreen,
  thermalDebrief: ThermalDebriefScreen,
  report: ReportScreen,
};

export default function Page() {
  const screen = useMission((s) => s.screen);
  const Screen = SCREENS[screen] ?? IntroScreen;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  return (
    <div className="relative z-10">
      <Starfield />
      <AnimatePresence mode="wait">
        <motion.main
          key={screen}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Screen />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
