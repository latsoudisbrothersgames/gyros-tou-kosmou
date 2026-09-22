import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Το ίδιο base χρησιμοποιείται στο HTML, στο manifest και στο precache.
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/gyros-tou-kosmou/' : '/';
  return {
    base,
    plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Γύρος του Κόσμου', short_name: 'Γύρος', lang: 'el',
        display: 'standalone', orientation: 'portrait',
        theme_color: '#0d2f4f', background_color: '#0d2f4f',
        start_url: base, scope: base,
        icons: [192, 512].flatMap((size) => (['any', 'maskable'] as const).map((purpose) => ({
          src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose,
        }))),
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,jpg,jpeg,webp,ico,json,woff,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    })],
  };
});
