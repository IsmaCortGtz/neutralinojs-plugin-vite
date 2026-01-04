import net from 'node:net';

export function findPort(): Promise<number> {
  return new Promise((resolve, reject) => {

    const server = net.createServer();
    server.listen(0);

    server.on('error', reject);
    server.on('listening', () => {
      const addressInfo = server.address();

      server.close((e) => {
        if (e) reject(e);
        else if (!addressInfo || typeof addressInfo === 'string') reject(new Error('Could not get server address info'));
        else resolve(addressInfo.port);
      });
      
    });

  });
}