import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import {
  ServerHostConfig,
  validateServerHostConfig,
} from '../../types/index.js';
import {
  StaticAssetServer,
  serveStaticWithFallback,
} from '../StaticAssetServer.js';
import { WebServerHost } from '../WebServerHost.js';

describe('1.2 ServerHostConfig & 2.2 WebServerHost Delivery & 3.3 Security', () => {
  let tempDir: string;
  let indexHtmlPath: string;
  let sampleJsPath: string;
  let sampleCssPath: string;
  let sampleSvgPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-web-test-'));
    indexHtmlPath = path.join(tempDir, 'index.html');
    sampleJsPath = path.join(tempDir, 'app.js');
    sampleCssPath = path.join(tempDir, 'style.css');
    sampleSvgPath = path.join(tempDir, 'icon.svg');

    fs.writeFileSync(indexHtmlPath, '<!DOCTYPE html><html><body><h1>Harness SPA</h1></body></html>', 'utf-8');
    fs.writeFileSync(sampleJsPath, 'console.log("harness client");', 'utf-8');
    fs.writeFileSync(sampleCssPath, ':root { --itau-orange: #EC7000; }', 'utf-8');
    fs.writeFileSync(sampleSvgPath, '<svg><circle cx="5" cy="5" r="5"/></svg>', 'utf-8');
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('ServerHostConfig Validation', () => {
    it('Should validate ServerHostConfig when host === "127.0.0.1", port > 0, and staticDir is non-empty', () => {
      const validConfig: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      expect(() => validateServerHostConfig(validConfig)).not.toThrow();
    });

    it('Should reject ServerHostConfig when host is set to external binding (e.g., 0.0.0.0 or LAN IP)', () => {
      const externalConfig: ServerHostConfig = {
        host: '0.0.0.0',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      expect(() => validateServerHostConfig(externalConfig)).toThrow(/127\.0\.0\.1/);
    });

    it('Should reject invalid port or empty static directory', () => {
      expect(() =>
        validateServerHostConfig({
          host: '127.0.0.1',
          port: 0,
          staticDir: tempDir,
          fallbackFile: 'index.html',
        })
      ).toThrow(/port/i);

      expect(() =>
        validateServerHostConfig({
          host: '127.0.0.1',
          port: 3000,
          staticDir: '',
          fallbackFile: 'index.html',
        })
      ).toThrow(/staticDir/i);
    });
  });

  describe('StaticAssetServer & serveStaticWithFallback', () => {
    it('Should serve index.html with Content-Type: text/html; charset=utf-8 on root path /', async () => {
      const config: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      const res = await serveStaticWithFallback('/', config);
      expect(res.status).toBe(200);
      expect(res.contentType).toBe('text/html; charset=utf-8');
      expect(fs.readFileSync(res.filePath, 'utf-8')).toContain('Harness SPA');
    });

    it('Should serve static JS, CSS, and SVG assets with correct MIME types', async () => {
      const config: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      const jsRes = await serveStaticWithFallback('/app.js', config);
      expect(jsRes.status).toBe(200);
      expect(jsRes.contentType).toBe('application/javascript; charset=utf-8');

      const cssRes = await serveStaticWithFallback('/style.css', config);
      expect(cssRes.status).toBe(200);
      expect(cssRes.contentType).toBe('text/css; charset=utf-8');

      const svgRes = await serveStaticWithFallback('/icon.svg', config);
      expect(svgRes.status).toBe(200);
      expect(svgRes.contentType).toBe('image/svg+xml');
    });

    it('Should return /health endpoint with status 200 and JSON payload {"status":"ok"}', async () => {
      const config: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      const res = await serveStaticWithFallback('/health', config);
      expect(res.status).toBe(200);
      expect(res.contentType).toBe('application/json; charset=utf-8');
      expect(res.body).toBe(JSON.stringify({ status: 'ok' }));
    });

    it('Should return index.html with status 200 for non-file route requests (SPA fallback)', async () => {
      const config: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      const routes = ['/run', '/settings', '/reports', '/diagnose', '/candidates'];
      for (const route of routes) {
        const res = await serveStaticWithFallback(route, config);
        expect(res.status).toBe(200);
        expect(res.contentType).toBe('text/html; charset=utf-8');
        expect(res.filePath).toBe(indexHtmlPath);
      }
    });

    it('Should return 404 for missing static asset paths containing file extensions', async () => {
      const config: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      const res = await serveStaticWithFallback('/assets/missing.js', config);
      expect(res.status).toBe(404);
    });

    it('Should prevent directory traversal attacks and reject traversal requests with 403 or 400', async () => {
      const config: ServerHostConfig = {
        host: '127.0.0.1',
        port: 3000,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      };

      const res1 = await serveStaticWithFallback('/../../etc/passwd', config);
      expect([400, 403]).toContain(res1.status);

      const res2 = await serveStaticWithFallback('/..%2F..%2Fpackage.json', config);
      expect([400, 403]).toContain(res2.status);

      const serverInstance = new StaticAssetServer(config);
      const resInstance = await serverInstance.serve('/app.js');
      expect(resInstance.status).toBe(200);
    });
  });

  describe('WebServerHost Integration & Dynamic Port Fallback', () => {
    it('Should start HTTP server strictly bound to 127.0.0.1 and serve requests', async () => {
      const server = new WebServerHost({
        host: '127.0.0.1',
        port: 42100,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      });

      const url = await server.start();
      expect(url).toContain('http://127.0.0.1:42100');
      expect(server.getAddress()).toBe(url);

      const healthRes = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        http.get(`${url}/health`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
        }).on('error', reject);
      });

      expect(healthRes.status).toBe(200);
      expect(JSON.parse(healthRes.body)).toEqual({ status: 'ok' });

      await server.stop();
    });

    it('Should fallback to alternative port when initial port is occupied', async () => {
      const blocker = http.createServer((req, res) => res.end('blocker'));
      await new Promise<void>((resolve) => blocker.listen(42150, '127.0.0.1', () => resolve()));

      const server = new WebServerHost({
        host: '127.0.0.1',
        port: 42150,
        staticDir: tempDir,
        fallbackFile: 'index.html',
      });

      const url = await server.start();
      expect(url).toContain('http://127.0.0.1:42151');

      await server.stop();
      await new Promise<void>((resolve) => blocker.close(() => resolve()));
    });
  });
});
