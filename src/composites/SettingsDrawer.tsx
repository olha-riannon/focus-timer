import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Theme } from '../tokens/theme.ts';
import type { Phase } from './TimerRing.tsx';
import './SettingsDrawer.css';

export interface Settings {
  workMin: number;
  shortMin: number;
  longMin: number;
  sessionsPerCycle: number;
  soundEnabled: boolean;
}

interface SettingsDrawerProps {
  open: boolean;
  settings: Settings;
  theme: Theme;
  onClose: () => void;
  onSettingsChange: (partial: Partial<Settings>) => void;
  onThemeChange: (next: Theme) => void;
}

const themes: Theme[] = ['light', 'dark', 'system'];

const DRAWER_EASE = [0.16, 1, 0.3, 1] as const;

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  phase?: Phase;
  ariaLabel: string;
  onChange: (next: number) => void;
}

function NumberStepper({ value, min, max, step, unit, phase, ariaLabel, onChange }: NumberStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div className="number-stepper" data-phase={phase} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="number-stepper__btn"
        disabled={atMin}
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label={`Decrease ${ariaLabel}`}
      >
        &lt;
      </button>
      <span className="number-stepper__digits">{value.toString().padStart(2, '0')}</span>
      <button
        type="button"
        className="number-stepper__btn"
        disabled={atMax}
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label={`Increase ${ariaLabel}`}
      >
        &gt;
      </button>
      <span className="number-stepper__unit" aria-hidden={!unit}>
        {unit ?? ''}
      </span>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  ariaLabel: string;
  onChange: (next: boolean) => void;
}

function Toggle({ checked, ariaLabel, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="settings-toggle"
      data-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

export function SettingsDrawer({
  open,
  settings,
  theme,
  onClose,
  onSettingsChange,
  onThemeChange,
}: SettingsDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="settings-drawer__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="settings-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: DRAWER_EASE }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-drawer-title"
          >
            <header className="settings-drawer__header">
              <div className="settings-drawer__tag">
                <h2 id="settings-drawer-title" className="settings-drawer__title">
                  PARAMETERS
                </h2>
              </div>
              <button
                type="button"
                className="settings-drawer__close"
                onClick={onClose}
                aria-label="Close settings"
              >
                <X size={14} aria-hidden />
              </button>
            </header>

            <div className="settings-drawer__body">
              <div className="settings-group">
                <span className="settings-group__label">DEEP DIVE</span>
                <NumberStepper
                  value={settings.workMin}
                  min={5}
                  max={60}
                  step={5}
                  unit="min"
                  phase="work"
                  ariaLabel="Deep dive duration"
                  onChange={(workMin) => onSettingsChange({ workMin })}
                />
              </div>

              <div className="settings-group">
                <span className="settings-group__label">BUFFER FLUSH</span>
                <NumberStepper
                  value={settings.shortMin}
                  min={1}
                  max={15}
                  step={1}
                  unit="min"
                  phase="short-break"
                  ariaLabel="Buffer flush duration"
                  onChange={(shortMin) => onSettingsChange({ shortMin })}
                />
              </div>

              <div className="settings-group">
                <span className="settings-group__label">COLD CYCLE</span>
                <NumberStepper
                  value={settings.longMin}
                  min={5}
                  max={45}
                  step={5}
                  unit="min"
                  phase="long-break"
                  ariaLabel="Cold cycle duration"
                  onChange={(longMin) => onSettingsChange({ longMin })}
                />
              </div>

              <div className="settings-group">
                <span className="settings-group__label">SESSIONS PER CYCLE</span>
                <NumberStepper
                  value={settings.sessionsPerCycle}
                  min={2}
                  max={8}
                  step={1}
                  ariaLabel="Sessions per cycle"
                  onChange={(sessionsPerCycle) => onSettingsChange({ sessionsPerCycle })}
                />
              </div>

              <div className="settings-group settings-group--inline">
                <span className="settings-group__label">SOUND</span>
                <Toggle
                  checked={settings.soundEnabled}
                  ariaLabel="Sound notifications"
                  onChange={(soundEnabled) => onSettingsChange({ soundEnabled })}
                />
              </div>

              <div className="settings-group">
                <span className="settings-group__label">INTERFACE</span>
                <div className="settings-drawer__theme-switch" role="group" aria-label="Theme">
                  {themes.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="hud-pill"
                      data-active={value === theme}
                      aria-pressed={value === theme}
                      onClick={() => onThemeChange(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className="settings-drawer__footer">
              <span className="settings-drawer__hint">ESC · close</span>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
