# AGENTS.md — WhatDoYouSee

## Project Overview

A local, privacy-first photo-privacy analysis tool, **inspired by ENTE's theyseeyourphotos service** (see README.md — keep the inspiration credit, and keep the project name distinct: **WhatDoYouSee**, never use the original service's name/branding).
Upload a photo → AI analyzes what private information can be inferred → results shown as paragraphs + data table.

**Key difference from the original:** All data stays local. No third-party analytics, no tracking, no data collection.

**License: AGPL-3.0-only** (LICENSE file, `license` field in package.json). The AI model weights (LiquidAI LFM2.5-VL) are licensed separately by their owners; example photos are Pexels License. The AGPL covers only this codebase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) — see `node_modules/next/dist/docs/` before writing code |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first, no config file) + Material UI v9 |
| AI (Browser) | `@huggingface/transformers` + WebGPU (ONNX format) |
| AI (Backend) | llama-server via OpenAI-compatible API (GGUF format) |
| EXIF | `exifr` |
| Image Compression | `browser-image-compression` |
| Map | `react-leaflet` + OpenStreetMap |
| Model Storage | Cache API (`transformers-cache`) for WebGPU ONNX files + IndexedDB (auxiliary) |
| Settings | localStorage |

## AI Models

WebGPU models are catalogued in `src/lib/model-catalog.ts` (`WEBGPU_MODELS`); sizes verified from the HF API (q4 ONNX shards + JSON config files).

| Mode | Model ID | Format | Download Size |
|------|----------|--------|---------------|
| WebGPU (default) | `LiquidAI/LFM2.5-VL-450M-ONNX` | ONNX (fp16 encoder + q4 decoder) | ~0.75 GB |
| WebGPU (optional) | `LiquidAI/LFM2.5-VL-3B-ONNX` | ONNX (fp16 encoder + q4 decoder) | ~3.72 GB |

**Model catalog notes** (`src/lib/model-catalog.ts`): sizes are the exact byte totals of the files transformers.js actually loads (per-submodel dtype map + external-data shards + JSON/tokenizer files), verified from the HF tree API. **Default WebGPU model is the smallest (`LFM2.5-VL-450M`); UI display order is smallest→largest: 450M → 3B.** The 1.6B repo is NOT included (re-verified against the installed transformers.js 4.2.0 dist): its HF tree ships ONNX files named `decoder_*`/`embed_images_*`/`embed_tokens_*`, but the `ImageTextToText` (lfm2_vl) session config requires exactly the keys `embed_tokens`, `decoder_model_merged`, `vision_encoder` — a grep of the dist bundle shows `decoder_model_merged` (23×) and `vision_encoder` (19×) but `embed_images` **0×**, so the 1.6B files can never resolve and the model cannot load. Inference follows the HF model card: `AutoModelForImageTextToText` + `AutoProcessor` (chat template + image tiling), `generate({ do_sample: false })`, slice + `batch_decode`.
| Backend | `LiquidAI/LFM2.5-VL-3B-GGUF` | GGUF Q4_K_M | ~1.67 GB (user's llama-server) |

**WebGPU download path** (`src/lib/model-cache.ts`): models are NEVER downloaded silently — the ONLY download entry point is the user-initiated "Manage models" dialog in Settings. The inference path in `src/lib/providers/webgpu.ts` gates on `cachedModelState` first and throws a clear "download it from Settings first" error when the model is not fully cached; `from_pretrained` (which would otherwise silently fetch missing files from Hugging Face) only ever runs on a complete cache. Models are NOT prefetched via `from_pretrained` for the download itself (transformers.js has no AbortSignal support there). Instead: HF tree API (`/api/models/{id}/tree/main?recursive=true`) lists files → filter by the per-model `filePatterns` in `model-catalog.ts` (matching exactly the files `from_pretrained` resolves for that model's dtype map, incl. `_onnx_data(_N)?` shards) → each file is fetched with `AbortController` + streamed chunk-by-chunk (progress + speed per chunk) → stored in the Cache API under key `https://huggingface.co/{modelId}/resolve/main/{filename}` (transformers.js's default `env.cacheKey` cache name is `transformers-cache`) → the prefetch then reports a `loading` phase while `from_pretrained` loads weights into WebGPU (first run compiles shaders, can take minutes — the UI shows a spinner for this phase instead of a frozen bar). Speed display is clamped to a 10 GB/s sanity cap. `cachedModelState` verifies ALL required files are present (a partial cache is reported as not downloaded, and re-download skips already-cached files).

## Architecture

### Dual Inference Mode

```
User uploads photo
        │
        ├── WebGPU mode ──→ transformers.js runs model in browser (ONNX)
        │                   Model downloaded from HuggingFace CDN
        │                   Runs on user's GPU, zero server cost
        │
        └── API mode ────→ POST to user's llama-server (GGUF)
                            User configures API URL in settings
                            Runs on user's own hardware
```

### Dual Deployment Mode

```
Same codebase (Next.js static export)
        │
        ├── Local dev ─────→ npm run dev (localhost:3000)
        │                     Full functionality including API routes
        │
        ├── Cloudflare Pages → Static hosting (recommended for public demo)
        │   (Free)            WebGPU mode: full support
        │                     API mode: user enters own llama-server URL
        │                     No server-side processing needed
        │
        └── HF Static Spaces → AI community exposure
            (Free)            WebGPU mode: full support
                              API mode: same as Cloudflare Pages
```

**Key insight:** WebGPU runs entirely in the user's browser. The hosting platform (Cloudflare Pages / HF Spaces) only serves static HTML/JS/CSS files. No server-side GPU or compute is needed.

### Extensible Provider System

All AI backends implement the `AIProvider` interface. Currently implemented:
- `llama-server` — local llama-server via OpenAI-compatible API

Planned (skeleton only, not functional):
- `openai` — GPT-4o via OpenAI API
- `claude` — Claude via Anthropic API
- `grok` — Grok via xAI API
- `openrouter` — Multi-model gateway

### Provider Interface

```typescript
interface AIProvider {
  id: string
  name: string
  requiresApiKey: boolean
  supportsVision: boolean
  enabled: boolean
  configSchema: ConfigField[]
  analyze(request: AnalysisRequest, config: ProviderConfig): Promise<AnalysisResponse>
  testConnection(config: ProviderConfig): Promise<boolean>
}
```

Shared provider helpers: `src/lib/providers/system-prompt.ts` (privacy analysis prompt + `buildUserPrompt(exif)`) and `src/lib/providers/utils.ts` (`fileToDataURL`, `parseAnalysisJson`, `parseAnalysisResilient`). The shared types (`AIProvider`, `AnalysisRequest`, `AppSettings`, …) live in `src/lib/types.ts`.

**Resilient parsing:** both live providers (WebGPU, llama-server) call `parseAnalysisResilient`, not the strict `parseAnalysisJson`. Weak small models (verified: LFM2.5-VL-450M) follow the image-observation instruction but drop the JSON-only requirement and return prose — the resilient parser falls back to the raw text as a single paragraph (empty table renders as “No structured findings.” in `DataTableView`). Error messages from the strict parser include a 300-char excerpt of the model output for diagnosis. Full `{paras, table}` output requires a stronger model (LFM2.5-VL-3B or the user's Qwen3.5-9B-VL).

## System Prompt (Privacy Analysis)

Used by both WebGPU and llama-server providers. **Status (Step 7.6, 2026-09):** attempt 1 (full rewrite: 9-group `"Group: item"` schema + confidence tags + 12-word cap) was REVERTED after owner testing — strong backends (Gemma4-12B / Qwen3.6-35B-VL) stopped performing location analysis entirely. Attempt 2 (current, deployed) is ADDITIVE: the original prompt below is preserved verbatim (owner: it meets ~70% of requirements and is the baseline), with a "Go deeper" addendum appended for per-person appearance, personality/interests, income signals, brands, culture/beliefs (visible evidence only), multi-person relationships, habits. Deliberate constraints from the attempt-1 post-mortem: no global length cap (the 12-word cap starved location), no "concise above all" framing, no confidence-tag format (baseline already asks the model to mark guessing vs. certain), no changed table key format, skip-if-no-evidence applies to the deeper layer only, and an explicit "start with what is certain (place, setting, who is present)" guardrail.

```
You are an AI assistant that analyzes photos and infers what private information an observer could gather. Based on the image, provide your analysis in the following JSON format:

{
  "paras": [
    "Paragraph 1: Detailed observation about what can be inferred...",
    "Paragraph 2: Additional inferences..."
  ],
  "table": {
    "Category": "Inferred detail",
    "Another Category": "Another inferred detail"
  }
}

Guidelines:
- Describe what a person looking at this photo could learn about the subject
- Include inferences about: location, time, devices, activities, relationships, socioeconomic status, habits
- Be specific but speculative — note when you are guessing vs. certain
- Consider EXIF metadata if available (date, GPS, camera model)
- Do NOT identify specific individuals by name
- Output ONLY the JSON, no extra text

Go deeper — beyond the basics, an attentive observer also speculates:
- For EACH main person: apparent age range, build, grooming, and what their overall appearance signals
- Personality & interests: what clothing style, gear, and surroundings suggest about hobbies, tastes, and lifestyle
- Socioeconomic signals: housing, vehicle, device age/brand, and surroundings → income bracket and wealth level
- Brands: name brands, logos, or devices you can actually identify in the image
- Culture & beliefs: religion, nationality, or affiliation — only when visible evidence exists (clothing, jewelry, flags, symbols, tattoos); skip if there is none
- Relationships: if more than one main person appears, what they most likely are to each other (couple, parent and child, friends, colleagues) and what in the image suggests it
- Habits: lifestyle patterns the photo implies (early riser, urban commuter, etc.)

Rules for the deeper layer:
- Start with what is certain (place, setting, who is present) before moving to speculation
- Each inference should be one short sentence; skip a category when the image gives no visible evidence for it
- Do not invent what the image does not support

Remember: output ONLY the JSON object, no extra text.
```

Testing scope note (owner): 450M WebGPU model quality is out of scope (it exists only to prove WebGPU works); prompt iterations are judged on strong backends (Qwen3.6-35B-VL / Gemma4-12B).

## Known Gaps (to be closed before launch)

1. ~~Example photos are placeholders~~ — **done**: 4 real Pexels photos in `public/examples/` (free Pexels License; credits in `public/examples/CREDITS.md`, also shown under each thumbnail).
2. **System prompt depth (7.6 done, 2026-09)** — attempt 1 (full rewrite) regressed location analysis and was reverted; attempt 2 keeps the original prompt verbatim and appends a "Go deeper" addendum (per-person, personality, income, brands, culture, relationships, habits) — owner-verified on strong backends (Gemma4-12B / Qwen3.6-35B-VL).
3. **Reverse geocoding not wired** — `/api/reverse-geocode` exists but the UI never calls it; address display near the map is planned (TODO.md Step 7.7).
4. **WebGPU 450M = prose only** — works (user-verified) but cannot produce the JSON table; 3B or the user's llama-server backend is needed for full structured output.
5. ~~Deployment deferred~~ — **DEPLOYED (2026-09):** live on Cloudflare Pages; custom domains `https://wdus.avpclub.eu.org` (production) and `https://wdustesting.avpclub.eu.org` (testing) — two SEPARATE Pages projects (`what-do-you-see` / `what-do-you-see-test`) so routine deploys can never touch production. Owner-verified WebGPU (450M) and API mode (Gemma4-12B, thinking model) on the live site; both sites currently serve the same DEV-branch build (2026-09, after the no-silent-download fix). One-command deploy: `node scripts/deploy-pages.mjs` (test) / `--prod` (production, on request) — see TODO.md Phase 8.

## Development Conventions

### Code Style

- **No comments** unless explicitly requested by user
- Use TypeScript `interface` over `type` for object shapes
- Prefer named exports over default exports
- Use `async/await` over raw Promises
- File naming: `kebab-case` for files, `PascalCase` for components

### File Organization

- `src/lib/` — Pure logic, no React
- `src/components/` — React components (one component per file)
- `src/hooks/` — Custom React hooks
- `src/app/` — Next.js App Router pages and API routes
- `src/app/api/` — Backend API routes

### API Routes

- `POST /api/analyze` — Unified photo analysis entry point (routes to active provider)
- `GET /api/reverse-geocode` — Coordinates → address via Nominatim. **Currently not wired to the UI** (map shows a marker only, no address). Plan (TODO.md Step 7.7): display the resolved address with the map — via this proxy in self-hosted builds, or by calling Nominatim directly from the browser in static exports (user-initiated request, consistent with the privacy policy).

These routes only exist in **self-hosted** builds. They are incompatible with static export (`output: 'export'`) because they read the `Request`; `npm run build:export` temporarily moves `src/app/api` out of the tree during the build (see Build & Run).

### State Management

- React Context for global state (inference mode, active provider)
- `localStorage` for settings persistence
- Cache API for WebGPU model files (`src/lib/model-cache.ts`)

### UI Guidelines

- Dark theme by default (matches original site)
- Material Design components via MUI
- Responsive: mobile-first, breakpoints at `sm`, `lg`, `xl`, `3xl`
- Loading states for all async operations
- Error boundaries for graceful failure

## Privacy Rules

1. **Zero external requests** by default — all processing local
2. **No analytics** — no PostHog, Sentry, Google Analytics, or any tracking
3. **No cookies** — settings stored in localStorage only
4. **No telemetry** — no error reporting to external services
5. **Model downloads** — user must explicitly confirm before any download
6. **API keys** — stored in localStorage only, never sent anywhere except the configured provider endpoint

## Build & Run

```bash
# Install dependencies
npm install

# Development (default port 3000)
npm run dev

# Production build — self-hosted (keeps API routes, run with `next start`, default port 3000)
npm run build
npm start

# Production build — static export for Cloudflare/HF (excludes API routes)
npm run build:export

# Optional — HTTPS test server (secure context so WebGPU works when the app is
# reached over a LAN IP; self-signed cert generated at scripts/.devcert/ on first run)
node scripts/https-test-server.mjs   # https://<lan-ip>:3443 -> http://127.0.0.1:3000 (override: PROXY_TARGET, HTTPS_PORT)

# NOTE (this host only): the dev/production servers above are conventionally
# run on non-default ports here because 3000 is occupied by a docker proxy —
# see LOCAL-TEST-NOTES.md. The scripts accept env overrides (PROXY_TARGET,
# HTTPS_PORT) and Next.js' own -p flag when a port is taken.

# Optional (local dev testing only) — the app connects to the user's OWN llama-server;
# we never host or launch one. Vision requires the mmproj projector: llama-server -m <model>.gguf --mmproj <mmproj>.gguf --port 8080
```

**Dual build mode:** `next.config.ts` reads `NEXT_STATIC_EXPORT=1` to toggle `output: 'export'`. The `build:export` script wraps `next build`, moving `src/app/api` out of the app tree first (it cannot be compiled into a static export) and restoring it afterwards. Both builds share the same source; only the output differs.

**Pitfall:** `build:export` deletes `.next/dev` before building — stale dev-server type validators (`.next/dev/types/validator.ts`) reference the API routes and fail type-check once the routes are moved.

## Deployment

### Local Development
```bash
npm run dev        # Full functionality with API routes
```

### Cloudflare Pages (Recommended for Public Demo)
```bash
node scripts/deploy-pages.mjs      # default: TEST — https://wdustesting.avpclub.eu.org
node scripts/deploy-pages.mjs --prod  # PRODUCTION — https://wdus.avpclub.eu.org (only on owner request)
```
- **Two-project policy (owner decision):** every Pages deployment updates ALL domains attached to that project, so the test and production domains live in SEPARATE projects: `what-do-you-see-test` → `wdustesting.avpclub.eu.org` (testing) and `what-do-you-see` → `wdus.avpclub.eu.org` (production). **Default runs deploy to TEST only; never deploy to production unless the owner explicitly asks** (then pass `--prod`).
- Free: unlimited bandwidth, 500 builds/month; custom domain free
- API routes: NOT available (static only, API mode uses user's own server)
- WebGPU mode: fully supported (runs in user's browser)
- Both sites live; owner-verified WebGPU (450M) + API mode (Gemma4-12B) on them

### Git Remotes & Push Policy
- `forgejo` → `ssh://fg/lawliet/WhatDoYouSee.git` (Forgejo, private)
- `github` → `git@github.com:Lawlietr/WhatDoYouSee.git` (GitHub)
- **Every commit is pushed to BOTH remotes** (owner decision), whichever branch it is on (routine work happens on `DEV`): `git push forgejo <branch> && git push github <branch>`
- **Pages deploys must only touch the test site by default** (`node scripts/deploy-pages.mjs`); production (`wdus`) gets `--prod` only on explicit owner request. The script passes `--branch main` to wrangler so deploys from any local branch (e.g. DEV) still produce PRODUCTION deployments of the target project — without it, a non-`main` local branch creates a PREVIEW deployment that the custom domain never serves.
- GitHub icon in the site header links to the GitHub repo (constant in `src/lib/site.ts`)

### Hugging Face Static Spaces
```bash
npm run build:export    # Static export to /out
# Upload /out contents to HF Static Space repo
```
- Free: unlimited
- Good for AI community visibility
- Same limitations as Cloudflare Pages (static only)

### Self-Hosted (Full Functionality)
```bash
npm run build && npm start
# Or: docker-compose up
# Full API routes + llama-server integration
```

## Configuration

No `.env` files. All runtime configuration lives in the browser:
- User settings (inference mode, provider base URL, model) → localStorage via `src/lib/settings-manager.ts`
- Built-in defaults → `src/lib/providers/defaults.ts` (llama-server `model` default is empty = auto-detect from the user's server `/v1/models`)
- The llama-server Model field accepts any id the server routes on — a model preset name (from `--models-preset <file>.ini`), an `-hf` repo id, a `--alias`, or the loaded GGUF filename stem. `fetchAvailableModels()` in `src/lib/providers/llama-server.ts` lists them for the settings UI.
- llama-server requests are capped via `AbortController` + `setTimeout` (not `AbortSignal.timeout`, for compatibility): 10 s for the `/v1/models` connection probe, 10 min for `/chat/completions` (vision inference can take minutes on modest hardware).
- If the llama-server was started with `--api-key`, the settings UI has an optional API Key field for llama-server; it is sent as `Authorization: Bearer <key>` on `/v1/models` and `/v1/chat/completions`. Stored in localStorage only.
- The only build-time env var is `NEXT_STATIC_EXPORT` (read by `next.config.ts` and `scripts/build-export.mjs`)
## Common Tasks

### Add a new AI Provider

1. Create `src/lib/providers/{provider-id}.ts` (reuse `system-prompt.ts` / `utils.ts` helpers)
2. Implement `AIProvider` interface (set `enabled: true` when functional)
3. Register in `src/lib/providers/registry.ts`
4. Add config defaults in `src/lib/providers/defaults.ts`

### Add UI language support

1. Add translations to `src/lib/i18n/translations.ts`
2. Update `LanguageProvider` context

### Change default model

1. Update `DEFAULT_WEBGPU_MODEL` or the llama-server entry in `src/lib/providers/defaults.ts`
2. If the model is new, add it to `WEBGPU_MODELS` in `src/lib/model-catalog.ts` (id + verified sizeBytes) so the download dialog knows its size
3. Update model list/placeholder in the corresponding provider file

### Deploy to Cloudflare Pages

One command (builds the static export, verifies `/out`, creates the target project if missing, deploys, and ensures its custom domain):

```bash
node scripts/deploy-pages.mjs             # default = TEST (wdustesting) — use this for all routine deploys
node scripts/deploy-pages.mjs --prod      # PRODUCTION (wdus) — ONLY when the owner explicitly asks
node scripts/deploy-pages.mjs --no-domain # skip the domain step
```

- **Two-project policy:** `what-do-you-see-test` → `wdustesting.avpclub.eu.org`; `what-do-you-see` → `wdus.avpclub.eu.org`. A Pages deployment updates every domain on its project, which is why the domains are split across two projects. Default runs must never touch production.
- **Secrets policy:** `scripts/deploy-pages.mjs` contains NO credentials. wrangler reads `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` from the environment; the script refuses to run if either is missing and never prints their values. No `wrangler login` needed.
- Domain step uses the REST API directly (zone `avpclub.eu.org` is proxied through Cloudflare): `POST /accounts/{acct}/pages/projects/{project}/domains` with body `{"name": "<domain>"}` (field is `name`, NOT `domain`; legacy `/custom-domains` endpoint gone). **Delete** a domain with `DELETE .../domains/{domain-name}` (the domain NAME, not the UUID — the UUID form 404s). CNAME must point to the owning project's `*.pages.dev` alias; TLS cert is auto-issued; all steps idempotent.
- If a local `next start` is running (port 3000/3103), restart it after the deploy (the script prints a warning).

### Deploy to HF Static Spaces

1. Run `npm run build` to generate `/out` directory
2. Create HF Static Space repo
3. Upload `/out` contents to repo
4. Verify at `https://huggingface.co/spaces/{username}/what-do-you-see`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
