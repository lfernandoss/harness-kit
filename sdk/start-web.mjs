import { HttpServer } from './dist/server/HttpServer.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST ?? '127.0.0.1';

const server = new HttpServer({ port, host });
await server.start();

const actualPort = server.getPort();
console.log(`\n=============================================================`);
console.log(`🚀 Harness Kit Web Dashboard & Server is running!`);
console.log(`📡 Local Web UI:          http://${host}:${actualPort}/`);
console.log(`📊 Reports & Cost:        http://${host}:${actualPort}/#/reports`);
console.log(`🧬 Diagnostics & Pareto:  http://${host}:${actualPort}/#/diagnose`);
console.log(`📖 API Documentation:     http://${host}:${actualPort}/docs`);
console.log(`=============================================================\n`);
