import { useState } from 'react';
import { applyTheme, storeTheme, getStoredTheme, type Theme } from './tokens/theme.ts';
import './App.css';

const themes: Theme[] = ['light', 'dark', 'system'];

export function App() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const handleTheme = (next: Theme) => {
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  return (
    <main className="shell">
      <header className="shell__header">
        <div className="shell__heading">
          <span className="shell__eyebrow">Focus Timer</span>
          <h1 className="shell__title">Tokens sanity check</h1>
          <p className="shell__lede">
            Палітра, типографія, ритми. Темну й світлу теми перемикай нижче — або через системні налаштування.
          </p>
        </div>
        <div className="shell__theme-switch" role="group" aria-label="Theme">
          {themes.map((value) => (
            <button
              key={value}
              type="button"
              className="theme-pill"
              data-active={value === theme}
              aria-pressed={value === theme}
              onClick={() => handleTheme(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </header>

      <section className="palette" aria-label="Color tokens">
        <article className="palette__card">
          <span className="palette__label">Surfaces</span>
          <div className="palette__row">
            <Swatch token="--bg-base" />
            <Swatch token="--bg-surface" />
            <Swatch token="--bg-surface-2" />
            <Swatch token="--bg-surface-3" />
          </div>
        </article>

        <article className="palette__card">
          <span className="palette__label">Foreground</span>
          <div className="palette__row palette__row--text">
            <span style={{ color: 'var(--fg-primary)' }}>Primary text · 14/20</span>
            <span style={{ color: 'var(--fg-secondary)' }}>Secondary copy · 14/20</span>
            <span style={{ color: 'var(--fg-tertiary)' }}>Tertiary meta · 13/18</span>
            <span style={{ color: 'var(--fg-disabled)' }}>Disabled hint · 13/18</span>
          </div>
        </article>

        <article className="palette__card">
          <span className="palette__label">Phase accents</span>
          <div className="palette__row">
            <Swatch token="--phase-work" label="Work" />
            <Swatch token="--phase-break-short" label="Short break" />
            <Swatch token="--phase-break-long" label="Long break" />
            <Swatch token="--accent-soft" label="Soft tint" />
          </div>
        </article>

        <article className="palette__card">
          <span className="palette__label">Typography scale</span>
          <div className="type-stack">
            <span style={{ font: 'var(--weight-semibold) var(--text-display)/var(--line-tight) var(--font-display)', letterSpacing: 'var(--letter-tight)' }}>25:00</span>
            <span style={{ font: 'var(--weight-medium) var(--text-2xl)/var(--line-tight) var(--font-display)', letterSpacing: 'var(--letter-tight)' }}>Display 40</span>
            <span style={{ font: 'var(--weight-medium) var(--text-xl)/var(--line-snug) var(--font-display)', letterSpacing: 'var(--letter-tight)' }}>Title 28</span>
            <span style={{ font: 'var(--weight-medium) var(--text-lg)/var(--line-snug) var(--font-sans)' }}>Subtitle 20</span>
            <span style={{ font: 'var(--weight-regular) var(--text-md)/var(--line-normal) var(--font-sans)' }}>Body 16 · щоденний робочий розмір.</span>
            <span style={{ font: 'var(--weight-regular) var(--text-base)/var(--line-normal) var(--font-sans)' }}>Default 14 · базовий UI-розмір.</span>
            <span style={{ font: 'var(--weight-regular) var(--text-sm)/var(--line-normal) var(--font-sans)', color: 'var(--fg-secondary)' }}>Caption 13 · метадані рядків історії.</span>
            <span style={{ font: 'var(--weight-medium) var(--text-xs)/var(--line-normal) var(--font-sans)', letterSpacing: 'var(--letter-wider)', textTransform: 'uppercase', color: 'var(--fg-tertiary)' }}>Eyebrow 11</span>
          </div>
        </article>

        <article className="palette__card">
          <span className="palette__label">Radius &amp; shadow</span>
          <div className="radius-row">
            <Tile radius="--radius-sm" label="sm" />
            <Tile radius="--radius-md" label="md" />
            <Tile radius="--radius-lg" label="lg" />
            <Tile radius="--radius-xl" label="xl" />
            <Tile radius="--radius-2xl" label="2xl" />
          </div>
        </article>

        <article className="palette__card">
          <span className="palette__label">Motion</span>
          <p className="motion-note">
            Будь-яка зміна стану рухається через токени тривалості (<code>--duration-fast</code>,
            <code>--duration-base</code>, <code>--duration-slow</code>) і easing
            (<code>--ease-out</code>, <code>--ease-spring</code>). При <code>prefers-reduced-motion</code>
            тривалості падають у 0&nbsp;ms — рух щезає, але контент рендериться.
          </p>
        </article>
      </section>

      <footer className="shell__footer">
        <span>Pibox · Focus Timer · scaffold</span>
        <span>Поточна тема: <strong>{theme}</strong></span>
      </footer>
    </main>
  );
}

function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="swatch">
      <span className="swatch__chip" style={{ background: `var(${token})` }} />
      <span className="swatch__name">{label ?? token}</span>
      <code className="swatch__code">{token}</code>
    </div>
  );
}

function Tile({ radius, label }: { radius: string; label: string }) {
  return (
    <div className="tile">
      <span className="tile__face" style={{ borderRadius: `var(${radius})` }} />
      <span className="tile__label">{label}</span>
    </div>
  );
}

export default App;
