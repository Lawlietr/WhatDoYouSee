# Phase 7: Testing & Polish — 實施細節

> 本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## 本地測試環境

> **Local test setup** (LLM endpoint URL, API key, model name, etc.) lives in `LOCAL-TEST-NOTES.md` — gitignored, never committed, because this project is planned for open-sourcing. The test photo is at `public/test-photos/arc-de-triomphe.jpg` (Flickr C.C.; empty EXIF, so it also exercises the no-GPS map fallback).

## Step 7.1: Functional Testing (✅ 大部分完成)
- Test WebGPU mode with real photo (user-verified: LFM2.5-VL-450M inference OK in real browser; pipeline also confirmed via transformers.js wasm backend on the server)
- Test API mode with llama-server running (user-verified: Qwen3.5-9B-VL endpoint works; llama-server runs with `--cors-origins *` so the browser can call it directly)
- Test EXIF parsing with various image formats — JPG verified (user, 2026-09); **PNG/HEIC still untested**
- Test model download → confirm → progress → completion (Playwright E2E + user's 771 MB 450M download)
- Test model download cancellation (Playwright E2E)
- Test settings persistence across page refreshes (Playwright E2E)
- Test provider switching (Playwright E2E)
- Test connection test with valid/invalid URLs (Playwright E2E + user)
- Test map display with/without GPS data (user-verified: GPS photo shows marker at correct location on 450M run; no-GPS dashed fallback verified in E2E)
- Test mobile responsive layout (user, 2026-09: verified on real iPhone + iPad devices)

## Step 7.2: Error Handling (已取消 — owner 決定不排期：錯誤路徑難以在無 GPU/受限環境中穩定重現與測試)

- Network errors → user-friendly toast notification
- Model download failure → retry option
- WebGPU not supported → clear message + fallback suggestion
- EXIF parsing failure → continue without metadata
- Invalid image format → error message
- Backend unreachable → "Check if llama-server is running"

## Step 7.3: Performance (待辦)
- Lazy load map component (no Leaflet bundle until needed)
- Debounce settings saves
- Virtual list for large analysis results
- Image preview optimization (object URLs, not base64)

## Step 7.4: UI Polish (待辦)
- Smooth transitions between states (upload → analyzing → results)
- Dark theme consistency (no light mode flash)
- Loading skeleton for analysis results
- Empty state illustrations
- Keyboard shortcuts (Esc to close settings, etc.)

## Step 7.5: Example Photos (✅ DONE)
- Replaced the 4 program-generated gradient placeholders in `public/examples/` with 4 real Pexels photos (`street.jpg` Shibuya night, `interior.jpg` studio laptop, `outdoors.jpg` alpine hike, `selfie.jpg` café) — Pexels License (free use, no attribution required); attribution kept in `public/examples/CREDITS.md` and rendered under each thumbnail
- All photos chosen for rich inferable content (landmark/neon, workspace, hiking gear, café + phone)

## Step 7.6: Prompt & Data-Table Refinement (✅ 完成，owner-verified)

- Observation: the original site's analysis reaches much deeper inferences — personal interests, estimated income, religion, brands of bags/clothing, etc. The current system prompt is generic ("location, time, devices, activities, relationships, socioeconomic status, habits").
- ~~Attempt 1 (2026-09, REVERTED)~~: the aggressive rewrite (9-group `"Group: item"` flat keys, confidence tags, per-person/personality/income/brands/culture/relationships/habits, 12-word cap) was deployed, but owner testing on Gemma4-12B / Qwen3.6-35B-VL showed **location analysis stopped entirely**. Reverted to the original prompt (both `system-prompt.ts` and the grouped `DataTableView` restored). Lesson: rewriting the whole prompt changes baseline behavior; the enrichment must be ADDITIVE on top of the working prompt, keeping location/basic observation intact
- Attempt 2 (implemented 2026-09, deployed): original prompt preserved VERBATIM (owner: it meets ~70% of requirements = the baseline to extend), with an additive "Go deeper" section appended: per-person appearance, personality/interests, income signals, brands, culture/beliefs (visible-evidence-only skip rule), multi-person relationships, habits. Post-mortem constraints applied: NO global length cap, NO "concise above all" framing, NO confidence-tag format, NO table key format change (the addendum's category names serve as natural table keys), skip-rule scoped to the deeper layer, explicit "start with what is certain (place, setting, who is present)" guardrail, JSON-only re-asserted at the end for recency
- Owner test (2026-09, PASSED): owner ran the deployed attempt 2 on strong backends (Gemma4-12B / Qwen3.6-35B-VL) and confirmed the result meets requirements — location analysis intact, deeper categories working, output concise.
- Note: 450M is out of quality scope (owner 2026-09: it exists only to prove WebGPU works; prose-only output is expected). Bigger WebGPU models (e.g. Qwen2.5-VL 2B/4B) are a later OPTIONAL add. Prompt iterations are judged on strong backends (Qwen3.6-35B-VL / Gemma4-12B).

## Step 7.7: [OPTIONAL] Reverse geocoding (map address display) — 已取消 (2026-09, owner 評估後認為實用價值不高；實作細節保留於此供未來參考)

- Decision (owner, 2026-09): the map marker alone is considered sufficient; this is a **nice-to-have**, not a launch requirement. Implement only if time permits or a user asks for it.
- Current state: `GET /api/reverse-geocode` (Nominatim) exists in Phase 2 but the UI never calls it.
- Plan (if implemented):
  - Show the resolved address next to/below the map when GPS is present
  - **Self-hosted build**: call the existing `/api/reverse-geocode` proxy (keeps the in-memory cache)
  - **Static export (Cloudflare/HF)**: API routes don't exist — call Nominatim directly from the browser (`format=jsonv2`); this is a user-initiated request the user explicitly made by uploading a photo with GPS, consistent with the privacy policy; respect Nominatim usage policy (browser sends Referer automatically)
  - Graceful fallback: if geocoding fails or is slow, the map still renders (address line hidden)
