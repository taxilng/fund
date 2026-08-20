# AGENTS.md

## Default Skills

- Always use `$karpathy-guidelines` for repository work, including coding, reviewing, refactoring, debugging, planning implementation work, and editing project files.

## Project Snapshot

- This repository is a Vue 2 / Vue CLI web app for a self-selected fund and stock assistant.
- The app tracks fund holdings, stock holdings, market indices, estimated daily gains, holding gains, total assets, and a combined fund-plus-stock daily revenue curve.
- Primary UI library: Element UI.
- Charting and visualization dependencies include ECharts, AntV G6, html2canvas, and clipboard helpers.
- State is stored mainly in `localStorage` through `src/untils/utils.js`.
- The code includes a local `chrome.runtime.sendMessage` adapter, so the app can run as a normal web app even though some logic was originally shaped like a browser extension.

## Main Entry Points

- App entry: `src/main.js`
- Root component: `src/App.vue`
- Routes: `src/router/index.js`
- Axios wrapper and interceptors: `src/axios/request.js`
- Shared utilities and storage adapter: `src/untils/utils.js`

## Main Routes And Pages

- `/`: fund watchlist page in `src/views/home/index.vue`
- `/stock`: stock watchlist page in `src/views/stock/index.vue`
- `/totalrevenue`: combined fund and stock daily revenue curve in `src/views/totalrevenue/index.vue`
- `/option`: settings/login area in `src/views/options`
- Shared dialogs, charts, market views, fund details, manager details, holding income, and position details live under `src/views/common`

## Data Sources And Proxies

- Eastmoney fund mobile APIs are proxied through `/FundMApi` and `/FundMNewApi`.
- Eastmoney quote APIs are used through `/api/qt` and some direct `https://push2.eastmoney.com/...` calls.
- Search uses `/searchapi`.
- Fund valuation fallback uses `/fundRabtTop`.
- User-center sync/login uses `/bspapp`.
- Proxy configuration exists in `vite.config.js`, `nginx.conf`, and `public/netlify.toml`.

## Scripts

- `pnpm run dev` / `yarn dev`: Vue CLI dev server using `--mode tencent`.
- `pnpm run serve` / `yarn serve`: Vue CLI dev server using `--mode netlify`.
- `pnpm run build` / `yarn build`: production build using `--mode netlify`.
- `pnpm run build:tx` / `yarn build:tx`: production build using `--mode tencent`.
- `pnpm run lint` / `yarn lint`: Vue CLI lint.

## Environment Modes

- `.env.netlify` sets `VUE_APP_SERVER = 'netlify'` and `NODE_ENV = 'production'`.
- `.env.tencent` sets `VUE_APP_SERVER = 'tencent'` and `NODE_ENV = 'production'`.
- `vite.config.js` uses these modes for local proxy behavior and production build behavior.

## Current Initialization Notes

- A scan on 2026-07-09 found the project structure intact, but the local dependency install appears incomplete.
- `babel.config.js` currently uses the `@vue/app` preset, which resolves to that missing package.
- Running `pnpm run build` in this environment first attempted dependency housekeeping and failed in non-interactive mode with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
- If build verification is needed, refresh dependencies first, then rerun the Vue CLI build.
- There are many leftover `console.log` statements in `src/views/home`, `src/views/stock`, `src/views/options`, and several `src/views/common` components.
- Some Chinese text may appear garbled in terminal output depending on shell encoding; inspect files in an editor that preserves the original encoding before making text-only cleanup edits.

## Worktree Notes

- At initialization, the branch was `main` tracking `origin/main`.
- The only untracked project metadata found after cleanup was `.agents/` and this `AGENTS.md`.
- Do not remove or revert these agent files unless the user explicitly asks.
