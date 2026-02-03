const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ server, path: '/api/socket' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    // Spawn shell process
    const shell = 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env,
    });

    // PTY -> WebSocket
    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });

    // WebSocket -> PTY
    ws.on('message', (message) => {
      try {
        const msg = message.toString();
        // Handle resize: specific format "RESZ:<cols>:<rows>"
        if (msg.startsWith('RESZ:')) {
          const [, cols, rows] = msg.split(':');
          ptyProcess.resize(parseInt(cols), parseInt(rows));
        } else {
          ptyProcess.write(msg);
        }
      } catch (err) {
        console.error('Error writing to pty:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      ptyProcess.kill();
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
