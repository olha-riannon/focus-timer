import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Theme } from '../tokens/theme.ts';
import type { Phase } from './TimerRing.tsx';
import './SettingsDrawer.css';

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
const STEPPER_BLINK_EASE = [0.65, 0, 0.35, 1] as const;

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  phase?: Phase;
  notch?: 'left' | 'right' | 'all';
  padded?: boolean;
  ariaLabel: string;
  onChange: (next: number) => void;
}

function NumberStepper({ value, min, max, step, phase, notch, padded = true, ariaLabel, onChange }: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const atMin = value <= min;
  const atMax = value >= max;
  const display = padded ? value.toString().padStart(2, '0') : value.toString();

  const commit = () => {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      if (clamped !== value) onChange(clamped);
    }
    setDraft(null);
  };

  const decrement = () => {
    setAnimKey((k) => k + 1);
    onChange(Math.max(min, value - step));
  };

  const increment = () => {
    setAnimKey((k) => k + 1);
    onChange(Math.min(max, value + step));
  };

  return (
    <div className="number-stepper" data-phase={phase} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="number-stepper__btn"
        disabled={atMin}
        onClick={decrement}
        aria-label={`Decrease ${ariaLabel}`}
      >
        &lt;
      </button>
      <div className="number-stepper__display" data-notch={notch}>
        <input
          type="text"
          inputMode="numeric"
          className="number-stepper__digits"
          value={draft ?? display}
          onFocus={(e) => {
            setDraft(value.toString());
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit();
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
          aria-label={ariaLabel}
        />
        <div className="number-stepper__digits-overlay" aria-hidden>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={animKey}
              initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
              transition={{ duration: 0.34, ease: STEPPER_BLINK_EASE }}
            >
              {display}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <button
        type="button"
        className="number-stepper__btn"
        disabled={atMax}
        onClick={increment}
        aria-label={`Increase ${ariaLabel}`}
      >
        &gt;
      </button>
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
            transition={{ duration: 0.5 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="settings-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.65, ease: DRAWER_EASE }}
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
                <div className="settings-group__steppers">
                  <NumberStepper
                    value={settings.workMin}
                    min={0}
                    max={60}
                    step={1}
                    phase="work"
                    notch="left"
                    ariaLabel="Deep dive minutes"
                    onChange={(workMin) => onSettingsChange({ workMin })}
                  />
                  <span className="settings-group__separator" aria-hidden>:</span>
                  <NumberStepper
                    value={settings.workSec}
                    min={0}
                    max={59}
                    step={1}
                    phase="work"
                    notch="right"
                    ariaLabel="Deep dive seconds"
                    onChange={(workSec) => onSettingsChange({ workSec })}
                  />
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-group__label">BUFFER FLUSH</span>
                <div className="settings-group__steppers">
                  <NumberStepper
                    value={settings.shortMin}
                    min={0}
                    max={60}
                    step={1}
                    phase="short-break"
                    notch="left"
                    ariaLabel="Buffer flush minutes"
                    onChange={(shortMin) => onSettingsChange({ shortMin })}
                  />
                  <span className="settings-group__separator" aria-hidden>:</span>
                  <NumberStepper
                    value={settings.shortSec}
                    min={0}
                    max={59}
                    step={1}
                    phase="short-break"
                    notch="right"
                    ariaLabel="Buffer flush seconds"
                    onChange={(shortSec) => onSettingsChange({ shortSec })}
                  />
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-group__label">COLD CYCLE</span>
                <div className="settings-group__steppers">
                  <NumberStepper
                    value={settings.longMin}
                    min={0}
                    max={60}
                    step={1}
                    phase="long-break"
                    notch="left"
                    ariaLabel="Cold cycle minutes"
                    onChange={(longMin) => onSettingsChange({ longMin })}
                  />
                  <span className="settings-group__separator" aria-hidden>:</span>
                  <NumberStepper
                    value={settings.longSec}
                    min={0}
                    max={59}
                    step={1}
                    phase="long-break"
                    notch="right"
                    ariaLabel="Cold cycle seconds"
                    onChange={(longSec) => onSettingsChange({ longSec })}
                  />
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-group__label">SESSIONS PER CYCLE</span>
                <NumberStepper
                  value={settings.sessionsPerCycle}
                  min={2}
                  max={8}
                  step={1}
                  notch="all"
                  padded={false}
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
