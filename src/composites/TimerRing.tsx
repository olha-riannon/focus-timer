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
  work: 'DEEP DIVE',
  'short-break': 'BUFFER FLUSH',
  'long-break': 'COLD CYCLE',
};

const formatTime = (totalSec: number): string => {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const DEPTH_BLOCKS = 16;

export function TimerRing({
  phase,
  remainingSeconds,
  totalSeconds,
  sessionIndex,
  sessionsPerCycle,
}: TimerRingProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const display = formatTime(remainingSeconds);
  const syncPct = Math.round(progress * 100);
  const filled = Math.round(progress * DEPTH_BLOCKS);

  return (
    <div className="timer-panel" data-phase={phase}>
      <span className="timer-panel__stamp timer-panel__stamp--left" aria-hidden>
        BUILD 52 :: REV 22 :: 0xA7B3F2C
      </span>
      <span className="timer-panel__stamp timer-panel__stamp--right" aria-hidden>
        TRACE_ROUTE :: 0xC4F2 :: ECHO 12ms :: NODE 0x9E07
      </span>
      <span className="timer-panel__hashes" aria-hidden />

      <header className="timer-panel__header">
        <div className="timer-panel__tag">
          <span className="timer-panel__tag-text">{phaseStatusLabel[phase]}</span>
        </div>
        <div className="timer-panel__cycle">
          <span className="timer-panel__cycle-label">CYCLE</span>
          <span className="timer-panel__cycle-value">
            {sessionIndex.toString().padStart(2, '0')} /{' '}
            {sessionsPerCycle.toString().padStart(2, '0')}
          </span>
        </div>
      </header>

      <div className="timer-panel__display">
        <span className="timer-panel__display-corner timer-panel__display-corner--tl" aria-hidden />
        <span className="timer-panel__display-corner timer-panel__display-corner--tr" aria-hidden />
        <span className="timer-panel__display-corner timer-panel__display-corner--bl" aria-hidden />
        <span className="timer-panel__display-corner timer-panel__display-corner--br" aria-hidden />
        <span
          className="timer-panel__number"
          role="img"
          aria-label={`${display} remaining`}
        >
          {display}
        </span>
      </div>

      <div className="timer-panel__inline-label" aria-hidden>
        // MEMORY_TRACE :: 0xA7B3F2C :: PACKET 0xC4F2
      </div>

      <div
        className="timer-panel__progress"
        role="progressbar"
        aria-valuenow={syncPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="timer-panel__progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <footer className="timer-panel__footer">
        <div className="timer-panel__meta">
          <span className="timer-panel__meta-label">SYNC</span>
          <span className="timer-panel__meta-value">
            {syncPct.toString().padStart(3, '0')}%
          </span>
        </div>
        <div className="timer-panel__meta">
          <span className="timer-panel__meta-label">DEPTH</span>
          <span className="timer-panel__meta-bar" aria-hidden>
            {'█'.repeat(filled)}
            {'░'.repeat(DEPTH_BLOCKS - filled)}
          </span>
        </div>
      </footer>
    </div>
  );
}
