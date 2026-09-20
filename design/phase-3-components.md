# Phase 3: React Components — 實施細節

> 狀態: ✅ Done (3.1–3.6, db882f3)。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 3.1: Photo Upload Component
- Create `src/components/PhotoUpload.tsx`
- Drag & drop zone with visual feedback
- Click to open file picker
- Accept `image/*`
- Show preview after selection
- Call `onPhotoSelected(file: File)` callback
- Optional controlled `file` prop (Phase 6 parent owns the selected file; example clicks also render the preview)

## Step 3.2: Example Photos Component
- Create `src/components/ExamplePhotos.tsx`
- Display 4 example images in a 2x2 grid
- Click to select → trigger analysis
- Images from `/public/examples/`
- 4 real example photos from Pexels (free license; credits in `public/examples/CREDITS.md` + shown in UI) — the placeholder generator script was removed

## Step 3.3: EXIF Display Component
- Create `src/components/EXIFDisplay.tsx`
- Show parsed EXIF data: date, location, camera
- Graceful handling when data is missing
- Collapsible section

## Step 3.4: Analysis Result Components
- Create `src/components/AnalysisResult.tsx` — container with tabs
- Create `src/components/DescriptionView.tsx` — paragraph descriptions
- Create `src/components/DataTableView.tsx` — key-value data table
- Tab switcher: "Description" | "Data"

## Step 3.5: Map Component
- Create `src/components/MapView.tsx`
- Use react-leaflet with OpenStreetMap tiles
- Show marker at photo's GPS coordinates
- Satellite view layer
- Graceful fallback when no GPS data

## Step 3.6: Loading Animation
- Create `src/components/LoadingAnimation.tsx`
- Google-style bouncing colored dots
- Rotating loading messages: "Analyzing photo metadata...", "Extracting location data...", etc.
