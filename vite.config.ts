import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前环境下的 .env 变量
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1421,
      strictPort: true,
      host: "127.0.0.1",
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
      proxy: {
        "/api": {
          // 优先使用环境变量 VITE_API_PROXY_TARGET，否则默认指向本地开发后端
          target: env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3100",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
        "/doubao": {
          target: "https://ark.cn-beijing.volces.com/api/v3",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/doubao/, ""),
        },
      },
    },
  };
});
