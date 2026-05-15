# Focus Timer · Pibox Test Task

## Project context

Я виконую тестове завдання для позиції Frontend Engineer у Pibox. Завдання — побудувати Focus Timer (Pomodoro). Повний ТЗ у `../claude/TASK.md`. Перш ніж відповідати на питання щодо архітектури — звірся з ним.

Найголовніше: **Pibox оцінює Дизайн (50%) і Polish (30%)**, тільки потім Код і роботу зі мною. Цю пропорцію тримаємо у всіх рішеннях.

## Stack — зафіксовано

- React 19 + TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Vite (`react-ts` template)
- pnpm 9+
- Zustand 5 з persist middleware
- Framer Motion 11
- Lucide React — єдина іконкова бібліотека
- i18next + react-i18next — `en` + `uk`
- Vanilla CSS з власними токенами або CSS Modules
- Vitest для юніт-тестів логіки таймера

## Заборонено

- Будь-які UI-бібліотеки: shadcn, Radix, MUI, Mantine, Chakra
- Будь-який CSS-in-JS: styled-components, Emotion, vanilla-extract
- Tailwind, Bootstrap
- Chart-бібліотеки (Chart.js, Recharts, Victory) — стату малюємо самі через SVG / CSS
- Custom SVG іконки крім логотипу проекту. Усі інтерфейсні іконки — з Lucide
- Emoji в UI

Якщо я раптом попрошу щось з цього — ПРИПИНИ і нагадай мені про обмеження. Не починай встановлювати.

## Design principles (must-follow)

Я попередньо прочитав:
- https://wiki.pibox.com/design/principles/
- https://wiki.pibox.com/design/tokens/
- https://wiki.pibox.com/design/components/

Кодуй під ці правила. Якщо я прошу зробити щось всупереч — попроси підтвердити. Ключове:

1. **Один токен → один source.** Колори / відступи / радіуси / тривалості анімації — описані в `:root` (з варіантами на `.dark`) і використовуються через `var(--token)`. Magic-numbers (`padding: 13px`, `color: #abc`) у стилях — це bug, не feature.

2. **Анімація на КОЖНОМУ state-change.** Вхід картки, swap фази таймера, відкриття settings, theme-toggle, поява рядка історії, hover на кнопці. Тривалості та easing — зі спільних motion-токенів (`--duration-fast`, `--duration-base`, `--ease-out` тощо).

3. **Surface hierarchy:**
   - **Solid** — chrome / utility UI (header, sidebar, list rows, buttons, inputs, dialogs над dimmer).
   - **Atmospheric** (gradient, glow, halo) — лише для головного moment-surface (центральний timer ring).
   - Glass / blur — тільки якщо за ним є цікавий contrast (наш approach: glass over rich background, solid over flat).

4. **Lucide-only icons.** Якщо потрібної іконки в Lucide немає — питай мене, не малюй свою.

5. **Accessibility preferences:**
   - `@media (prefers-reduced-motion: reduce)` — анімації заміни на 0ms (миттєві стан-зміни), але контент рендериться.
   - `@media (prefers-color-scheme: dark)` — toggle працює, але респектує системний дефолт при першому запуску.
   - `@media (prefers-contrast: more)` — solid борди, без halo, без атмосферних gradient'ів.

6. **Keyboard parity:** кожен інтерактив досяжний з клавіатури, focus-ring видно (через `:focus-visible`).

7. **Empty / error / loading стани** — обов'язкові для будь-якого блоку з даними. Історія порожня → не пусто, а копірайт про "no sessions today". `localStorage` недоступний → попередження, але додаток працює.

## Definition of done — taste check

Перш ніж сказати "готово", прогани цей чек. Якщо хоч одне "ні" — продовжуємо полірувати, не комітимо.

- Я подивився на екран свіжими очима, наче бачу його вперше. Все читається?
- Вирівнювання pixel-perfect? Нема "близько, але не зовсім" — 2 px зсуву теж bug.
- Vertical rhythm витриманий? Між блоками однакові кратні відступи з token-системи.
- Типографія працює як ієрархія? Title → subtitle → body → meta — все читається без напруги, але не плоско.
- Анімації мають інтенцію? Кожна тривалість і easing обрані під сенс руху, не "виглядає ок".
- Hover / focus / active / disabled — кожен стан чітко відрізняється і виглядає як "продуманий", не "fallback".
- Dark і light мають однаковий рівень полірованості? Або тільки одну тему "вилизали"?
- Reduced-motion версія не виглядає поламано — вона виглядає тихо.
- Empty state не порожнечу показує, а легке "тут буде ось що".
- Я б показав це CEO Stripe / Linear / Vercel і не соромився?

Якщо я кажу "готово" а ти бачиш порушення цих пунктів — нагадай мені, не пропускай.

## Reference bar — на що дивимось

Коли я або ти не впевнені "як має бути красиво", відкриваємо ці продукти і дивимось як вони вирішують саме цю проблему:

- **linear.app** — інтеракція, mікроанімації, плотність інформації, layout
- **vercel.com** — типографіка, темна тема, spacing
- **stripe.com/pricing** — pricing-сторінка-еталон (ми її використовуємо як референс)
- **railway.com** — атмосферні градієнти, hero-секції
- **arc.net** (старий лендінг) — щільність анімації, переходи
- **apple.com** — modern HIG, мова рухів, Liquid Glass

Ми не копіюємо їх 1:1 — ми звіряємось з планкою. Якщо щось виглядає гірше за linear-equivalent — питання чому.

## Iteration discipline

Polish — це 5 проходів, не 1. Якщо я кажу "зроби екран" — це означає:

1. **Структура** — компоненти на місцях, дані рендеряться
2. **Spacing + alignment** — кожен gap, padding, margin з token-системи; усе вирівняне
3. **Typography hierarchy** — розміри, ваги, кольори передають важливість
4. **Animation + transitions** — стани змінюються плавно, кожен timing з motion-token'у
5. **Edge cases** — empty, error, long text, дуже маленький / великий екран, dark vs light parity

Не закінчуй на 1-2. Повертайся до того, що "наче готове", і відполіровуй. Кожен прохід — окремий коміт.

## How to ask me back about polish

Якщо я кажу "зроби красивіше" — це нечіткий промпт, попроси конкретики:
- "що саме не подобається — typography? spacing? motion?"
- "як ця ж проблема вирішена в linear / vercel?"
- "у яких станах це треба покращити: rest / hover / animated?"

Якщо я кажу "виглядає ок" — це червоний прапор. Запитай: "чи дійсно дотягує до планки `linear.app`? Що треба ще?"

## Coding standards

- **Жодних `any`.** Включно з `as any`. Якщо тип складний — типізуй явно або через `unknown` + narrowing.
- **Мінімум коментарів.** Коментарі лише на WHY: чому це обмеження, на що це посилається, що зломає. Не на WHAT — це видно з коду.
- **Декомпозиція:** primitives (Button, IconButton, Toggle, NumberInput) → composites (TimerRing, SessionRow, SettingsPanel) → screens (TimerScreen, ComponentsShowcase).
- **Один store на додаток** (Zustand). Логіка машини станів таймера — у store, не в компонентах.
- **Файлова структура:**
  ```
  src/
    tokens/        CSS-vars, theme switch
    primitives/    Button, IconButton, Toggle, …
    composites/    TimerRing, SessionRow, StatsBars, …
    screens/       TimerScreen, ComponentsShowcase
    store/         Zustand store + persist
    lib/           pure helpers (formatDuration, dateBuckets, …)
    i18n/          en, uk
  ```

## Working agreement

- **Спочатку план.** Якщо завдання — більше ніж 1 файл, перш ніж писати код використовуй TodoWrite і покажи мені список кроків. Я підтверджую, потім стартуєш.
- **Перевір типи перед комітом.** Запусти `pnpm typecheck` (alias на `tsc -b --noEmit`) у Bash-tool, переконайся що чисто. Якщо помилки — фіксь, не комітимо червоне.
- **Маленькі коміти.** Кожен логічний крок — окремий commit з message у форматі: `<area>: <change>`, наприклад `tokens: add motion vars`, `timer-ring: animate phase swap`.
- **Тести логіки** — мінімум 3 для timer state machine у Vitest. UI не тестуємо.
- **Не пиши кінцеві файли документації** (`ARCHITECTURE.md`, `DECISIONS.md` тощо) поки я не попрошу. README — так.

## What I might ask you to do — yes-no guidelines

- "Додай Tailwind" → **ні**, нагадай про обмеження
- "Постав shadcn" → **ні**, нагадай про обмеження
- "Зроби кнопку з radix" → **ні**
- "Запусти dev сервер" → НЕ запускай у background, я роблю це сам у окремому терміналі
- "Замінь Lucide на feather-icons" → **ні**
- "Додай dependency X" → запитай мене, перш ніж робити `pnpm add`
- "Перепиши усе" → запитай scope і причину, перш ніж робити масові зміни

## Communication style

- Я говорю українською, відповідай українською
- Короткі повідомлення: одне-два речення про статус + наступний крок
- Не переказуй мені те, що я щойно сказав, у твоїй відповіді
- End-of-turn summary — одне речення, що зробив + що далі. Не більше

## Що ми вже узгодили

- **Версії:** Node 20.20 (TASK рекомендує 22+, але 20 LTS працює з Vite 8 / React 19 / Vitest 4). Якщо буде час — у README згадаємо рекомендований Node 22.
- **Framer Motion pinned to v11** (`^11.18.2`) — TASK явно фіксує мажорну версію, не 12.
- **Project location:** `Pibox/focus-timer/` (поряд з `Pibox/claude/` де лежать матеріали ТЗ).
- **Locale:** TS strict з усіма pedantic-флагами увімкнено (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`).

(Далі сюди дописуємо рішення, які приймали разом — наприклад: "Тема ховається у `data-theme` атрибуті на `<html>`", "Stats показує тільки work-сесії", тощо. Тримати актуальним.)
