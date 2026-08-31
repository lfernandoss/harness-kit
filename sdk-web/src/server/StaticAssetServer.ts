import * as fs from 'fs';
import * as path from 'path';
import { ServerHostConfig, validateServerHostConfig } from '../types/index.js';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

export interface StaticServeResult {
  status: number;
  filePath: string;
  contentType: string;
  body?: string;
}

export async function serveStaticWithFallback(
  reqPath: string,
  config: ServerHostConfig
): Promise<StaticServeResult> {
  validateServerHostConfig(config);

  const cleanUrl = reqPath.split('?')[0].split('#')[0];

  // Check health endpoint
  if (cleanUrl === '/health') {
    return {
      status: 200,
      filePath: '',
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ status: 'ok' }),
    };
  }

  // Security check: Directory Traversal Detection
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(cleanUrl);
  } catch {
    return {
      status: 400,
      filePath: '',
      contentType: 'text/plain; charset=utf-8',
      body: 'Bad Request: Malformed URI sequence',
    };
  }

  if (decodedPath.includes('\0') || decodedPath.includes('..')) {
    return {
      status: 403,
      filePath: '',
      contentType: 'text/plain; charset=utf-8',
      body: 'Forbidden: Directory traversal attempt detected',
    };
  }

  const normalizedStaticDir = path.resolve(config.staticDir);
  const relativePath = decodedPath.startsWith('/') ? decodedPath.slice(1) : decodedPath;
  const targetPath = path.resolve(normalizedStaticDir, relativePath);

  // Ensure target path stays strictly inside staticDir
  if (!targetPath.startsWith(normalizedStaticDir)) {
    return {
      status: 403,
      filePath: '',
      contentType: 'text/plain; charset=utf-8',
      body: 'Forbidden: Path traversal beyond document root',
    };
  }

  const fallbackPath = path.resolve(normalizedStaticDir, config.fallbackFile);

  // Check if target is a file or directory
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    if (stats.isFile()) {
      const ext = path.extname(targetPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      return {
        status: 200,
        filePath: targetPath,
        contentType,
      };
    }
  }

  // If path has a file extension and does not exist -> 404
  const hasExtension = path.extname(cleanUrl).length > 0;
  if (hasExtension) {
    return {
      status: 404,
      filePath: '',
      contentType: 'text/plain; charset=utf-8',
      body: '404 Not Found',
    };
  }

  // Otherwise, SPA fallback to index.html (fallbackFile)
  if (fs.existsSync(fallbackPath)) {
    return {
      status: 200,
      filePath: fallbackPath,
      contentType: 'text/html; charset=utf-8',
    };
  }

  return {
    status: 404,
    filePath: '',
    contentType: 'text/plain; charset=utf-8',
    body: '404 Fallback Index Not Found',
  };
}

export class StaticAssetServer {
  constructor(private readonly config: ServerHostConfig) {
    validateServerHostConfig(config);
  }

  async serve(reqPath: string): Promise<StaticServeResult> {
    return serveStaticWithFallback(reqPath, this.config);
  }
}
