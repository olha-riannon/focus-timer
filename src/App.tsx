import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { TimerPanel, type Phase } from './composites/TimerPanel.tsx';
import { TimerControls } from './composites/TimerControls.tsx';
import { SettingsDrawer } from './composites/SettingsDrawer.tsx';
import { useTimerStore } from './store/timerStore.ts';
import { applyTheme, storeTheme, getStoredTheme, type Theme } from './tokens/theme.ts';
import './App.css';

const phases: Phase[] = ['work', 'short-break', 'long-break'];

const phaseLabel: Record<Phase, string> = {
  work: 'deep dive',
  'short-break': 'buffer flush',
  'long-break': 'cold cycle',
};

type LinkStatus = 'excellent' | 'stable' | 'degraded' | 'critical';

const linkStatusPool: LinkStatus[] = ['excellent', 'stable', 'degraded', 'critical'];

const linkStatusLabel: Record<LinkStatus, string> = {
  excellent: 'UPLINK EXCELLENT',
  stable: 'UPLINK STABLE',
  degraded: 'UPLINK DEGRADED',
  critical: 'UPLINK CRITICAL',
};

const signalLevelByStatus: Record<LinkStatus, number> = {
  excellent: 5,
  stable: 4,
  degraded: 2,
  critical: 1,
};

const linkStatusTag: Record<LinkStatus, string> = {
  excellent: 'EXCL',
  stable: 'STBL',
  degraded: 'DEGR',
  critical: 'CRIT',
};

const pickNextLinkStatus = (current: LinkStatus): LinkStatus => {
  const others = linkStatusPool.filter((s) => s !== current);
  return others[Math.floor(Math.random() * others.length)] ?? current;
};

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

const formatHHMMSS = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface ConsoleRow {
  id: number;
  event: string;
  meta: string;
  tag: string;
  tagColor: 'default' | 'excellent' | 'stable' | 'degraded' | 'critical';
  time: string;
}

interface SystemTemplate {
  event: string;
  meta: () => string;
  tag: string;
  tagColor: ConsoleRow['tagColor'];
}

const SYSTEM_TEMPLATES: SystemTemplate[] = [
  { event: 'packet trace', meta: () => `0x${randomHex4()}`, tag: 'OK', tagColor: 'default'},
  { event: 'memory scan', meta: () => 'no anomalies', tag: 'OK', tagColor: 'default'},
  { event: 'ping subnet', meta: () => `${randomPing()} ms`, tag: 'INFO', tagColor: 'default'},
  { event: 'buffer flush', meta: () => `0x${randomHex4()}`, tag: 'OK', tagColor: 'default'},
  { event: 'core load', meta: () => `${30 + Math.floor(Math.random() * 60)}%`, tag: 'INFO', tagColor: 'default'},
  { event: 'neural bandwidth', meta: () => `${70 + Math.floor(Math.random() * 30)}%`, tag: 'INFO', tagColor: 'default'},
  { event: 'auth refresh', meta: () => 'token cycled', tag: 'OK', tagColor: 'default'},
  { event: 'thermal read', meta: () => `${38 + Math.floor(Math.random() * 8)} C`, tag: 'INFO', tagColor: 'default'},
  { event: 'ice signature', meta: () => 'clean', tag: 'OK', tagColor: 'default'},
  { event: 'sync protocol', meta: () => 'stable', tag: 'OK', tagColor: 'default'},
  { event: 'decrypt shard', meta: () => `0x${randomHex4()}`, tag: 'OK', tagColor: 'default'},
  { event: 'node discovery', meta: () => `0x${randomHex4()}`, tag: 'INFO', tagColor: 'default'},
  { event: 'vpn tunnel', meta: () => 'encrypted', tag: 'OK', tagColor: 'default'},
  { event: 'subnet scan', meta: () => `${4 + Math.floor(Math.random() * 12)} hosts`, tag: 'INFO', tagColor: 'default'},
  { event: 'process kill', meta: () => `pid ${1000 + Math.floor(Math.random() * 8999)}`, tag: 'OK', tagColor: 'default'},
  { event: 'cache purge', meta: () => `${10 + Math.floor(Math.random() * 90)} kb`, tag: 'OK', tagColor: 'default'},
];

let nextConsoleId = 1;

function makeSystemRow(): ConsoleRow {
  const tpl = SYSTEM_TEMPLATES[Math.floor(Math.random() * SYSTEM_TEMPLATES.length)]!;
  return {
    id: nextConsoleId++,
    event: tpl.event,
    meta: tpl.meta(),
    tag: tpl.tag,
    tagColor: tpl.tagColor,
    time: formatHHMMSS(new Date()),
  };
}

function makeBootRows(): ConsoleRow[] {
  const now = new Date();
  const t = formatHHMMSS(now);
  return [
    { id: nextConsoleId++, event: 'kernel boot', meta: '4 modules', tag: 'OK', tagColor: 'default', time: t },
    { id: nextConsoleId++, event: 'uplink handshake', meta: `0x${randomHex4()}`, tag: 'STABLE', tagColor: 'default', time: t },
    { id: nextConsoleId++, event: 'ice signature', meta: 'clean', tag: 'OK', tagColor: 'default', time: t },
    { id: nextConsoleId++, event: 'core load', meta: '47%', tag: 'INFO', tagColor: 'default', time: t },
    { id: nextConsoleId++, event: 'neural bandwidth', meta: '89%', tag: 'INFO', tagColor: 'default', time: t },
  ];
}

const VERSION_CLICK_WINDOW_MS = 700;
const VERSION_DEFAULT_LABEL = 'v2.0.77';
const VERSION_EASTER_LABEL = 'never fade away';
const VERSION_SWAP_MS = 500;
const VERSION_TOTAL_MS = 1000;
const VERSION_TRANSITION_S = 0.25;

function SignalBars({ level, status }: { level: number; status: LinkStatus }) {
  return (
    <span className="hud-signal" data-status={status} aria-hidden>
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

function CycleDots({ current, total, phase }: { current: number; total: number; phase: Phase }) {
  const isWorking = phase === 'work';
  return (
    <div className="cycle-dots" role="group" aria-label={`Cycle ${current} of ${total}`}>
      <span className="cycle-dots__bracket" aria-hidden>[</span>
      <span className="cycle-dots__label">CYCLE</span>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const state =
          idx < current ? 'done' : idx === current && isWorking ? 'active' : 'pending';
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
  const [glitching, setGlitching] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('stable');

  const [subnetHex, setSubnetHex] = useState('A7B3');
  const [bufferHex, setBufferHex] = useState('3F2C');
  const [pingMs, setPingMs] = useState(12);

  const [subnetFlicker, setSubnetFlicker] = useState(false);
  const [bufferFlicker, setBufferFlicker] = useState(false);
  const [pingFlicker, setPingFlicker] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const phase = useTimerStore((s) => s.phase);
  const running = useTimerStore((s) => s.running);
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds);
  const sessionIndex = useTimerStore((s) => s.sessionIndex);
  const sessionLog = useTimerStore((s) => s.sessionLog);
  const settings = useTimerStore((s) => s.settings);
  const toggle = useTimerStore((s) => s.toggle);
  const reset = useTimerStore((s) => s.reset);
  const skip = useTimerStore((s) => s.skip);
  const setPhase = useTimerStore((s) => s.setPhase);
  const setSettings = useTimerStore((s) => s.setSettings);

  const total =
    phase === 'work'
      ? settings.workMin * 60 + settings.workSec
      : phase === 'short-break'
        ? settings.shortMin * 60 + settings.shortSec
        : settings.longMin * 60 + settings.longSec;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      useTimerStore.getState().tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const [terminalFeed, setTerminalFeed] = useState<ConsoleRow[]>(() => makeBootRows());
  const lastLogLenRef = useRef(0);

  useEffect(() => {
    let timeoutId: number | undefined;
    const scheduleNext = () => {
      const delay = 1500 + Math.random() * 3500;
      timeoutId = window.setTimeout(() => {
        setTerminalFeed((feed) => [...feed, makeSystemRow()].slice(-30));
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  const lastLinkStatusRef = useRef(linkStatus);
  useEffect(() => {
    const id = window.setInterval(() => {
      setLinkStatus((current) => pickNextLinkStatus(current));
    }, 10_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (lastLinkStatusRef.current === linkStatus) return;
    lastLinkStatusRef.current = linkStatus;
    setTerminalFeed((feed) =>
      [
        ...feed,
        {
          id: nextConsoleId++,
          event: 'uplink status',
          meta: linkStatusLabel[linkStatus].replace('UPLINK ', '').toLowerCase(),
          tag: linkStatusTag[linkStatus],
          tagColor: linkStatus,
          time: formatHHMMSS(new Date()),
        },
      ].slice(-30),
    );
  }, [linkStatus]);

  useEffect(() => {
    if (sessionLog.length > lastLogLenRef.current) {
      const newEntries = sessionLog.slice(lastLogLenRef.current);
      setTerminalFeed((feed) =>
        [
          ...feed,
          ...newEntries.map<ConsoleRow>((entry) => ({
            id: nextConsoleId++,
            event: eventVerbByPhase[entry.phase],
            meta: formatDuration(entry.duration),
            tag: phaseShortLabel[entry.phase],
            tagColor: 'default',
            time: entry.completedAt,
          })),
        ].slice(-30),
      );
    }
    lastLogLenRef.current = sessionLog.length;
  }, [sessionLog]);

  const visibleRows = terminalFeed.slice(-5);

  const workSessions = sessionLog.filter((s) => s.phase === 'work');
  const focusedSeconds = workSessions.reduce((sum, s) => sum + s.duration, 0);

  const handleTheme = (next: Theme) => {
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
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
          <div className="hud-cluster-shell hud-cluster-shell--right">
            <div className="hud-cluster-shell__slot">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={linkStatus}
                  className="hud-cluster hud-cluster--right"
                  initial={{ x: 16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -16, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
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
                  <SignalBars level={signalLevelByStatus[linkStatus]} status={linkStatus} />
                  <span className="hud-divider" aria-hidden>·</span>
                  <span
                    className="hud-status"
                    data-status={linkStatus}
                    aria-label={linkStatusLabel[linkStatus]}
                    aria-live="polite"
                  >
                    <span className="hud-status__label">{linkStatusLabel[linkStatus]}</span>
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
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
              {Math.min(sessionIndex, settings.sessionsPerCycle).toString().padStart(2, '0')} /{' '}
              {settings.sessionsPerCycle.toString().padStart(2, '0')}
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

          <TimerPanel
            phase={phase}
            remainingSeconds={remainingSeconds}
            totalSeconds={total}
            sessionIndex={sessionIndex}
            sessionsPerCycle={settings.sessionsPerCycle}
          />

          <TimerControls
            running={running}
            onToggle={toggle}
            onReset={reset}
            onSkip={skip}
          />

          <CycleDots current={sessionIndex} total={settings.sessionsPerCycle} phase={phase} />

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
          <div className="hud-log" role="log" aria-label="System feed">
            <AnimatePresence initial={false} mode="popLayout">
              {visibleRows.map((row, i) => {
                const isLast = i === visibleRows.length - 1;
                return (
                  <motion.div
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                    transition={{ duration: 0.42, ease: LOG_ENTER_EXIT_EASE }}
                    className={`hud-log__row${isLast ? ' hud-log__row--active' : ''}`}
                  >
                    <span className="hud-log__prefix" aria-hidden>&gt;</span>
                    <span className="hud-log__event">{row.event}</span>
                    <span className="hud-log__duration">{row.meta}</span>
                    <span className="hud-log__phase" data-phase={row.tagColor}>
                      {row.tag}
                    </span>
                    <span className="hud-log__time">{row.time}</span>
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
        onSettingsChange={setSettings}
        onThemeChange={handleTheme}
        onPhaseFocus={setPhase}
      />
    </>
  );
}

export default App;
