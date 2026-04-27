/// <reference types="vite/client" />

interface Window {
  __TAURI_INTERNALS__?: unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
