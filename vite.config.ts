import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function saveAudioPlugin(): Plugin {
  return {
    name: 'save-audio-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-audio', (req, res) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              const targetDir = path.resolve(__dirname, 'public/assets/audio');
              fs.mkdirSync(targetDir, { recursive: true });
              const targetPath = path.join(targetDir, 'cancion_valentina.mp3');
              fs.writeFileSync(targetPath, buffer);

              // Also copy to dist if dist exists
              const distDir = path.resolve(__dirname, 'dist/assets/audio');
              if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
                fs.mkdirSync(distDir, { recursive: true });
                fs.writeFileSync(path.join(distDir, 'cancion_valentina.mp3'), buffer);
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: '/assets/audio/cancion_valentina.mp3' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), saveAudioPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
