# Phase 8: Deployment — 實施細節

> 本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Ordering decision (user)
Deployment is deferred to a later session. **Local deployment (`npm run build && npm start`) must be fully functional first.** Cloudflare Pages is best-effort afterwards — if it cannot serve normal functionality (e.g. WebGPU on the static build), it is acceptable to **skip** it; self-hosted is the priority. Local dev servers keep the `0.0.0.0` bind convention for LAN testing.

## Step 8.0: Local Production Verification — 已從 TODO 移除 (2026-09)
功能驗證已透過部署站（wdus/wdustesting 均經 owner 實際驗證 WebGPU + API mode）覆蓋，本地 LAN 驗證視為冗餘。以下為原本的驗證清單，僅供參考：
- `npm run build && npm start -p 3103 -H 0.0.0.0` → verify all features over LAN: WebGPU (via `scripts/https-test-server.mjs` → `https://<lan-ip>:3443`), API mode to user's llama-server, upload → analysis → map → settings round-trip
- Verify asset integrity after rebuild (all `/_next/static/chunks/*.js` must return 200 — see the build:export-vs-next-start pitfall in LOCAL-TEST-NOTES.md)

## Step 8.1: Static Export Build (✅ 大部分完成)
- `next.config.ts` toggles `output: 'export'` via `NEXT_STATIC_EXPORT=1`; `images.unoptimized: true` always set
- Run `npm run build:export` → `/out` generated (API routes auto-excluded + restored) — verified multiple times
- Verify `/out` contains: `index.html`, `_next/static/`, `404.html`, `examples/`
- **待辦** — Local test: `npx serve out` → verify all features work (WebGPU-only feature set; API routes absent by design)
- Note: self-hosted (with API routes) uses `npm run build && npm start`, NOT `build:export`

## Step 8.2: Cloudflare Pages (✅ 大部分完成)
- One-command deploy script: `scripts/deploy-pages.mjs` (build:export → verify /out → ensure project → production deploy → ensure custom domain; refuses to run without `CLOUDFLARE_API_TOKEN`+`CLOUDFLARE_ACCOUNT_ID` in the environment; contains no credentials; `--no-domain` flag skips the domain step)
- First deploy: done (2026-09) — project `what-do-you-see` created, production deployed, `wdustesting.avpclub.eu.org` attached via `POST .../pages/projects/{project}/domains` (body `{"name": ...}`; the legacy `/custom-domains` endpoint was removed from the public API and wrangler CLI has no domain command — this is why the script calls the REST API directly)
- Verified serving: home 200 (new name, 0 old-name hits), example photo 200, 404 page 404
- Verify in a real browser (2026-09, owner): WebGPU 450M and API mode (Gemma4-12B thinking model) both verified working on the live site
- Two-project test/prod split (2026-09, owner policy): `wdustesting` moved to a new project `what-do-you-see-test`; a Pages deployment updates ALL domains of its project, so the test and production domains now live in separate projects. Script default = test project; `--prod` = production (`wdus`) — production is only deployed on explicit owner request.
- `--branch main` fix (2026-09): deploying from a non-production git branch (DEV) made wrangler create a PREVIEW deployment that the custom domain never served (stale prod bundle kept showing). The script now passes `--branch main` so every deploy is a production deployment of the target project regardless of local branch.
- Production promotion (2026-09, owner-requested): `node scripts/deploy-pages.mjs --prod` — `wdus.avpclub.eu.org` now serves the same DEV-branch build as the test site (verified via served-bundle inspection: no-silent-download gate present, 450M default, 450M→3B order)
- **待辦** — Optional: set up GitHub integration for auto-deploy on push (note: `npm run build:export` semantics must be preserved in the CI build step)

### Post-deployment fixes (2026-09, DEV branch, ✅ 完成)
- WebGPU default model changed to the smallest (`LiquidAI/LFM2.5-VL-450M-ONNX`); UI model list ordered smallest→largest (450M → 3B)
- `LiquidAI/LFM2.5-VL-1.6B-ONNX` verified UNUSABLE and intentionally not catalogued: its ONNX files are named `decoder_*`/`embed_images_*`, which do not match the transformers.js 4.2.0 `ImageTextToText` session keys (`embed_tokens`/`decoder_model_merged`/`vision_encoder`) — cannot load
- One-time settings migration: browsers that stored the old default (3B) are migrated to the new default (450M) on first load, gated by a localStorage flag so a later explicit 3B choice is respected
- No silent model downloads: inference gates on `cachedModelState` and fails fast with a pointer to Settings when the model is not fully cached (`from_pretrained` can no longer fetch on demand); dialog action button driven by download state (Download / Use this model / Done — the current model previously had no download button); partial caches are labelled and re-downloadable

## Step 8.3: HF Static Spaces (✅ 部署完成 2026-10-02)
- Space: `lawlietr/what-do-you-see` — https://huggingface.co/spaces/lawlietr/what-do-you-see (public, Static SDK, created via `hf repos create lawlietr/what-do-you-see --type space --sdk static --no-private`)
- Deployed from DEV-branch build `3b163d1` (`npm run build:export` → 60 files, ~13 MB) via `hf upload lawlietr/what-do-you-see out . --type space`; `hf spaces wait` → RUNNING
- **ROLLBACK (2026-10-02, owner-requested):** the DEV build caused 識別異常 in owner testing; the Space — like CF test and CF prod — was redeployed from the `main`-branch build (`610c05b`, EN UI, attempt-2 prompt). Bundles verified byte-identical across all three sites. Note: `hf upload` only adds/updates files (it does NOT delete files removed locally), so old build chunks from the replaced build may linger in the Space repo — harmless (nothing references them) but they count against storage
- Serving topology: the Space URL is HF's wrapper page; the app itself is served from `https://lawlietr-what-do-you-see.static.hf.space` inside an iframe. Verified 200: app index, JS chunks, example photos, and the 23 MiB asyncify wasm (HF has no 25 MiB per-file limit — that constraint is Cloudflare Pages only)
- Space card (`README.md`: `sdk: static`, `app_port: 7860`, `license: agpl-3.0`, AGPL-3.0 + GitHub link) was written separately and uploaded to the Space repo — it is NOT in this git repo
- Future updates: `npm run build:export && hf upload lawlietr/what-do-you-see out . --type space && hf spaces wait lawlietr/what-do-you-see` (requires `hf` CLI authenticated, `hf auth whoami`)
- Same limitations as Cloudflare Pages (static only, no API routes); WebGPU + API modes both work
- Manual deploy only — not part of `scripts/deploy-pages.mjs`; CF test/prod policy does not apply to the Space (no prod gate, deploy freely)

## Step 8.4: Self-Hosted (Full Functionality) — 待辦
- `npm run build && npm start` (includes API routes; do NOT use `build:export` here)
- Or Docker: create `Dockerfile` + `docker-compose.yml`
- Start llama-server backend: `llama-server -hf LiquidAI/LFM2.5-VL-3B-GGUF:Q4_K_M --port 8080`
- Verify both WebGPU and API modes work

## Step 8.5: Deployment Documentation — 待辦
- Create `DEPLOY.md` with:
  - Cloudflare Pages deployment steps
  - HF Static Spaces deployment steps
  - Self-hosted deployment steps
  - Environment variables reference
  - Troubleshooting guide
