import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://49.235.172.63:3100",
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
  clearScreen: false,
});
