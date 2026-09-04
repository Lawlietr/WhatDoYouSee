# AGENTS.md — They See Your Photo (Local Clone)

## Project Overview

A local, privacy-first clone of [theyseeyourphotos.com](https://theyseeyourphotos.com/).
Upload a photo → AI analyzes what private information can be inferred → results shown as paragraphs + data table.

**Key difference from original:** All data stays local. No third-party analytics, no tracking, no data collection.

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
| Model Storage | IndexedDB (browser cache) |
| Settings | localStorage |

## AI Models

| Mode | Model ID | Format | Size |
|------|----------|--------|------|
| WebGPU | `LiquidAI/LFM2.5-VL-3B-ONNX` | ONNX Q4 | ~1.7 GB |
| Backend | `LiquidAI/LFM2.5-VL-3B-GGUF` | GGUF Q4_K_M | ~1.67 GB |

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

Shared provider helpers: `src/lib/providers/system-prompt.ts` (privacy analysis prompt + `buildUserPrompt(exif)`) and `src/lib/providers/utils.ts` (`fileToDataURL`, `parseAnalysisJson`). The shared types (`AIProvider`, `AnalysisRequest`, `AppSettings`, …) live in `src/lib/types.ts`.

## System Prompt (Privacy Analysis)

Used by both WebGPU and llama-server providers. To be refined during testing.

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
```

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
- `GET /api/reverse-geocode` — Coordinates → address via Nominatim

These routes only exist in **self-hosted** builds. They are incompatible with static export (`output: 'export'`) because they read the `Request`; `npm run build:export` temporarily moves `src/app/api` out of the tree during the build (see Build & Run).

### State Management

- React Context for global state (inference mode, active provider)
- `localStorage` for settings persistence
- `IndexedDB` for model file caching

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

# Development
npm run dev -- -p 3100   # port 3000 is occupied by a docker proxy on the dev machine

# Production build — self-hosted (keeps API routes, run with `next start`)
npm run build
npm start

# Production build — static export for Cloudflare/HF (excludes API routes)
npm run build:export

# Optional: start llama-server backend
llama-server -hf LiquidAI/LFM2.5-VL-3B-GGUF:Q4_K_M --port 8080
```

**Dual build mode:** `next.config.ts` reads `NEXT_STATIC_EXPORT=1` to toggle `output: 'export'`. The `build:export` script wraps `next build`, moving `src/app/api` out of the app tree first (it cannot be compiled into a static export) and restoring it afterwards. Both builds share the same source; only the output differs.

## Deployment

### Local Development
```bash
npm run dev        # Full functionality with API routes
```

### Cloudflare Pages (Recommended for Public Demo)
```bash
npm run build:export    # Static export to /out (API routes auto-excluded)
npx wrangler pages deploy ./out --project-name=they-see-your-photo
# Live at: https://they-see-your-photo.pages.dev
```
- Free: unlimited bandwidth, 500 builds/month
- Custom domain: free
- API routes: NOT available (static only, API mode uses user's own server)
- WebGPU mode: fully supported (runs in user's browser)

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

## Environment Variables

```env
# .env.local (optional, all have defaults)
LLAMA_SERVER_URL=http://localhost:8080/v1
DEFAULT_WEBGPU_MODEL=LiquidAI/LFM2.5-VL-3B-ONNX
DEFAULT_BACKEND_MODEL=liquidai/lfm2.5-vl-3b-gguf
```

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

1. Update `DEFAULT_WEBGPU_MODEL` or `DEFAULT_BACKEND_MODEL` in `.env.local`
2. Update model list in the corresponding provider file

### Deploy to Cloudflare Pages

1. Run `npm run build` to generate `/out` directory
2. Install wrangler: `npm install -g wrangler`
3. Authenticate: `wrangler login`
4. Deploy: `wrangler pages deploy ./out --project-name=they-see-your-photo`
5. Verify at `https://they-see-your-photo.pages.dev`

### Deploy to HF Static Spaces

1. Run `npm run build` to generate `/out` directory
2. Create HF Static Space repo
3. Upload `/out` contents to repo
4. Verify at `https://huggingface.co/spaces/{username}/they-see-your-photo`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
