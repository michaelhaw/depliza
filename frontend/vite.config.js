import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-build-to-backend",
      closeBundle() {
        const source = path.resolve(__dirname, "dist");
        const destination = path.resolve(__dirname, "../backend/frontend/dist");

        // Ensure destination directory exists
        fs.mkdirSync(destination, { recursive: true });

        // Copy files from dist to backend/frontend/dist
        fs.cpSync(source, destination, { recursive: true });

        console.log(`Build files copied to ${destination}`);
      },
    },
  ],
});
