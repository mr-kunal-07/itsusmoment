// vite.config.ts
import { defineConfig } from "file:///C:/Users/Pinky/OneDrive/Desktop/oohpoint/usmonent/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Pinky/OneDrive/Desktop/oohpoint/usmonent/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Pinky/OneDrive/Desktop/oohpoint/usmonent/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/Pinky/OneDrive/Desktop/oohpoint/usmonent/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Pinky\\OneDrive\\Desktop\\oohpoint\\usmonent";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  build: {
    // Increase chunk size warning limit (many icon imports are expected)
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks for better long-term caching
        manualChunks: {
          // React core — changes least often → cached longest
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // UI — Radix primitives (large but stable)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider"
          ],
          // Charts (recharts) — loaded only on admin/analytics views
          "vendor-charts": ["recharts"],
          // Map (leaflet) — loaded only on travel map view
          "vendor-map": ["leaflet"],
          // Animation
          "vendor-motion": ["framer-motion"],
          // Utilities
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority"]
        }
      }
    },
    // Enable source maps in production for error monitoring
    sourcemap: false,
    // Minify aggressively
    minify: "esbuild",
    target: "es2020"
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Inject push SW handler into the generated service worker
        importScripts: ["/push-sw.js"],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Limit cache size to prevent stale bloat on mobile devices
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // 3 MB
        runtimeCaching: [
          {
            // Google Fonts — cache long-term (fonts don't change)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Storage media (images/videos/audio) — cache aggressively client-side
            // Reduces Supabase egress bandwidth significantly at scale
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-media-cache",
              expiration: {
                maxEntries: 300,
                // up from 200
                maxAgeSeconds: 60 * 60 * 24 * 60
                // 60 days
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Supabase REST API — NetworkFirst with short TTL
            // Falls back to cache when offline or slow
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 2 },
              // 2 min TTL
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Supabase Auth endpoints — always network (security critical)
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly"
          }
        ]
      },
      manifest: {
        name: "usMoment",
        short_name: "usMoment",
        description: "A private shared space for couples \u2014 memories, love notes & more.",
        theme_color: "#171717",
        background_color: "#171717",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxQaW5reVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXG9vaHBvaW50XFxcXHVzbW9uZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxQaW5reVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXG9vaHBvaW50XFxcXHVzbW9uZW50XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9QaW5reS9PbmVEcml2ZS9EZXNrdG9wL29vaHBvaW50L3VzbW9uZW50L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gSW5jcmVhc2UgY2h1bmsgc2l6ZSB3YXJuaW5nIGxpbWl0IChtYW55IGljb24gaW1wb3J0cyBhcmUgZXhwZWN0ZWQpXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIC8vIFNwbGl0IHZlbmRvciBjb2RlIGludG8gc2VwYXJhdGUgY2h1bmtzIGZvciBiZXR0ZXIgbG9uZy10ZXJtIGNhY2hpbmdcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIC8vIFJlYWN0IGNvcmUgXHUyMDE0IGNoYW5nZXMgbGVhc3Qgb2Z0ZW4gXHUyMTkyIGNhY2hlZCBsb25nZXN0XHJcbiAgICAgICAgICBcInZlbmRvci1yZWFjdFwiOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJvdXRlci1kb21cIl0sXHJcbiAgICAgICAgICAvLyBTdXBhYmFzZSBjbGllbnRcclxuICAgICAgICAgIFwidmVuZG9yLXN1cGFiYXNlXCI6IFtcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiXSxcclxuICAgICAgICAgIC8vIERhdGEgZmV0Y2hpbmdcclxuICAgICAgICAgIFwidmVuZG9yLXF1ZXJ5XCI6IFtcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiXSxcclxuICAgICAgICAgIC8vIFVJIFx1MjAxNCBSYWRpeCBwcmltaXRpdmVzIChsYXJnZSBidXQgc3RhYmxlKVxyXG4gICAgICAgICAgXCJ2ZW5kb3ItcmFkaXhcIjogW1xyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1wb3BvdmVyXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXBcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWFcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYXZhdGFyXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXN3aXRjaFwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zbGlkZXJcIixcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAvLyBDaGFydHMgKHJlY2hhcnRzKSBcdTIwMTQgbG9hZGVkIG9ubHkgb24gYWRtaW4vYW5hbHl0aWNzIHZpZXdzXHJcbiAgICAgICAgICBcInZlbmRvci1jaGFydHNcIjogW1wicmVjaGFydHNcIl0sXHJcbiAgICAgICAgICAvLyBNYXAgKGxlYWZsZXQpIFx1MjAxNCBsb2FkZWQgb25seSBvbiB0cmF2ZWwgbWFwIHZpZXdcclxuICAgICAgICAgIFwidmVuZG9yLW1hcFwiOiBbXCJsZWFmbGV0XCJdLFxyXG4gICAgICAgICAgLy8gQW5pbWF0aW9uXHJcbiAgICAgICAgICBcInZlbmRvci1tb3Rpb25cIjogW1wiZnJhbWVyLW1vdGlvblwiXSxcclxuICAgICAgICAgIC8vIFV0aWxpdGllc1xyXG4gICAgICAgICAgXCJ2ZW5kb3ItdXRpbHNcIjogW1wiZGF0ZS1mbnNcIiwgXCJjbHN4XCIsIFwidGFpbHdpbmQtbWVyZ2VcIiwgXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIl0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBFbmFibGUgc291cmNlIG1hcHMgaW4gcHJvZHVjdGlvbiBmb3IgZXJyb3IgbW9uaXRvcmluZ1xyXG4gICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgIC8vIE1pbmlmeSBhZ2dyZXNzaXZlbHlcclxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXHJcbiAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcImZhdmljb24uaWNvXCIsIFwicHdhLWljb24tMTkyLnBuZ1wiLCBcInB3YS1pY29uLTUxMi5wbmdcIl0sXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL35vYXV0aC9dLFxyXG4gICAgICAgIC8vIEluamVjdCBwdXNoIFNXIGhhbmRsZXIgaW50byB0aGUgZ2VuZXJhdGVkIHNlcnZpY2Ugd29ya2VyXHJcbiAgICAgICAgaW1wb3J0U2NyaXB0czogW1wiL3B1c2gtc3cuanNcIl0sXHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmMn1cIl0sXHJcbiAgICAgICAgLy8gTGltaXQgY2FjaGUgc2l6ZSB0byBwcmV2ZW50IHN0YWxlIGJsb2F0IG9uIG1vYmlsZSBkZXZpY2VzXHJcbiAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDMgKiAxMDI0ICogMTAyNCwgLy8gMyBNQlxyXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIEdvb2dsZSBGb250cyBcdTIwMTQgY2FjaGUgbG9uZy10ZXJtIChmb250cyBkb24ndCBjaGFuZ2UpXHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nb29nbGVhcGlzXFwuY29tXFwvLiovaSxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZ29vZ2xlLWZvbnRzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjogeyBtYXhFbnRyaWVzOiAxMCwgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBTdG9yYWdlIG1lZGlhIChpbWFnZXMvdmlkZW9zL2F1ZGlvKSBcdTIwMTQgY2FjaGUgYWdncmVzc2l2ZWx5IGNsaWVudC1zaWRlXHJcbiAgICAgICAgICAgIC8vIFJlZHVjZXMgU3VwYWJhc2UgZWdyZXNzIGJhbmR3aWR0aCBzaWduaWZpY2FudGx5IGF0IHNjYWxlXHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvc3RvcmFnZVxcL3YxXFwvb2JqZWN0XFwvcHVibGljXFwvLiovaSxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwic3VwYWJhc2UtbWVkaWEtY2FjaGVcIixcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAzMDAsIC8vIHVwIGZyb20gMjAwXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA2MCwgLy8gNjAgZGF5c1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHsgc3RhdHVzZXM6IFswLCAyMDBdIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBTdXBhYmFzZSBSRVNUIEFQSSBcdTIwMTQgTmV0d29ya0ZpcnN0IHdpdGggc2hvcnQgVFRMXHJcbiAgICAgICAgICAgIC8vIEZhbGxzIGJhY2sgdG8gY2FjaGUgd2hlbiBvZmZsaW5lIG9yIHNsb3dcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9yZXN0XFwvdjFcXC8uKi9pLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBcIk5ldHdvcmtGaXJzdFwiLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcInN1cGFiYXNlLWFwaS1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHsgbWF4RW50cmllczogMTAwLCBtYXhBZ2VTZWNvbmRzOiA2MCAqIDIgfSwgLy8gMiBtaW4gVFRMXHJcbiAgICAgICAgICAgICAgbmV0d29ya1RpbWVvdXRTZWNvbmRzOiA0LFxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7IHN0YXR1c2VzOiBbMCwgMjAwXSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgLy8gU3VwYWJhc2UgQXV0aCBlbmRwb2ludHMgXHUyMDE0IGFsd2F5cyBuZXR3b3JrIChzZWN1cml0eSBjcml0aWNhbClcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9hdXRoXFwvLiovaSxcclxuICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrT25seVwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIG5hbWU6IFwidXNNb21lbnRcIixcclxuICAgICAgICBzaG9ydF9uYW1lOiBcInVzTW9tZW50XCIsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQSBwcml2YXRlIHNoYXJlZCBzcGFjZSBmb3IgY291cGxlcyBcdTIwMTQgbWVtb3JpZXMsIGxvdmUgbm90ZXMgJiBtb3JlLlwiLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiBcIiMxNzE3MTdcIixcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiMxNzE3MTdcIixcclxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcclxuICAgICAgICBvcmllbnRhdGlvbjogXCJwb3J0cmFpdFwiLFxyXG4gICAgICAgIHNjb3BlOiBcIi9cIixcclxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7IHNyYzogXCIvcHdhLWljb24tMTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSxcclxuICAgICAgICAgIHsgc3JjOiBcIi9wd2EtaWNvbi01MTIucG5nXCIsIHNpemVzOiBcIjUxMng1MTJcIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIiB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1WLFNBQVMsb0JBQW9CO0FBQ2hYLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElB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
