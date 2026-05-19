import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Phase } from '../composites/TimerPanel.tsx';

export interface Settings {
  workMin: number;
  workSec: number;
  shortMin: number;
  shortSec: number;
  longMin: number;
  longSec: number;
  sessionsPerCycle: number;
  soundEnabled: boolean;
}

export interface SessionLogEntry {
  id: number;
  phase: Phase;
  duration: number;
  completedAt: string;
}

export const defaultSettings: Settings = {
  workMin: 60,
  workSec: 0,
  shortMin: 5,
  shortSec: 0,
  longMin: 15,
  longSec: 0,
  sessionsPerCycle: 4,
  soundEnabled: true,
};

const SESSION_LOG_CAP = 50;

const totalForPhase = (phase: Phase, settings: Settings): number => {
  switch (phase) {
    case 'work':
      return settings.workMin * 60 + settings.workSec;
    case 'short-break':
      return settings.shortMin * 60 + settings.shortSec;
    case 'long-break':
      return settings.longMin * 60 + settings.longSec;
  }
};

const advancePhase = (
  current: Phase,
  sessionIndex: number,
  sessionsPerCycle: number,
): Phase => {
  if (current === 'work') {
    return sessionIndex >= sessionsPerCycle ? 'long-break' : 'short-break';
  }
  return 'work';
};

const nextSessionIndex = (
  completedPhase: Phase,
  sessionIndex: number,
): number => {
  if (completedPhase === 'long-break') return 1;
  if (completedPhase === 'work') return sessionIndex + 1;
  return sessionIndex;
};

const formatHHMM = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

interface TimerState {
  phase: Phase;
  running: boolean;
  remainingSeconds: number;
  sessionIndex: number;
  sessionLog: SessionLogEntry[];
  settings: Settings;

  toggle: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  setPhase: (phase: Phase) => void;
  setSettings: (partial: Partial<Settings>) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      phase: 'work',
      running: false,
      remainingSeconds: totalForPhase('work', defaultSettings),
      sessionIndex: 1,
      sessionLog: [],
      settings: defaultSettings,

      toggle: () => set((s) => ({ running: !s.running })),

      reset: () => {
        const { phase, settings } = get();
        set({ remainingSeconds: totalForPhase(phase, settings), running: false });
      },

      skip: () => {
        const { phase, sessionIndex, settings } = get();
        const next = advancePhase(phase, sessionIndex, settings.sessionsPerCycle);
        set({
          phase: next,
          sessionIndex: nextSessionIndex(phase, sessionIndex),
          remainingSeconds: totalForPhase(next, settings),
        });
      },

      tick: () => {
        const { remainingSeconds, phase, sessionIndex, settings, sessionLog } = get();
        if (remainingSeconds > 1) {
          set({ remainingSeconds: remainingSeconds - 1 });
          return;
        }
        const completed: SessionLogEntry = {
          id: Date.now(),
          phase,
          duration: totalForPhase(phase, settings),
          completedAt: formatHHMM(new Date()),
        };
        const next = advancePhase(phase, sessionIndex, settings.sessionsPerCycle);
        set({
          phase: next,
          sessionIndex: nextSessionIndex(phase, sessionIndex),
          remainingSeconds: totalForPhase(next, settings),
          sessionLog: [...sessionLog, completed].slice(-SESSION_LOG_CAP),
          running: false,
        });
      },

      setPhase: (phase) => {
        const { settings } = get();
        set({ phase, remainingSeconds: totalForPhase(phase, settings), running: false });
      },

      setSettings: (partial) => {
        set((s) => ({ settings: { ...s.settings, ...partial } }));
      },
    }),
    {
      name: 'focus-timer-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        phase: state.phase,
        remainingSeconds: state.remainingSeconds,
        sessionIndex: state.sessionIndex,
        sessionLog: state.sessionLog,
        settings: state.settings,
      }),
      version: 1,
    },
  ),
);
