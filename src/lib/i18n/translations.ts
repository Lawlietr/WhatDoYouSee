export type Language = "en" | "zh-TW";

export interface Messages {
  "site.tagline": string;

  "page.title": string;
  "page.subtitle": string;
  "page.subtitleModeWebgpu": string;
  "page.subtitleModeApi": string;
  "page.githubAria": string;
  "page.settingsAria": string;
  "page.retry": string;
  "page.analyzedWith": string;
  "page.location": string;
  "page.analyzeAnother": string;
  "page.footer": string;

  "common.cancel": string;
  "common.done": string;
  "common.active": string;
  "common.downloaded": string;
  "common.downloadCancelled": string;
  "common.downloadFailed": string;
  "common.analysisFailed": string;

  "settings.title": string;
  "settings.language": string;
  "settings.inferenceMode": string;
  "settings.modeWebgpu": string;
  "settings.modeApi": string;
  "settings.save": string;

  "webgpu.checking": string;
  "webgpu.insecure": string;
  "webgpu.unsupported": string;
  "webgpu.available": string;
  "webgpu.status": string;
  "webgpu.downloaded": string;
  "webgpu.partial": string;
  "webgpu.notDownloaded": string;
  "webgpu.cacheLocation": string;
  "webgpu.manageModels": string;
  "webgpu.clearCache": string;
  "webgpu.clearTitle": string;
  "webgpu.clearBody": string;
  "webgpu.clearing": string;
  "webgpu.clear": string;
  "webgpu.useModel": string;
  "webgpu.download": string;
  "webgpu.errNotCached": string;
  "webgpu.errNoImage": string;
  "webgpu.errInfer": string;
  "webgpu.errNoOutput": string;
  "webgpu.thinking": string;
  "webgpu.thinkingHelper": string;

  "download.loadingTitle": string;
  "download.loadingBody": string;
  "download.title": string;
  "download.starting": string;
  "download.eta": string;
  "download.cancelAria": string;

  "provider.label": string;
  "provider.comingSoon": string;
  "provider.notImplemented": string;
  "provider.baseUrl": string;
  "provider.baseUrlPlaceholder": string;
  "provider.baseUrlHelper": string;
  "provider.model": string;
  "provider.modelPlaceholder": string;
  "provider.modelHelper": string;
  "provider.apiKey": string;
  "provider.apiKeyPlaceholder": string;

  "form.required": string;
  "form.invalidUrl": string;
  "form.showKey": string;
  "form.hideKey": string;
  "form.detecting": string;
  "form.detect": string;
  "form.enterUrlFirst": string;
  "form.noModels": string;
  "form.reachFailed": string;
  "form.modelHint": string;

  "conn.testing": string;
  "conn.test": string;
  "conn.success": string;
  "conn.failed": string;
  "conn.keyNote": string;
  "conn.hintLlama": string;
  "conn.hintWebgpu": string;
  "conn.hintDefault": string;

  "llama.noModels": string;

  "upload.title": string;
  "upload.hint": string;
  "upload.formats": string;
  "upload.change": string;
  "upload.clearAria": string;

  "examples.try": string;
  "examples.parade": string;
  "examples.family": string;
  "examples.walk": string;
  "examples.familyBed": string;
  "examples.useAria": string;

  "exif.none": string;
  "exif.title": string;
  "exif.taken": string;
  "exif.location": string;
  "exif.camera": string;
  "exif.expand": string;
  "exif.collapse": string;

  "dialog.title": string;
  "dialog.format": string;
  "dialog.size": string;
  "dialog.source": string;
  "dialog.privacy": string;

  "result.description": string;
  "result.data": string;
  "result.viewAria": string;
  "result.descriptionAria": string;
  "result.dataAria": string;
  "data.none": string;
  "data.tableAria": string;

  "loading.1": string;
  "loading.2": string;
  "loading.3": string;
  "loading.4": string;
  "loading.5": string;
  "loading.6": string;

  "map.noGps": string;
  "map.street": string;
  "map.satellite": string;
}

export const SUPPORTED_LANGUAGES: Array<{ id: Language; label: string }> = [
  { id: "en", label: "English" },
  { id: "zh-TW", label: "繁體中文" },
];

export const translations: Record<Language, Messages> = {
  en: {
    "site.tagline": "Local, privacy-first photo analysis",

    "page.title": "What can a stranger tell from your photo?",
    "page.subtitle":
      "Upload a photo and the AI will list everything an observer could infer about you. Everything is processed {mode} — nothing is sent to a third party.",
    "page.subtitleModeWebgpu": "in your browser",
    "page.subtitleModeApi": "on your own server",
    "page.githubAria": "View source on GitHub",
    "page.settingsAria": "Open settings",
    "page.retry": "Retry",
    "page.analyzedWith":
      "Analyzed with {provider} ({model}) in {seconds}s",
    "page.location": "Location",
    "page.analyzeAnother": "Analyze another photo",
    "page.footer":
      "Inspired by ENTE’s theyseeyourphotos · runs entirely on your own hardware · AGPL-3.0",

    "common.cancel": "Cancel",
    "common.done": "Done",
    "common.active": "(active)",
    "common.downloaded": "Downloaded",
    "common.downloadCancelled": "Download cancelled.",
    "common.downloadFailed": "Download failed",
    "common.analysisFailed": "Analysis failed",

    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.inferenceMode": "Inference mode",
    "settings.modeWebgpu": "WebGPU (browser)",
    "settings.modeApi": "API (your server)",
    "settings.save": "Save",

    "webgpu.checking": "Checking WebGPU support...",
    "webgpu.insecure":
      "WebGPU is hidden because this page is not in a secure context (HTTP on a non-localhost address). Your browser may still support WebGPU — open the app via https://… or http://localhost… (e.g. an SSH tunnel) to enable it.",
    "webgpu.unsupported":
      "WebGPU is not available in this browser. Photos will be processed on your own hardware only via API mode.",
    "webgpu.available":
      "WebGPU available. Inference runs entirely in this browser — no data leaves your device.",
    "webgpu.status": "Status",
    "webgpu.downloaded": "Downloaded ({bytes} cached)",
    "webgpu.partial":
      "Partially downloaded ({bytes} of required files) — re-download to complete",
    "webgpu.notDownloaded": "Not downloaded",
    "webgpu.cacheLocation":
      "Cache location: this browser (Cache API + IndexedDB)",
    "webgpu.manageModels": "Manage models",
    "webgpu.clearCache": "Clear cache",
    "webgpu.clearTitle": "Clear model cache?",
    "webgpu.clearBody":
      "This deletes all downloaded WebGPU model files from this browser. They will be re-downloaded the next time they are needed.",
    "webgpu.clearing": "Clearing...",
    "webgpu.clear": "Clear",
    "webgpu.useModel": "Use this model",
    "webgpu.download": "Download ({size})",
    "webgpu.errNotCached":
      "Model {model} is not downloaded in this browser. Open Settings → “Manage models” to download it first — nothing is downloaded silently.",
    "webgpu.errNoImage": "No image data available for WebGPU analysis.",
    "webgpu.errInfer": "WebGPU inference failed: {detail}",
    "webgpu.errNoOutput": "WebGPU generate() returned no output.",
    "webgpu.thinking": "Thinking",
    "webgpu.thinkingHelper":
      "Qwen3.5 only — the model reasons before answering (slower, may improve output). Off by default.",

    "download.loadingTitle": "Loading {model} into WebGPU…",
    "download.loadingBody":
      "The first run compiles GPU shaders and loads weights into GPU memory. This can take several minutes — keep this tab open.",
    "download.title": "Downloading {model}",
    "download.starting": "Starting...",
    "download.eta": " — {duration} left",
    "download.cancelAria": "Cancel download",

    "provider.label": "Provider",
    "provider.comingSoon": " (coming soon)",
    "provider.notImplemented": "Not implemented yet",
    "provider.baseUrl": "Server",
    "provider.baseUrlPlaceholder": "http://<your-llama-server-host>:8080",
    "provider.baseUrlHelper":
      "host:port of your llama-server — the /v1 prefix is added automatically",
    "provider.model": "Model",
    "provider.modelPlaceholder":
      "preset name or model id from /v1/models (blank = auto-detect)",
    "provider.modelHelper":
      "baseUrl only needs host:port — /v1 is added automatically",
    "provider.apiKey": "API Key",
    "provider.apiKeyPlaceholder":
      "only if llama-server was started with --api-key",

    "form.required": "{label} is required",
    "form.invalidUrl": "Enter a valid URL (http:// or https://)",
    "form.showKey": "Show API key",
    "form.hideKey": "Hide API key",
    "form.detecting": "Detecting...",
    "form.detect": "Detect models",
    "form.enterUrlFirst": "Enter the server URL first",
    "form.noModels": "Server is reachable but has no loaded models.",
    "form.reachFailed": "Failed to reach the server",
    "form.modelHint":
      "You can type any model id the server routes on: a model preset name (--models-preset), an -hf repo id, a --alias, or the loaded GGUF file name. Leave empty to auto-detect.",

    "conn.testing": "Testing...",
    "conn.test": "Test connection",
    "conn.success": "Connected to {name} successfully.",
    "conn.failed": "Connection failed",
    "conn.keyNote":
      "API key is stored only in this browser and sent solely to the endpoint above.",
    "conn.hintLlama":
      "Common causes: (1) llama-server must be started with a --cors-origins flag — without it, browsers block cross-origin requests (restart it with --cors-origins '*'). (2) The server is unreachable from this browser (different network, firewall, or wrong address). (3) This page is served over HTTPS but the server is HTTP (mixed content) — localhost URLs are the only allowed exception.",
    "conn.hintWebgpu":
      "This browser does not expose the WebGPU API. Try a recent Chrome or Edge.",
    "conn.hintDefault": "Check the URL and credentials, then try again.",

    "llama.noModels":
      "No models loaded on the llama-server. Start it with -m/-hf or a models preset, or enter the model name in settings.",

    "upload.title": "Upload a photo",
    "upload.hint": "Drag & drop an image here, or click to browse",
    "upload.formats": "JPEG · PNG · WebP · HEIC",
    "upload.change": "Change",
    "upload.clearAria": "Clear photo",

    "examples.try": "Or try an example",
    "examples.parade": "Street parade",
    "examples.family": "Family gathering",
    "examples.walk": "A tree-lined walk",
    "examples.familyBed": "Mother and kids",
    "examples.useAria": "Use example photo: {label}",

    "exif.none": "No EXIF metadata found in this photo.",
    "exif.title": "Photo metadata",
    "exif.taken": "Taken",
    "exif.location": "Location",
    "exif.camera": "Camera",
    "exif.expand": "Expand metadata",
    "exif.collapse": "Collapse metadata",

    "dialog.title": "WebGPU Models",
    "dialog.format": "Format: {format}",
    "dialog.size": "Size: {size}",
    "dialog.source": "Source: {source}",
    "dialog.privacy":
      "Privacy notice: the model is downloaded from {source} and cached in your browser’s local storage (Cache API). It never leaves your device. Photos analyzed with it are processed entirely on your hardware — no image data is sent anywhere.",

    "result.description": "Description",
    "result.data": "Data",
    "result.viewAria": "Result view",
    "result.descriptionAria": "Description view",
    "result.dataAria": "Data view",
    "data.none": "No structured findings.",
    "data.tableAria": "Inferred data",

    "loading.1": "Analyzing photo metadata...",
    "loading.2": "Extracting location data...",
    "loading.3": "Detecting objects and patterns...",
    "loading.4": "Reviewing background details...",
    "loading.5": "Inferring personal information...",
    "loading.6": "Compiling findings...",

    "map.noGps":
      "No GPS data in this photo, so the location can’t be shown on a map.",
    "map.street": "Street",
    "map.satellite": "Satellite",
  },

  "zh-TW": {
    "site.tagline": "本地、隱私優先的相片分析",

    "page.title": "陌生人能從你的照片看出什麼？",
    "page.subtitle":
      "上傳一張照片，AI 會列出旁觀者能推斷出關於你的所有資訊。全部處理都在{mode}進行——不會傳送給任何第三方。",
    "page.subtitleModeWebgpu": "你的瀏覽器中",
    "page.subtitleModeApi": "你自己的伺服器上",
    "page.githubAria": "在 GitHub 檢視原始碼",
    "page.settingsAria": "開啟設定",
    "page.retry": "重試",
    "page.analyzedWith": "由 {provider}（{model}）分析完成，耗時 {seconds} 秒",
    "page.location": "位置",
    "page.analyzeAnother": "分析另一張照片",
    "page.footer":
      "靈感來自 ENTE 的 theyseeyourphotos · 完全在你的自有硬體上執行 · AGPL-3.0",

    "common.cancel": "取消",
    "common.done": "完成",
    "common.active": "（使用中）",
    "common.downloaded": "已下載",
    "common.downloadCancelled": "下載已取消。",
    "common.downloadFailed": "下載失敗",
    "common.analysisFailed": "分析失敗",

    "settings.title": "設定",
    "settings.language": "介面語言",
    "settings.inferenceMode": "推理模式",
    "settings.modeWebgpu": "WebGPU（瀏覽器）",
    "settings.modeApi": "API（你的伺服器）",
    "settings.save": "儲存",

    "webgpu.checking": "正在檢查 WebGPU 支援…",
    "webgpu.insecure":
      "此頁面不在安全情境中（非 localhost 位址使用 HTTP），因此 WebGPU 被隱藏。你的瀏覽器可能仍支援 WebGPU——請透過 https://… 或 http://localhost…（例如 SSH 隧道）開啟應用程式以啟用。",
    "webgpu.unsupported":
      "此瀏覽器不支援 WebGPU。相片將僅能透過 API 模式在你的自有硬體上處理。",
    "webgpu.available":
      "WebGPU 可用。推理完全在此瀏覽器中執行——資料不會離開你的裝置。",
    "webgpu.status": "狀態",
    "webgpu.downloaded": "已下載（快取 {bytes}）",
    "webgpu.partial": "部分下載（必要檔案中已下載 {bytes}）——請重新下載以補齊",
    "webgpu.notDownloaded": "尚未下載",
    "webgpu.cacheLocation": "快取位置：此瀏覽器（Cache API + IndexedDB）",
    "webgpu.manageModels": "管理模型",
    "webgpu.clearCache": "清除快取",
    "webgpu.clearTitle": "清除模型快取？",
    "webgpu.clearBody":
      "這將刪除此瀏覽器中所有已下載的 WebGPU 模型檔案。下次需要時會重新下載。",
    "webgpu.clearing": "清除中…",
    "webgpu.clear": "清除",
    "webgpu.useModel": "使用此模型",
    "webgpu.download": "下載（{size}）",
    "webgpu.errNotCached":
      "模型 {model} 尚未在此瀏覽器下載。請先開啟「設定 → 管理模型」下載——絕不會在未告知的情況下下載。",
    "webgpu.errNoImage": "沒有可用的影像資料可供 WebGPU 分析。",
    "webgpu.errInfer": "WebGPU 推理失敗：{detail}",
    "webgpu.errNoOutput": "WebGPU generate() 未產生任何輸出。",
    "webgpu.thinking": "思考模式",
    "webgpu.thinkingHelper":
      "僅 Qwen3.5 適用——模型先推理再回答（較慢，可能提升輸出品質），預設關閉。",

    "download.loadingTitle": "正在將 {model} 載入 WebGPU…",
    "download.loadingBody":
      "首次執行需編譯 GPU 著色器並把權重載入 GPU 記憶體，可能長達數分鐘——請保持這個分頁開啟。",
    "download.title": "正在下載 {model}",
    "download.starting": "開始中…",
    "download.eta": " — 剩餘 {duration}",
    "download.cancelAria": "取消下載",

    "provider.label": "供應商",
    "provider.comingSoon": "（即將推出）",
    "provider.notImplemented": "尚未實作",
    "provider.baseUrl": "伺服器",
    "provider.baseUrlPlaceholder": "http://<your-llama-server-host>:8080",
    "provider.baseUrlHelper": "你 llama-server 的 host:port——會自動加上 /v1 前綴",
    "provider.model": "模型",
    "provider.modelPlaceholder": "預設名稱或 /v1/models 的模型 id（留空＝自動偵測）",
    "provider.modelHelper": "baseUrl 只需填 host:port——會自動加上 /v1",
    "provider.apiKey": "API 金鑰",
    "provider.apiKeyPlaceholder": "僅在 llama-server 以 --api-key 啟動時需要",

    "form.required": "{label} 為必填",
    "form.invalidUrl": "請輸入有效的 URL（http:// 或 https://）",
    "form.showKey": "顯示 API 金鑰",
    "form.hideKey": "隱藏 API 金鑰",
    "form.detecting": "偵測中…",
    "form.detect": "偵測模型",
    "form.enterUrlFirst": "請先輸入伺服器 URL",
    "form.noModels": "伺服器可連線，但未載入任何模型。",
    "form.reachFailed": "無法連線到伺服器",
    "form.modelHint":
      "可輸入伺服器能路由的任何模型 id：模型預設名稱（--models-preset）、-hf 儲存庫 id、--alias，或已載入的 GGUF 檔名。留空則自動偵測。",

    "conn.testing": "測試中…",
    "conn.test": "測試連線",
    "conn.success": "已成功連線到 {name}。",
    "conn.failed": "連線失敗",
    "conn.keyNote": "API 金鑰僅儲存於此瀏覽器，且只會傳送至上述端點。",
    "conn.hintLlama":
      "常見原因：(1) llama-server 必須以 --cors-origins 參數啟動——否則瀏覽器會阻擋跨來源請求（請以 --cors-origins '*' 重新啟動）。(2) 伺服器無法從此瀏覽器連線（網路不同、防火牆或位址錯誤）。(3) 此頁面以 HTTPS 提供但伺服器是 HTTP（混合內容）——localhost URL 是唯一的例外。",
    "conn.hintWebgpu":
      "此瀏覽器未暴露 WebGPU API。請改用較新版本的 Chrome 或 Edge。",
    "conn.hintDefault": "請檢查 URL 與憑證後再試一次。",

    "llama.noModels":
      "llama-server 上未載入任何模型。請以 -m/-hf 或模型預設檔啟動，或在設定中輸入模型名稱。",

    "upload.title": "上傳照片",
    "upload.hint": "拖放圖片到這裡，或點選瀏覽",
    "upload.formats": "JPEG · PNG · WebP · HEIC",
    "upload.change": "更換",
    "upload.clearAria": "清除照片",

    "examples.try": "或試試範例",
    "examples.parade": "街頭遊行",
    "examples.family": "家庭聚會",
    "examples.walk": "林蔭步道",
    "examples.familyBed": "母親與孩子",
    "examples.useAria": "使用範例照片：{label}",

    "exif.none": "這張照片沒有 EXIF 元數據。",
    "exif.title": "照片元數據",
    "exif.taken": "拍攝時間",
    "exif.location": "位置",
    "exif.camera": "相機",
    "exif.expand": "展開元數據",
    "exif.collapse": "收合元數據",

    "dialog.title": "WebGPU 模型",
    "dialog.format": "格式：{format}",
    "dialog.size": "大小：{size}",
    "dialog.source": "來源：{source}",
    "dialog.privacy":
      "隱私聲明：模型從 {source} 下載並快取在瀏覽器的本地儲存（Cache API）中，絕不會離開你的裝置。用它分析的相片完全在你的硬體上處理——不會將任何影像資料傳送至任何地方。",

    "result.description": "描述",
    "result.data": "資料",
    "result.viewAria": "結果檢視",
    "result.descriptionAria": "描述檢視",
    "result.dataAria": "資料檢視",
    "data.none": "沒有結構化的分析結果。",
    "data.tableAria": "推斷出的資料",

    "loading.1": "正在分析照片元數據…",
    "loading.2": "正在提取位置資料…",
    "loading.3": "正在偵測物件與模式…",
    "loading.4": "正在檢視背景細節…",
    "loading.5": "正在推斷個人資訊…",
    "loading.6": "正在彙整分析結果…",

    "map.noGps": "這張照片沒有 GPS 資料，無法在地圖上顯示位置。",
    "map.street": "街道",
    "map.satellite": "衛星",
  },
};

export function normalizeLanguage(value: string): Language {
  return value === "zh-TW" ? "zh-TW" : "en";
}

export function getMessages(language: string): Messages {
  return translations[normalizeLanguage(language)];
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}
