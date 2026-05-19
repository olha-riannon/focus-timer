import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Theme } from '../tokens/theme.ts';
import type { Phase } from './TimerPanel.tsx';
import type { Settings } from '../store/timerStore.ts';
import './SettingsDrawer.css';

export type { Settings };

interface SettingsDrawerProps {
  open: boolean;
  settings: Settings;
  theme: Theme;
  onClose: () => void;
  onSettingsChange: (partial: Partial<Settings>) => void;
  onThemeChange: (next: Theme) => void;
  onPhaseFocus?: (phase: Phase) => void;
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
  onActivate?: () => void;
  onOverflow?: () => void;
  onUnderflow?: () => void;
  incrementDisabled?: boolean;
  decrementDisabled?: boolean;
  animTrigger?: number;
}

function NumberStepper({
  value,
  min,
  max,
  step,
  phase,
  notch,
  padded = true,
  ariaLabel,
  onChange,
  onActivate,
  onOverflow,
  onUnderflow,
  incrementDisabled,
  decrementDisabled,
  animTrigger,
}: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const animTriggerFirstRef = useRef(true);

  useEffect(() => {
    if (animTriggerFirstRef.current) {
      animTriggerFirstRef.current = false;
      return;
    }
    setAnimKey((k) => k + 1);
  }, [animTrigger]);
  const atMin = value <= min;
  const atMax = value >= max;
  const decDisabled = decrementDisabled ?? (atMin && !onUnderflow);
  const incDisabled = incrementDisabled ?? (atMax && !onOverflow);
  const display = padded ? value.toString().padStart(2, '0') : value.toString();

  const commit = () => {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      if (clamped !== value) {
        onActivate?.();
        onChange(clamped);
      }
    }
    setDraft(null);
  };

  const decrement = () => {
    if (decDisabled) return;
    setAnimKey((k) => k + 1);
    onActivate?.();
    if (atMin) {
      onUnderflow?.();
    } else {
      onChange(Math.max(min, value - step));
    }
  };

  const increment = () => {
    if (incDisabled) return;
    setAnimKey((k) => k + 1);
    onActivate?.();
    if (atMax) {
      onOverflow?.();
    } else {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className="number-stepper" data-phase={phase} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="number-stepper__btn"
        disabled={decDisabled}
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
        disabled={incDisabled}
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
  onPhaseFocus,
}: SettingsDrawerProps) {
  const [minAnimTriggers, setMinAnimTriggers] = useState({
    workMin: 0,
    shortMin: 0,
    longMin: 0,
  });

  const cascadeSec = (
    delta: 1 | -1,
    minKey: 'workMin' | 'shortMin' | 'longMin',
    secKey: 'workSec' | 'shortSec' | 'longSec',
  ) => {
    const currentMin = settings[minKey];
    if (delta === 1 && currentMin < 60) {
      onSettingsChange({ [minKey]: currentMin + 1, [secKey]: 0 });
      setMinAnimTriggers((a) => ({ ...a, [minKey]: a[minKey] + 1 }));
    } else if (delta === -1 && currentMin > 0) {
      onSettingsChange({ [minKey]: currentMin - 1, [secKey]: 59 });
      setMinAnimTriggers((a) => ({ ...a, [minKey]: a[minKey] + 1 }));
    }
  };

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
                    onChange={(workMin) =>
                      onSettingsChange(workMin >= 60 ? { workMin, workSec: 0 } : { workMin })
                    }
                    onActivate={() => onPhaseFocus?.('work')}
                    animTrigger={minAnimTriggers.workMin}
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
                    onChange={(workSec) =>
                      onSettingsChange({ workSec: settings.workMin >= 60 ? 0 : workSec })
                    }
                    incrementDisabled={settings.workMin >= 60}
                    onActivate={() => onPhaseFocus?.('work')}
                    onOverflow={() => cascadeSec(1, 'workMin', 'workSec')}
                    onUnderflow={() => cascadeSec(-1, 'workMin', 'workSec')}
                  />
                  <span className="settings-group__caption" aria-hidden>min</span>
                  <span className="settings-group__caption settings-group__caption--gap" aria-hidden />
                  <span className="settings-group__caption" aria-hidden>sec</span>
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
                    onChange={(shortMin) =>
                      onSettingsChange(shortMin >= 60 ? { shortMin, shortSec: 0 } : { shortMin })
                    }
                    onActivate={() => onPhaseFocus?.('short-break')}
                    animTrigger={minAnimTriggers.shortMin}
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
                    onChange={(shortSec) =>
                      onSettingsChange({ shortSec: settings.shortMin >= 60 ? 0 : shortSec })
                    }
                    incrementDisabled={settings.shortMin >= 60}
                    onActivate={() => onPhaseFocus?.('short-break')}
                    onOverflow={() => cascadeSec(1, 'shortMin', 'shortSec')}
                    onUnderflow={() => cascadeSec(-1, 'shortMin', 'shortSec')}
                  />
                  <span className="settings-group__caption" aria-hidden>min</span>
                  <span className="settings-group__caption settings-group__caption--gap" aria-hidden />
                  <span className="settings-group__caption" aria-hidden>sec</span>
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
                    onChange={(longMin) =>
                      onSettingsChange(longMin >= 60 ? { longMin, longSec: 0 } : { longMin })
                    }
                    onActivate={() => onPhaseFocus?.('long-break')}
                    animTrigger={minAnimTriggers.longMin}
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
                    onChange={(longSec) =>
                      onSettingsChange({ longSec: settings.longMin >= 60 ? 0 : longSec })
                    }
                    incrementDisabled={settings.longMin >= 60}
                    onActivate={() => onPhaseFocus?.('long-break')}
                    onOverflow={() => cascadeSec(1, 'longMin', 'longSec')}
                    onUnderflow={() => cascadeSec(-1, 'longMin', 'longSec')}
                  />
                  <span className="settings-group__caption" aria-hidden>min</span>
                  <span className="settings-group__caption settings-group__caption--gap" aria-hidden />
                  <span className="settings-group__caption" aria-hidden>sec</span>
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-group__label">SESSIONS</span>
                <div className="settings-group__sessions">
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
                  <span className="settings-group__caption" aria-hidden>cycle</span>
                </div>
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
                  {themes.map((value) => {
                    const isActive = value === theme;
                    return (
                      <button
                        key={value}
                        type="button"
                        className="hud-pill"
                        data-active={isActive}
                        aria-pressed={isActive}
                        onClick={() => onThemeChange(value)}
                      >
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              className="hud-pill__active-bg"
                              initial={{ y: 14, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 14, opacity: 0 }}
                              transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
                              aria-hidden
                            />
                          )}
                        </AnimatePresence>
                        <span className="hud-pill__label">{value}</span>
                      </button>
                    );
                  })}
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
