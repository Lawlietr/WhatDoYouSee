# WhatDoYouSee

A single photo tells them more about you than you think.

> **Inspiration.** WhatDoYouSee is inspired by the *theyseeyourphotos* service by **ENTE**. It is an independent, privacy-first re-implementation — this project is not affiliated with, or endorsed by, ENTE. Where the original service processes photos on its servers, WhatDoYouSee is designed so that **your photos never have to leave your device**.

Upload a photo, and WhatDoYouSee analyzes what a sharp observer could infer about you — your location, your habits, your interests, your socioeconomic signals, the brands around you — and presents the result as narrative paragraphs plus a structured data table.

## Why it exists

Most photo-privacy tools show you *where* your photos were taken. The harder question is *who you are* — what a stranger, an advertiser, or an investigator could deduce from a single image. This project makes that inference visible, so you can see exactly what your photos reveal before you post them.

## Privacy by design

- **Zero third-party services.** No analytics, no tracking, no telemetry, no cookies. The app makes no external requests by default.
- **Inference stays with you.** Two inference modes, both under your control:
  - **WebGPU** — the AI model runs entirely in your browser, on your GPU. The photo never leaves the tab.
  - **API** — the photo is sent only to *your own* llama-server (or any OpenAI-compatible vision endpoint) that you explicitly configure.
- **No data collection.** Settings live in your browser's localStorage. Model weights are cached locally. Nothing is ever uploaded to a backend we operate, because we operate none.
- **The only external network traffic** is (a) model weight downloads from Hugging Face, which require your explicit confirmation and show size/progress, and (b) the endpoint *you* configure in API mode.

## Features

- Drag & drop or click to upload (HEIC/JPEG/PNG, client-side compression)
- Four curated example photos (Pexels license) to try instantly
- AI analysis as **paragraphs + data table** (location, time, person, socioeconomic signals, devices, brands, relationships, inferred habits)
- EXIF inspection (date, camera, GPS)
- Interactive map (street / satellite) when the photo has GPS coordinates
- WebGPU in-browser inference with model management (download, progress, cancel, switch between LFM2.5-VL-3B and LFM2.5-VL-450M)
- Bring-your-own backend: point the API mode at your own llama-server (OpenAI-compatible) — with connection testing and model auto-detection
- Dark theme, responsive layout, fully static-deployable

## Inference modes

| Mode | Where the model runs | Setup |
|------|---------------------|-------|
| **WebGPU** (default) | Your browser (ONNX via `@huggingface/transformers`) | Pick a model in settings → confirm download (~0.75 GB or ~3.7 GB) |
| **API** | Your own server (GGUF via llama-server) | Enter your server's address in settings (e.g. `192.168.1.50:8080`) |

**WebGPU model note:** small models (450M) are fast but may return prose-only analysis; larger models (3B) and strong backend models (e.g. Qwen vision-class 9B+) reliably produce the full paragraph + table output.

## Getting started

```bash
npm install
npm run dev -- -p 3100        # development server
```

### Production (self-hosted, full features)

```bash
npm run build
npm start -- -p 3103 -H 0.0.0.0
```

### Static export (Cloudflare Pages / Hugging Face Spaces)

```bash
npm run build:export          # produces /out (API routes excluded by design)
```

The static build keeps every feature that matters in the browser — WebGPU inference, EXIF, map, settings. The two API routes (`/api/analyze`, `/api/reverse-geocode`) exist only in self-hosted builds; in the static build, API mode talks directly to your own server and reverse geocoding calls Nominatim directly from the browser (a user-initiated request, consistent with the privacy model).

### Testing WebGPU over a LAN

WebGPU requires a secure context (HTTPS or localhost). For LAN testing:

```bash
npm run build && npm start -- -p 3103 -H 0.0.0.0
node scripts/https-test-server.mjs    # https://<your-lan-ip>:3443
```

A self-signed certificate is generated on first run; accept the browser warning once.

## Configuration

There are no `.env` files. All runtime configuration lives in the browser (settings drawer, top-right gear icon):

- Inference mode: WebGPU or API
- WebGPU model selection + model management
- API mode: server address (auto-normalized: `host:port` is fine), optional API key, model name (auto-detected from the server's `/v1/models`), connection test

Everything is persisted in localStorage on your machine.

## AI models

| Mode | Model | Format | Download size |
|------|-------|--------|---------------|
| WebGPU (default) | `LiquidAI/LFM2.5-VL-3B-ONNX` | ONNX (fp16 encoder + q4 decoder) | ~3.72 GB |
| WebGPU (optional) | `LiquidAI/LFM2.5-VL-450M-ONNX` | ONNX (fp16 encoder + q4 decoder) | ~0.75 GB |
| API (user's server) | Any vision model your llama-server runs (GGUF) | GGUF | n/a |

Model weights are downloaded from Hugging Face on demand, after explicit confirmation, and cached in the browser's Cache API. **Model weights are licensed separately by their respective owners and are not part of this repository or its license.**

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + **Material UI v9** (dark theme)
- **`@huggingface/transformers`** + WebGPU for in-browser inference
- **llama-server** (OpenAI-compatible API) for self-hosted backend inference
- **`exifr`** (EXIF), **`browser-image-compression`** (client-side compression), **`react-leaflet`** (map)

## Project structure

```
src/
├── app/                 # Next.js App Router (page, API routes)
├── components/          # React components (one per file)
│   └── settings/        # Settings drawer + provider config forms
├── hooks/               # useSettings, useProvider, usePhotoAnalysis, ...
└── lib/                 # Pure logic: providers, model cache, EXIF, settings
```

## Example photos

The four example photos are from [Pexels](https://www.pexels.com/), free under the Pexels License (no attribution required; credits provided in `public/examples/CREDITS.md`).

## Contributing

Contributions are welcome. Please keep the project's privacy guarantees intact: no analytics, no tracking, no third-party data collection, no new default external endpoints.

## License

WhatDoYouSee is licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](./LICENSE).

- You are free to use, study, modify, and share this project — including offering it as a network service — **provided that any modified version you share is also made available under AGPL v3**, with the corresponding source code (AGPL §13 extends source availability to network use).
- **Model weights** (LiquidAI LFM2.5-VL, and anything you run on your own backend) are licensed separately by their owners; this license covers the code in this repository only.
- **Example photos** are Pexels License.

In short: build on it, self-host it, run a service with it — just don't fork it closed.
