# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build via Vite
npm run preview   # Serve the production build locally
```

There is no test runner or linter configured.

## Architecture

This is a **single-file React application** (`QuestEngine.jsx`) — a gamified job-search and interview-prep tracker. The entire app lives in one ~3,500-line component file; there is no routing, no component splitting, and no CSS files.

### File layout

| File | Purpose |
|------|---------|
| `QuestEngine.jsx` | Entire application: game data constants, helpers, and the single `QuestEngine` component |
| `firebase.js` | Initialises Firebase app and exports `db` (Firestore instance) |
| `main.jsx` | React root — mounts `<QuestEngine />` |
| `vite.config.js` | Vite config with `@vitejs/plugin-react` |

### Data model (top of `QuestEngine.jsx`)

All game content is defined as **plain JS constants** at the top of the file before the component:

- `LEVELS` — XP thresholds and titles for 9 levels
- `BOSSES` — 6 sequential bosses, each with `id`, `hp`, and `reward`
- `QUESTS` — 44 built-in quests with `id`, `week`, `category`, `xp`, `bossDmg`, `urgent`
- `CATEGORY_META` — display metadata (label, colour, bg) for 6 categories: `dsa`, `java`, `sql`, `project`, `jobsearch`, `interview`
- `ACHIEVEMENTS` — 8 achievements unlocked by XP thresholds
- `DEADLINES` — 5 built-in upcoming deadlines
- `DSA_DAYS` — 39-day structured LeetCode plan across 4 phases; each entry has `problems[]` (LeetCode numbers) and optional `conceptLink`
- `LC_SLUGS` — map of LeetCode problem number → slug for direct URL generation

### Persistence (Firebase Firestore)

All user state is saved to a **single Firestore document**: `users/abhishek_rpg_v3` (the `STORAGE_KEY` constant).

The save effect uses a **1200 ms debounce** and `merge: true` to avoid wiping unrelated fields. The `loaded` flag (and `loadedRef`) gates the save effect so the initial burst of `setState` calls from the load effect never triggers a premature write.

Fields persisted: `xp`, `completed`, `bossHp`, `customDeadlines`, `customQuests`, `brainDump`, `dsaProgress`, `hiddenCategories`.

**Streak and weekly XP goal** are stored in `sessionStorage` only (not Firebase).

### Boss sequencing invariant

Bosses are strictly sequential. `getCurrentBoss(bossHp)` returns the first boss where all previous bosses have `hp === 0`. Locked bosses always report full HP regardless of stored state — `getEffectiveBossHp` enforces this. When completing a quest, damage always hits the current active boss (not one derived from XP).

### DSA progress keys

DSA problem tracking uses keys of the form `d{day}-{problemNumber}` (e.g. `d1-53`). Review/mock days use `d{day}-review`. Status cycles: `pending` → `completed` → `struggled` → `pending`.

### Custom content IDs

User-created quests use IDs prefixed `cq_`, deadlines use `cd_`, brain dump entries use `bd_`, all suffixed with `Date.now()`.

### Tabs

Seven tabs rendered by `activeTab` state: `today`, `quests`, `dsa`, `bosses`, `deadlines`, `braindump`, `stats`.

### Styling

All CSS lives in a `<style>` tag injected inside the component's JSX. The theme is cyberpunk/dark (`#020408` background) using Google Fonts: **Orbitron**, **Rajdhani**, **Share Tech Mono**. Framer Motion handles overlay animations (level-up, boss-defeated). `canvas-confetti` fires on level-up and boss defeat events.

Custom quest `bossDmg` is auto-calculated as 80% of the quest's XP value.
