import * as net from 'net'

export class DynamicPortAllocator {
  private readonly allocatedPorts = new Set<number>()

  async allocate(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer()
      server.unref()

      server.on('error', (err) => {
        reject(err)
      })

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address()
        if (!addr || typeof addr !== 'object') {
          server.close(() => reject(new Error('Failed to resolve dynamic port allocation')))
          return
        }

        const port = addr.port
        server.close((closeErr) => {
          if (closeErr) {
            reject(closeErr)
            return
          }

          // Avoid default port 3000 and already tracked ports
          if (port === 3000 || this.allocatedPorts.has(port)) {
            resolve(this.allocate())
            return
          }

          this.allocatedPorts.add(port)
          resolve(port)
        })
      })
    })
  }

  release(port: number): void {
    this.allocatedPorts.delete(port)
  }
}

export async function allocateDynamicPort(): Promise<number> {
  const allocator = new DynamicPortAllocator()
  return allocator.allocate()
}
