import * as http from 'http';
import * as fs from 'fs';
import {
  ServerHostConfig,
  IWebServerHost,
  validateServerHostConfig,
} from '../types/index.js';
import { serveStaticWithFallback } from './StaticAssetServer.js';

export class WebServerHost implements IWebServerHost {
  private server: http.Server | null = null;
  private boundPort: number;
  private readonly config: ServerHostConfig;
  private readonly maxPortRetries = 20;

  constructor(config: ServerHostConfig) {
    validateServerHostConfig(config);
    this.config = config;
    this.boundPort = config.port;
  }

  async start(): Promise<string> {
    if (this.server) {
      return this.getAddress();
    }

    let currentPort = this.config.port;
    const maxPort = this.config.port + this.maxPortRetries;

    while (currentPort <= maxPort) {
      try {
        await this.listenOnPort(currentPort);
        this.boundPort = currentPort;
        return this.getAddress();
      } catch (err: any) {
        if (err.code === 'EADDRINUSE' && currentPort < maxPort) {
          currentPort++;
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Failed to bind WebServerHost to 127.0.0.1 on ports ${this.config.port} through ${maxPort}`);
  }

  private listenOnPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const srv = http.createServer(async (req, res) => {
        try {
          const result = await serveStaticWithFallback(req.url || '/', this.config);
          res.statusCode = result.status;
          res.setHeader('Content-Type', result.contentType);

          if (result.body) {
            res.end(result.body);
            return;
          }

          if (result.filePath && fs.existsSync(result.filePath)) {
            const stream = fs.createReadStream(result.filePath);
            stream.pipe(res);
            return;
          }

          res.end();
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(`Internal Server Error: ${error.message}`);
        }
      });

      srv.once('error', (err: any) => {
        srv.close();
        reject(err);
      });

      srv.listen(port, '127.0.0.1', () => {
        this.server = srv;
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        this.server = null;
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getAddress(): string {
    return `http://${this.config.host}:${this.boundPort}`;
  }
}
