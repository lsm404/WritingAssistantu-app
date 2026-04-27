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
    };
  }

  return invoke<RuntimeInfo>("get_runtime_info");
}
