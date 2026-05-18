import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { TimerRing, type Phase } from './composites/TimerRing.tsx';
import { TimerControls } from './composites/TimerControls.tsx';
import { SettingsDrawer, type Settings } from './composites/SettingsDrawer.tsx';
import { applyTheme, storeTheme, getStoredTheme, type Theme } from './tokens/theme.ts';
import './App.css';

const phases: Phase[] = ['work', 'short-break', 'long-break'];

const phaseLabel: Record<Phase, string> = {
  work: 'deep dive',
  'short-break': 'buffer flush',
  'long-break': 'cold cycle',
};

const nextPhase = (current: Phase): Phase => {
  if (current === 'work') return 'short-break';
  if (current === 'short-break') return 'long-break';
  return 'work';
};

const defaultSettings: Settings = {
  workMin: 25,
  shortMin: 5,
  longMin: 15,
  sessionsPerCycle: 4,
  soundEnabled: true,
};

type LinkStatus = 'stable' | 'excellent' | 'degraded' | 'calibrating';

const linkStatusOrder: LinkStatus[] = ['stable', 'excellent', 'degraded', 'calibrating'];

const linkStatusLabel: Record<LinkStatus, string> = {
  stable: 'UPLINK STABLE',
  excellent: 'UPLINK EXCELLENT',
  degraded: 'UPLINK DEGRADED',
  calibrating: 'UPLINK CALIBRATING',
};

const signalLevelByStatus: Record<LinkStatus, number> = {
  stable: 4,
  excellent: 5,
  degraded: 2,
  calibrating: 3,
};

const cycleLinkStatus = (current: LinkStatus): LinkStatus => {
  const i = linkStatusOrder.indexOf(current);
  return linkStatusOrder[(i + 1) % linkStatusOrder.length] ?? 'stable';
};

interface SessionLogEntry {
  id: number;
  phase: Phase;
  duration: number;
  completedAt: string;
}

const eventVerbByPhase: Record<Phase, string> = {
  work: 'deep dive complete',
  'short-break': 'buffer flush complete',
  'long-break': 'cold cycle complete',
};

const phaseShortLabel: Record<Phase, string> = {
  work: 'DIVE',
  'short-break': 'FLUSH',
  'long-break': 'CYCLE',
};

const sampleSessionLog: SessionLogEntry[] = [
  { id: 1, phase: 'work', duration: 25 * 60, completedAt: '14:32' },
  { id: 2, phase: 'short-break', duration: 5 * 60, completedAt: '14:37' },
  { id: 3, phase: 'work', duration: 25 * 60, completedAt: '15:02' },
];

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatDailyDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
    : `${minutes}m`;
};

const randomHex4 = (): string =>
  Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');

const randomPing = (): number => 8 + Math.floor(Math.random() * 30);

const LOG_ENTER_EXIT_EASE = [0.16, 1, 0.3, 1] as const;

const VERSION_CLICK_WINDOW_MS = 700;
const VERSION_DEFAULT_LABEL = 'v2.0.77';
const VERSION_EASTER_LABEL = 'never fade away';
const VERSION_SWAP_MS = 500;
const VERSION_TOTAL_MS = 1000;
const VERSION_TRANSITION_S = 0.25;

function SignalBars({ level }: { level: number }) {
  return (
    <span className="hud-signal" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="hud-signal__bar"
          data-active={i <= level}
          style={{ height: `${4 + i * 2}px` }}
        />
      ))}
    </span>
  );
}

function CycleDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="cycle-dots" role="group" aria-label={`Cycle ${current} of ${total}`}>
      <span className="cycle-dots__bracket" aria-hidden>[</span>
      <span className="cycle-dots__label">CYCLE</span>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const state = idx < current ? 'done' : idx === current ? 'active' : 'pending';
        return (
          <span
            key={idx}
            className="cycle-dot"
            data-state={state}
            aria-label={`Session ${idx}`}
            title={`Session ${idx}`}
          />
        );
      })}
      <span className="cycle-dots__bracket" aria-hidden>]</span>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [phase, setPhase] = useState<Phase>('work');
  const [running, setRunning] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('stable');

  const [subnetHex, setSubnetHex] = useState('A7B3');
  const [bufferHex, setBufferHex] = useState('3F2C');
  const [pingMs, setPingMs] = useState(12);

  const [subnetFlicker, setSubnetFlicker] = useState(false);
  const [bufferFlicker, setBufferFlicker] = useState(false);
  const [pingFlicker, setPingFlicker] = useState(false);

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [sessionLog] = useState<SessionLogEntry[]>(sampleSessionLog);

  const totalsByPhase: Record<Phase, number> = {
    work: settings.workMin * 60,
    'short-break': settings.shortMin * 60,
    'long-break': settings.longMin * 60,
  };
  const total = totalsByPhase[phase];
  const remaining = total;

  const workSessions = sessionLog.filter((s) => s.phase === 'work');
  const focusedSeconds = workSessions.reduce((sum, s) => sum + s.duration, 0);

  const handleTheme = (next: Theme) => {
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  const handleSettingsChange = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const triggerGlitch = () => {
    if (glitching) return;
    setGlitching(true);
  };

  const [versionText, setVersionText] = useState(VERSION_DEFAULT_LABEL);
  const [versionShaking, setVersionShaking] = useState(false);
  const versionClickCountRef = useRef(0);
  const versionClickTimerRef = useRef<number | undefined>(undefined);
  const versionPlayingRef = useRef(false);

  const triggerNeverFade = () => {
    if (versionPlayingRef.current) return;
    versionPlayingRef.current = true;
    setVersionText(VERSION_EASTER_LABEL);
    setVersionShaking(true);
    window.setTimeout(() => {
      setVersionText(VERSION_DEFAULT_LABEL);
    }, VERSION_SWAP_MS);
    window.setTimeout(() => {
      versionPlayingRef.current = false;
      setVersionShaking(false);
    }, VERSION_TOTAL_MS);
  };

  const handleVersionClick = () => {
    versionClickCountRef.current += 1;
    if (versionClickTimerRef.current !== undefined) {
      window.clearTimeout(versionClickTimerRef.current);
    }
    versionClickTimerRef.current = window.setTimeout(() => {
      versionClickCountRef.current = 0;
    }, VERSION_CLICK_WINDOW_MS);

    if (versionClickCountRef.current >= 3) {
      versionClickCountRef.current = 0;
      window.clearTimeout(versionClickTimerRef.current);
      versionClickTimerRef.current = undefined;
      triggerNeverFade();
    }
  };

  const handleLinkClick = () => {
    setLinkStatus((current) => cycleLinkStatus(current));
  };

  const randomizeSubnet = () => {
    setSubnetHex(randomHex4());
    setSubnetFlicker(true);
  };

  const randomizeBuffer = () => {
    setBufferHex(randomHex4());
    setBufferFlicker(true);
  };

  const randomizePing = () => {
    setPingMs(randomPing());
    setPingFlicker(true);
  };

  return (
    <>
      <main className="shell">
        <header className="shell__hud-top">
          <div className="hud-cluster">
            <button
              type="button"
              className={`hud-brand${glitching ? ' hud-brand--glitch' : ''}`}
              onClick={triggerGlitch}
              onAnimationEnd={() => setGlitching(false)}
              aria-label="Trigger glitch"
            >
              [ PIBOX ]
            </button>
            <span className="hud-divider" aria-hidden>/</span>
            <span className="hud-meta">NETRUN_DIVE</span>
            <span className="hud-divider" aria-hidden>·</span>
            <button
              type="button"
              className={`hud-meta hud-meta--dim hud-version${versionShaking ? ' hud-version--shaking' : ''}`}
              onClick={handleVersionClick}
              aria-label="App version"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={versionText}
                  className="hud-version__text"
                  initial={{ opacity: 0, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(6px)' }}
                  transition={{ duration: VERSION_TRANSITION_S, ease: [0.16, 1, 0.3, 1] }}
                >
                  {versionText}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          <div className="hud-cluster hud-cluster--right">
            <span className="hud-meta">SUBNET</span>
            <button
              type="button"
              className="hud-value"
              data-clickable="true"
              data-flicker={subnetFlicker}
              onClick={randomizeSubnet}
              onAnimationEnd={() => setSubnetFlicker(false)}
              aria-label="Regenerate subnet identifier"
            >
              0x{subnetHex}
            </button>
            <span className="hud-divider" aria-hidden>·</span>
            <span className="hud-meta">SIGNAL</span>
            <SignalBars level={signalLevelByStatus[linkStatus]} />
            <span className="hud-divider" aria-hidden>·</span>
            <button
              type="button"
              className="hud-status"
              data-status={linkStatus}
              onClick={handleLinkClick}
              aria-label="Cycle uplink status"
            >
              {linkStatusLabel[linkStatus]}
            </button>
            <span className="hud-divider" aria-hidden>·</span>
            <button
              type="button"
              className="hud-icon-button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open settings"
            >
              <SettingsIcon size={14} aria-hidden />
            </button>
          </div>
        </header>

        <section className="shell__stage">
          <span className="hud-corner hud-corner--tl" aria-hidden />
          <span className="hud-corner hud-corner--tr" aria-hidden />
          <span className="hud-corner hud-corner--bl" aria-hidden />
          <span className="hud-corner hud-corner--br" aria-hidden />

          <div className="hud-annotation hud-annotation--top-left">
            <span className="hud-annotation__bracket" aria-hidden>▸</span>
            <span className="hud-annotation__label">PHASE</span>
            <span className="hud-annotation__value-slot">
              <AnimatePresence initial={false}>
                <motion.span
                  key={phase}
                  className="hud-annotation__value"
                  data-phase={phase}
                  initial={{ x: -14, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 14, opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                >
                  {phaseLabel[phase].toUpperCase()}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <div className="hud-annotation hud-annotation--top-right">
            <span className="hud-annotation__label">CYCLE</span>
            <span className="hud-annotation__value">
              02 / {settings.sessionsPerCycle.toString().padStart(2, '0')}
            </span>
            <span className="hud-annotation__bracket" aria-hidden>◂</span>
          </div>
          <div className="hud-annotation hud-annotation--bottom-left">
            <span className="hud-annotation__bracket" aria-hidden>▸</span>
            <span className="hud-annotation__label">BUFFER</span>
            <button
              type="button"
              className="hud-annotation__value"
              data-clickable="true"
              data-flicker={bufferFlicker}
              onClick={randomizeBuffer}
              onAnimationEnd={() => setBufferFlicker(false)}
              aria-label="Regenerate buffer reference"
            >
              0x{bufferHex}
            </button>
          </div>
          <div className="hud-annotation hud-annotation--bottom-right">
            <span className="hud-annotation__label">PING</span>
            <button
              type="button"
              className="hud-annotation__value"
              data-clickable="true"
              data-flicker={pingFlicker}
              onClick={randomizePing}
              onAnimationEnd={() => setPingFlicker(false)}
              aria-label="Ping subnet"
            >
              {pingMs} ms
            </button>
            <span className="hud-annotation__bracket" aria-hidden>◂</span>
          </div>

          <TimerRing
            phase={phase}
            remainingSeconds={remaining}
            totalSeconds={total}
            sessionIndex={2}
            sessionsPerCycle={settings.sessionsPerCycle}
          />

          <TimerControls
            running={running}
            onToggle={() => setRunning((v) => !v)}
            onReset={() => setRunning(false)}
            onSkip={() => setPhase(nextPhase)}
          />

          <CycleDots current={2} total={settings.sessionsPerCycle} />

          <div className="shell__phase-switch" role="group" aria-label="Phase preview">
            {phases.map((value) => {
              const isActive = value === phase;
              return (
                <button
                  key={value}
                  type="button"
                  className="hud-pill"
                  data-phase={value}
                  data-active={isActive}
                  aria-pressed={isActive}
                  onClick={() => setPhase(value)}
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
                  <span className="hud-pill__label">{phaseLabel[value]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="shell__hud-bottom">
          <div className="hud-log" role="log" aria-label="Session history">
            <AnimatePresence initial mode="popLayout">
              {sessionLog.map((entry, i) => {
                const isLast = i === sessionLog.length - 1;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                    transition={{ duration: 0.42, ease: LOG_ENTER_EXIT_EASE }}
                    className={`hud-log__row${isLast ? ' hud-log__row--active' : ''}`}
                  >
                    <span className="hud-log__prefix" aria-hidden>&gt;</span>
                    <span className="hud-log__event">{eventVerbByPhase[entry.phase]}</span>
                    <span className="hud-log__duration">{formatDuration(entry.duration)}</span>
                    <span className="hud-log__phase" data-phase={entry.phase}>
                      {phaseShortLabel[entry.phase]}
                    </span>
                    <span className="hud-log__time">{entry.completedAt}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="hud-stats" aria-label="Today's focus stats">
            <span className="hud-stats__bracket" aria-hidden>[</span>
            <span className="hud-stats__label">TODAY</span>
            <span className="hud-stats__bracket" aria-hidden>]</span>
            <span className="hud-stats__divider" aria-hidden>·</span>
            <span className="hud-stats__value">{workSessions.length.toString().padStart(2, '0')}</span>
            <span className="hud-stats__label">dives</span>
            <span className="hud-stats__divider" aria-hidden>·</span>
            <span className="hud-stats__value">{formatDailyDuration(focusedSeconds)}</span>
            <span className="hud-stats__label">focused</span>
          </div>
        </footer>
      </main>
      <SettingsDrawer
        open={drawerOpen}
        settings={settings}
        theme={theme}
        onClose={() => setDrawerOpen(false)}
        onSettingsChange={handleSettingsChange}
        onThemeChange={handleTheme}
      />
    </>
  );
}

export default App;
