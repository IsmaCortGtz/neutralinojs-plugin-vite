import http, { ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import c from 'picocolors';
import { log, raw, warn } from '@/utils/log';
import neu from '@/modules/neu';
import { resolvePackageManager } from '@/utils/pm';
var vite: any = null;

export const configNames = [
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.cjs',
  'vite.config.jsx',
  'vite.config.tsx',
];

export function netAuthProxyPlugin() {
  return {
    name: 'neutralinojs-plugin-vite-proxy',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: ServerResponse, next: any) => {

        if (req.url.startsWith("/?neutralinoViteUid")) {
          // Add cookie
          const urlParams = new URLSearchParams(req.url.split('?')[1]);
          const id = urlParams.get('neutralinoViteUid');
          if (id) res.setHeader('Set-Cookie', `neutralinoViteUid=${encodeURIComponent(id)}; Path=/`);
        }

        if (req?.url?.includes('/__neutralino_globals.js')) {
          const cookies = req.headers.cookie || '';
          const match = cookies.match(/(?:^|;\s*)neutralinoViteUid=([^;]*)/);
          const id = match ? decodeURIComponent(match[1]) : null;
          if (!id) return next();

          const port = server?.neutralinoAuthPorts?.[id];
          if (!port) return next();

          const proxyUrl = `http://localhost:${port}/__neutralino_globals.js`;
          return http.get(proxyUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.statusMessage || 'OK', proxyRes.headers);
            proxyRes.pipe(res);
          }).on('error', (err) => {
            res.statusCode = 500;
            res.end(err.message);
          });
        }

        next();
      });
    }
  }
}

export function importVite(projectPath: string) {
  if (!!vite || !projectPath) return vite;
  const vitePath = require.resolve('vite', { paths: [projectPath] });

  vite = require(vitePath)
  return vite;
}

export async function loadViteConfig(projectPath: string) {
  const configPath = configNames.find(cfg => fs.existsSync(path.join(projectPath, cfg)));
  const config: any = {
    root: projectPath,
    logLevel: 'warn',
    plugins: [netAuthProxyPlugin()]
  };

  if (configPath) config.configFile = path.join(projectPath, configPath);
  return config;
}

export async function startServer(viteProjectRoot: string, packageManager?: ReturnType<typeof resolvePackageManager>) {
  const neuRoot = process.cwd();
  const vite = importVite(viteProjectRoot);
  const config = await loadViteConfig(viteProjectRoot);
  process.chdir(viteProjectRoot);

  const server = await vite.createServer(config);
  server.neutralinoAuthPorts = {};

  await server.listen();
  const url = `http://localhost:${server.config.server.port || 5173}`;
  raw('\n', c.green(`Starting Neu development server on ${url}\n`));

  log('Development server is running.', c.gray('Press CTRL+C to exit.'));
  log('Key commands available:\n');
  raw(' ', c.bgWhite(c.black(c.bold(' r '))), '-', 'Reload the app');
  raw(' ', c.bgWhite(c.black(c.bold(' o '))), '-', 'Open new app\n');

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', async (key) => {
    const keyStr = String(key);
    if (keyStr === '\u0003') process.exit(); // CTRL+C
    if (keyStr === 'r') {
      log('Reloading connected app(s)...');
      if (server.ws.clients.size < 1) return warn('No app(s) connected to reload. Make sure you have the app running.');
      server.ws.send({
        type: 'full-reload',
      });
    }
    if (keyStr === 'o') {
      log('Opening new app window...');
      const newNeu = await neu.open(url, neuRoot, packageManager);
      server.neutralinoAuthPorts[newNeu.uuid] = newNeu.port;
    }
  });

  const newNeu = await neu.open(url, neuRoot, packageManager);
  server.neutralinoAuthPorts[newNeu.uuid] = newNeu.port;
}