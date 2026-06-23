# Tiny Arcade

<p align="center">
  <img src="./assets/shem-tiny-arcade-banner.svg" alt="Tiny Arcade — AI, games, and playable experiments" width="100%">
</p>

> An instant-play browser game hub, created and curated by Shem.

**Tiny Arcade** is a searchable collection of small, self-contained browser games. Every title gets its own subpath, opens without an install or account, and can be hosted as static files on GitHub Pages.

- **Game hub:** `https://shemyu.github.io/single-page-games/`
- **Repository:** `https://github.com/ShemYu/single-page-games`
- **Featured game:** `https://shemyu.github.io/single-page-games/games/mochi-sky/`

## What changed

The homepage is organized as a game hub rather than a personal landing page:

- catalog-first layout
- full-text game search
- genre chips and control filters
- newest, recently updated, and A–Z sorting
- shareable URL state such as `?q=pixel&genre=platformer`
- bilingual English / Traditional Chinese interface
- one catalog file as the source of truth
- accessible empty states, keyboard shortcut, and mobile layout

## Games

| Game | Status | Genre | Controls | Path |
| --- | --- | --- | --- | --- |
| **Mochi Sky / 麻糬星野** | POC | Platformer, Action | Keyboard, Touch | `games/mochi-sky/` |
| **Crystal Vanguard / 琉璃城：八方守晶** | POC | Strategy, Arcade | Keyboard, Mouse, Touch | `games/crystal-vanguard/` |

## Repository structure

```text
single-page-games/
├── index.html                         # Game hub shell
├── 404.html                           # GitHub Pages fallback
├── assets/
│   ├── styles/
│   │   └── hub.css                    # Hub visual system
│   ├── scripts/
│   │   ├── catalog.js                 # Game metadata source of truth
│   │   └── hub.js                     # Search, filters, sorting, i18n
│   ├── previews/
│   │   ├── crystal-vanguard.png
│   │   └── mochi-sky.png
│   ├── shem-tiny-arcade-banner.svg
│   └── shem-tiny-arcade-banner.png
├── games/
│   ├── crystal-vanguard/
│   │   ├── index.html                 # Playable game
│   │   └── README.md
│   └── mochi-sky/
│       ├── index.html                 # Playable game
│       └── README.md
└── .nojekyll
```

The hub has no framework, package manager, bundler, backend, or runtime dependency.

## Add a game

### 1. Add the playable page

```text
games/<game-slug>/index.html
```

Keep the game self-contained inside its folder whenever practical.

### 2. Add a 16:9 preview

```text
assets/previews/<game-slug>.png
```

### 3. Register it in the catalog

Edit `assets/scripts/catalog.js` and append one object:

```js
{
  id: "new-game",
  title: {
    en: "New Game",
    zh: "新遊戲"
  },
  description: {
    en: "A one-sentence description.",
    zh: "一句話遊戲說明。"
  },
  path: "./games/new-game/",
  source: "https://github.com/ShemYu/single-page-games/tree/main/games/new-game",
  preview: "./assets/previews/new-game.png",
  previewAlt: {
    en: "Gameplay preview of New Game",
    zh: "新遊戲的遊玩畫面"
  },
  genres: ["puzzle"],
  tags: ["pixel-art", "single-player"],
  controls: ["keyboard", "touch"],
  status: "poc",
  featured: false,
  playTime: "5 min",
  added: "2026-06-23",
  updated: "2026-06-23"
}
```

The homepage will automatically generate the game card, search index, genre counts, filters, sorting, result count, and localized labels. No card markup needs to be copied.

Supported catalog values can be extended in the translation maps inside `assets/scripts/hub.js`.

## Local preview

Use any static file server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

Direct `file://` preview is not recommended because browser security rules can vary for linked assets and storage.

## Mochi Sky controls

| Input | Action |
| --- | --- |
| `←` `→` / `A` `D` | Move |
| `Space` / `W` | Jump |
| Hold `X` | Inhale |
| `C` | Shoot star |
| `R` | Restart |
| `P` | Pause |

Touch controls are included for mobile browsers.

## Hub principles

1. **Games first** — visitors should reach something playable within one click.
2. **One source of truth** — game metadata belongs in the catalog, not duplicated card markup.
3. **Static by default** — GitHub Pages should be enough to run the whole hub.
4. **Subpath safe** — internal links stay relative so project Pages works correctly.
5. **Small but product-shaped** — prototypes can be tiny without feeling disposable.

## License and attribution

Each game may declare its own licensing or attribution notes inside its folder. Hub design and repository structure are maintained by [ShemYu](https://github.com/ShemYu).
