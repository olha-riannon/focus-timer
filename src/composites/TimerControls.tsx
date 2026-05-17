import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './TimerControls.css';

const TOGGLE_EASE = [0.4, 0, 0.2, 1] as const;

interface TimerControlsProps {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ running, onToggle, onReset, onSkip }: TimerControlsProps) {
  return (
    <div className="timer-controls" role="group" aria-label="Timer controls">
      <button
        type="button"
        className="hud-button hud-button--secondary"
        data-notch="bl"
        aria-label="Reset"
        onClick={onReset}
      >
        <RotateCcw size={14} aria-hidden />
        <span className="hud-button__label">RESET</span>
        <span className="hud-button__notch-stroke" aria-hidden />
      </button>

      <button
        type="button"
        className="hud-button hud-button--primary"
        aria-label={running ? 'Pause' : 'Start'}
        aria-pressed={running}
        onClick={onToggle}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={running ? 'pause-icon' : 'play-icon'}
            className="hud-button__icon"
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
            transition={{ duration: 0.42, ease: TOGGLE_EASE }}
          >
            {running ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          </motion.span>
        </AnimatePresence>
        <span className="hud-button__label">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={running ? 'pause-text' : 'start-text'}
              className="hud-button__label-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.42, ease: TOGGLE_EASE }}
            >
              {running ? 'PAUSE' : 'START'}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>

      <button
        type="button"
        className="hud-button hud-button--secondary"
        data-notch="br"
        aria-label="Skip phase"
        onClick={onSkip}
      >
        <SkipForward size={14} aria-hidden />
        <span className="hud-button__label">SKIP</span>
        <span className="hud-button__notch-stroke" aria-hidden />
      </button>
    </div>
  );
}
