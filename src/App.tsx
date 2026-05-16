import { useState } from 'react';
import { TimerRing, type Phase } from './composites/TimerRing.tsx';
import { TimerControls } from './composites/TimerControls.tsx';
import { applyTheme, storeTheme, getStoredTheme, type Theme } from './tokens/theme.ts';
import './App.css';

const themes: Theme[] = ['light', 'dark', 'system'];
const phases: Phase[] = ['work', 'short-break', 'long-break'];

const totalsByPhase: Record<Phase, number> = {
  work: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

const phaseLabel: Record<Phase, string> = {
  work: 'work',
  'short-break': 'short break',
  'long-break': 'long break',
};

const nextPhase = (current: Phase): Phase => {
  if (current === 'work') return 'short-break';
  if (current === 'short-break') return 'long-break';
  return 'work';
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

  const total = totalsByPhase[phase];
  const remaining = Math.floor(total * 0.6);

  const handleTheme = (next: Theme) => {
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  const triggerGlitch = () => {
    if (glitching) return;
    setGlitching(true);
  };

  const handleLinkClick = () => {
    setLinkStatus((current) => cycleLinkStatus(current));
  };

  return (
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
          <span className="hud-meta">NEURAL_DIVE</span>
          <span className="hud-divider" aria-hidden>·</span>
          <span className="hud-meta hud-meta--dim">v0.7</span>
        </div>
        <div className="hud-cluster hud-cluster--right">
          <span className="hud-meta">SUBNET</span>
          <span className="hud-value">0xA7B3</span>
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
        </div>
      </header>

      <section className="shell__stage">
        <span className="hud-corner hud-corner--tl" aria-hidden />
        <span className="hud-corner hud-corner--tr" aria-hidden />
        <span className="hud-corner hud-corner--bl" aria-hidden />
        <span className="hud-corner hud-corner--br" aria-hidden />

        <div className="hud-annotation hud-annotation--top-left">
          <span className="hud-annotation__bracket">&lt;</span>
          <span className="hud-annotation__label">PHASE</span>
          <span className="hud-annotation__value" data-phase={phase}>
            {phaseLabel[phase].toUpperCase()}
          </span>
        </div>
        <div className="hud-annotation hud-annotation--top-right">
          <span className="hud-annotation__label">CYCLE</span>
          <span className="hud-annotation__value">02 / 04</span>
          <span className="hud-annotation__bracket">&gt;</span>
        </div>
        <div className="hud-annotation hud-annotation--bottom-left">
          <span className="hud-annotation__bracket">&lt;</span>
          <span className="hud-annotation__label">BUFFER</span>
          <span className="hud-annotation__value">0x3F2C</span>
        </div>
        <div className="hud-annotation hud-annotation--bottom-right">
          <span className="hud-annotation__label">PING</span>
          <span className="hud-annotation__value">12 ms</span>
          <span className="hud-annotation__bracket">&gt;</span>
        </div>

        <TimerRing
          phase={phase}
          remainingSeconds={remaining}
          totalSeconds={total}
          sessionIndex={2}
          sessionsPerCycle={4}
        />

        <TimerControls
          running={running}
          onToggle={() => setRunning((v) => !v)}
          onReset={() => setRunning(false)}
          onSkip={() => setPhase(nextPhase)}
        />

        <CycleDots current={2} total={4} />

        <div className="shell__phase-switch" role="group" aria-label="Phase preview">
          {phases.map((value) => (
            <button
              key={value}
              type="button"
              className="hud-pill"
              data-phase={value}
              data-active={value === phase}
              aria-pressed={value === phase}
              onClick={() => setPhase(value)}
            >
              {phaseLabel[value]}
            </button>
          ))}
        </div>
      </section>

      <footer className="shell__hud-bottom">
        <div className="hud-log" aria-label="System log">
          <div className="hud-log__row">
            <span className="hud-log__prefix" aria-hidden>&gt;</span>
            <span className="hud-log__text">neural link established</span>
            <span className="hud-log__time">t+00.01</span>
          </div>
          <div className="hud-log__row">
            <span className="hud-log__prefix" aria-hidden>&gt;</span>
            <span className="hud-log__text">subnet handshake ok</span>
            <span className="hud-log__time">t+00.02</span>
          </div>
          <div className="hud-log__row hud-log__row--active">
            <span className="hud-log__prefix" aria-hidden>&gt;</span>
            <span className="hud-log__text">ready for dive</span>
            <span className="hud-log__cursor" aria-hidden>▍</span>
          </div>
        </div>
        <div className="shell__theme-switch" role="group" aria-label="Theme">
          {themes.map((value) => (
            <button
              key={value}
              type="button"
              className="hud-pill hud-pill--small"
              data-active={value === theme}
              aria-pressed={value === theme}
              onClick={() => handleTheme(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </footer>
    </main>
  );
}

export default App;
