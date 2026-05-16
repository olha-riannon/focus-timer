import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './TimerControls.css';

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
        aria-label="Reset"
        onClick={onReset}
      >
        <RotateCcw size={14} aria-hidden />
        <span className="hud-button__label">RESET</span>
      </button>

      <button
        type="button"
        className="hud-button hud-button--primary"
        aria-label={running ? 'Pause' : 'Start'}
        aria-pressed={running}
        onClick={onToggle}
      >
        {running ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
        <span className="hud-button__label">{running ? 'PAUSE DIVE' : 'INITIATE DIVE'}</span>
      </button>

      <button
        type="button"
        className="hud-button hud-button--secondary"
        aria-label="Skip phase"
        onClick={onSkip}
      >
        <SkipForward size={14} aria-hidden />
        <span className="hud-button__label">SKIP</span>
      </button>
    </div>
  );
}
