import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Spotify rejects "localhost" redirect URIs; the loopback IP is allowed.
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 5173, strictPort: true },
});
