import './TimerRing.css';

export type Phase = 'work' | 'short-break' | 'long-break';

interface TimerRingProps {
  phase: Phase;
  remainingSeconds: number;
  totalSeconds: number;
  sessionIndex: number;
  sessionsPerCycle: number;
}

const phaseStatusLabel: Record<Phase, string> = {
  work: 'NEURAL LINK :: DEEP DIVE',
  'short-break': 'NEURAL LINK :: SOFT RESET',
  'long-break': 'NEURAL LINK :: COLD SHUTDOWN',
};

const formatTime = (totalSec: number): string => {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const VIEWBOX = 460;
const STROKE = 12;
const TICK_COUNT = 60;
const DEPTH_BLOCKS = 12;

const tickOuterRadius = (VIEWBOX - STROKE) / 2;
const tickInnerRadius = tickOuterRadius - STROKE * 0.8;
const longTickInnerRadius = tickOuterRadius - STROKE * 1.6;
const ringRadius = (VIEWBOX - STROKE * 6) / 2;
const circumference = 2 * Math.PI * ringRadius;

export function TimerRing({
  phase,
  remainingSeconds,
  totalSeconds,
  sessionIndex,
  sessionsPerCycle,
}: TimerRingProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);
  const display = formatTime(remainingSeconds);
  const syncPct = Math.round(progress * 100);
  const filled = Math.round(progress * DEPTH_BLOCKS);

  return (
    <div className="timer-ring" data-phase={phase}>
      <div className="timer-ring__eyebrow" aria-hidden>
        <span className="timer-ring__eyebrow-bracket">[</span>
        <span className="timer-ring__eyebrow-text">{phaseStatusLabel[phase]}</span>
        <span className="timer-ring__eyebrow-sep">·</span>
        <span className="timer-ring__eyebrow-cycle">
          CYCLE {sessionIndex.toString().padStart(2, '0')} /{' '}
          {sessionsPerCycle.toString().padStart(2, '0')}
        </span>
        <span className="timer-ring__eyebrow-bracket">]</span>
      </div>

      <div className="timer-ring__stage">
        <div className="timer-ring__halo" aria-hidden />

        <svg
          className="timer-ring__svg"
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          role="img"
          aria-label={`${display} remaining`}
        >
          <g className="timer-ring__ticks">
            {Array.from({ length: TICK_COUNT }, (_, i) => {
              const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
              const isLong = i % 5 === 0;
              const innerR = isLong ? longTickInnerRadius : tickInnerRadius;
              const x1 = VIEWBOX / 2 + Math.cos(angle) * innerR;
              const y1 = VIEWBOX / 2 + Math.sin(angle) * innerR;
              const x2 = VIEWBOX / 2 + Math.cos(angle) * tickOuterRadius;
              const y2 = VIEWBOX / 2 + Math.sin(angle) * tickOuterRadius;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={isLong ? 'timer-ring__tick timer-ring__tick--long' : 'timer-ring__tick'}
                />
              );
            })}
          </g>

          <circle
            className="timer-ring__trail"
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={ringRadius}
            strokeWidth={STROKE}
            fill="none"
          />
          <circle
            className="timer-ring__progress"
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={ringRadius}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${VIEWBOX / 2} ${VIEWBOX / 2})`}
          />
        </svg>

        <span className="timer-ring__bracket timer-ring__bracket--tl" aria-hidden />
        <span className="timer-ring__bracket timer-ring__bracket--tr" aria-hidden />
        <span className="timer-ring__bracket timer-ring__bracket--bl" aria-hidden />
        <span className="timer-ring__bracket timer-ring__bracket--br" aria-hidden />

        <div className="timer-ring__display">
          <span className="timer-ring__number">{display}</span>
          <div className="timer-ring__meta">
            <span className="timer-ring__meta-label">SYNC</span>
            <span className="timer-ring__meta-value">
              {syncPct.toString().padStart(3, '0')}%
            </span>
            <span className="timer-ring__meta-sep">·</span>
            <span className="timer-ring__meta-label">DEPTH</span>
            <span className="timer-ring__meta-bar" aria-hidden>
              {'█'.repeat(filled)}
              {'░'.repeat(DEPTH_BLOCKS - filled)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
