import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      strict: true,
      allow: [process.cwd()]
    }
  },
  optimizeDeps: {
    include: ["@vitejs/plugin-react", "react", "react-dom", "axios", "lucide-react"]
  }
});
