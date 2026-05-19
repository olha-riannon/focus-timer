import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './TimerPanel.css';

export type Phase = 'work' | 'short-break' | 'long-break';

const PHASE_TEXT_EASE = [0.65, 0, 0.35, 1] as const;

interface TimerPanelProps {
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

const formatTimeParts = (totalSec: number): { m: string; s: string } => {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return { m, s };
};

const DEPTH_BLOCKS = 16;

export function TimerPanel({
  phase,
  remainingSeconds,
  totalSeconds,
  sessionIndex,
  sessionsPerCycle,
}: TimerPanelProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const { m: minPart, s: secPart } = formatTimeParts(remainingSeconds);
  const ariaTime = `${minPart}:${secPart}`;
  const syncPct = Math.round(progress * 100);
  const filled = Math.round(progress * DEPTH_BLOCKS);

  const panelRef = useRef<HTMLDivElement>(null);
  const tagMeasureRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef(phase);
  const [tagWidth, setTagWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    prevPhaseRef.current = phase;
    const el = panelRef.current;
    if (!el) return;
    el.classList.remove('timer-panel--glitch');
    void el.offsetHeight;
    el.classList.add('timer-panel--glitch');
  }, [phase]);

  useLayoutEffect(() => {
    if (!tagMeasureRef.current) return;
    setTagWidth(tagMeasureRef.current.offsetWidth);
  }, [phase]);

  return (
    <div ref={panelRef} className="timer-panel" data-phase={phase}>
      <span className="timer-panel__stamp timer-panel__stamp--left" aria-hidden>
        BUILD 52 :: REV 22 :: 0xA7B3F2C
      </span>
      <span className="timer-panel__stamp timer-panel__stamp--right" aria-hidden>
        TRACE_ROUTE :: 0xC4F2 :: ECHO 12ms :: NODE 0x9E07
      </span>
      <span className="timer-panel__hashes" aria-hidden />

      <header className="timer-panel__header">
        <div
          ref={tagMeasureRef}
          className="timer-panel__tag timer-panel__tag--measurer"
          aria-hidden
        >
          <span className="timer-panel__tag-text">{phaseStatusLabel[phase]}</span>
        </div>

        <motion.div
          className="timer-panel__tag"
          animate={tagWidth !== undefined ? { width: tagWidth } : false}
          transition={{ duration: 0.34, ease: PHASE_TEXT_EASE }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phaseStatusLabel[phase]}
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.08, filter: 'blur(4px)' }}
              transition={{ duration: 0.34, ease: PHASE_TEXT_EASE }}
              className="timer-panel__tag-text"
            >
              {phaseStatusLabel[phase]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
        <div className="timer-panel__cycle">
          <span className="timer-panel__cycle-label">CYCLE</span>
          <span className="timer-panel__cycle-value">
            {sessionIndex.toString().padStart(2, '0')} /{' '}
            {sessionsPerCycle.toString().padStart(2, '0')}
          </span>
        </div>
      </header>

      <div className="timer-panel__display" role="img" aria-label={`${ariaTime} remaining`}>
        <span className="timer-panel__display-corner timer-panel__display-corner--tl" aria-hidden />
        <span className="timer-panel__display-corner timer-panel__display-corner--tr" aria-hidden />
        <span className="timer-panel__display-corner timer-panel__display-corner--bl" aria-hidden />
        <span className="timer-panel__display-corner timer-panel__display-corner--br" aria-hidden />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={minPart}
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
            transition={{ duration: 0.34, ease: PHASE_TEXT_EASE }}
            className="timer-panel__number"
          >
            {minPart}
          </motion.span>
        </AnimatePresence>
        <span className="timer-panel__number timer-panel__number--sep" aria-hidden>:</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={secPart}
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
            transition={{ duration: 0.34, ease: PHASE_TEXT_EASE }}
            className="timer-panel__number"
          >
            {secPart}
          </motion.span>
        </AnimatePresence>
        <span className="timer-panel__digit-caption" aria-hidden>min</span>
        <span className="timer-panel__digit-caption timer-panel__digit-caption--gap" aria-hidden />
        <span className="timer-panel__digit-caption" aria-hidden>sec</span>
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
