// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import dotenv from "dotenv";

dotenv.config();

const hmrHost = process.env.HMR_HOST || "localhost";
const hmrClientPort = process.env.HMR_CLIENT_PORT
  ? parseInt(process.env.HMR_CLIENT_PORT)
  : 5173;
const hmrServerPort = process.env.HMR_SERVER_PORT
  ? parseInt(process.env.HMR_SERVER_PORT)
  : undefined;
const hmrProtocol = process.env.HMR_PROTOCOL || "ws";
const allowedHosts = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(",")
  : [".even-better-preview.local"];

console.log("--- Vite HMR Configuration ---");
console.log(`Host: ${hmrHost}`);
console.log(`Client Port: ${hmrClientPort}`);
console.log(`Server Port: ${hmrServerPort || "(default)"}`);
console.log(`Protocol: ${hmrProtocol}`);
console.log("------------------------------");

// https://astro.build/config
export default defineConfig({
  site: "https://asdfle3rd.github.io",
  base: "/better-preview",
  output: "static",
  outDir: "docs",
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        // This forces Sharp to shout if it fails
        limitInputPixels: false,
      },
    },
  },
  integrations: [react(), tailwind()],
  server: {
    host: true,
  },
  vite: {
    logLevel: "error",
    server: {
      allowedHosts: allowedHosts,
      // fs: {
      //   // Allow serving files from the project root
      //   allow: ["/"],
      // },
      hmr: {
        host: hmrHost,
        clientPort: hmrClientPort,
        port: hmrServerPort, // If undefined, Vite uses the server.port
        protocol: hmrProtocol,
      },
    },
    resolve: {
      dedupe: ["react", "react-dom", "gsap"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "gsap", "@gsap/react"],
    },
  },
});
