import { invoke } from "@tauri-apps/api/core";
import type { RuntimeInfo } from "./types";

export function isTauriRuntime() {
  return Boolean(window.__TAURI_INTERNALS__);
}

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  if (!isTauriRuntime()) {
    return {
      platform: "browser",
      arch: "unknown",
      tauriVersion: "preview",
      version: "1.0.0",
    };
  }

  return invoke<RuntimeInfo>("get_runtime_info");
}
