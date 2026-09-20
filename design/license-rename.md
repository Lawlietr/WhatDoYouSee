# Step 9.1: License + Project Rename — 實施細節

> 狀態: 主要完成 (2026-09)；剩兩項待辦（見 `TODO.md`）。完成歷史見 git log。

- **License: AGPL-3.0-only (decided + implemented)** — full text in `LICENSE`; `"license": "AGPL-3.0-only"` in `package.json`; license section in README (model weights licensed separately by their owners; example photos are Pexels License). Rationale: force open-sourcing of forks; single license, deliberately NOT dual-licensed (GPLv3+AGPL would give recipients an escape hatch out of §13; AGPL+commercial is only relevant if we later add proprietary server-side features — decision trigger documented).
- **Project renamed to WhatDoYouSee** (was the original service's name) — `package.json` name, page `<title>`, header, Nominatim USER_AGENT, IndexedDB DB name, localStorage settings key, AGENTS.md, README.md. README leads with the ENTE/theyseeyourphotos inspiration credit (no URL, per owner preference) and states the project is independent and unaffiliated.

## 待辦
- Local working directory still named `they-see-your-photo` — rename when convenient (stop servers first; no in-repo references remain).
- When open-sourcing: `wrangler` project name should be `what-do-you-see` (not the old name).
