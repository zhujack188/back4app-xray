// Front door for the Back4App Xray node (VLESS + WebSocket + TLS at the edge).
// Listens on the platform-assigned port (process.env.PORT), serves / and /healthz,
// and reverse-proxies WebSocket upgrades on the exact WS path to the local Xray.
// Secrets (UUID, WS_PATH) come from environment variables only — never hard-code them.
const http = require('http');
const net = require('net');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const XRAY_PORT = Number(process.env.XRAY_PORT || 10001);
const WS_PATH = process.env.WS_PATH || '/vless';

const server = http.createServer((req, res) => {
  const path = (req.url || '').split('?')[0];
  if (path === '/healthz' || path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not here\n');
});

server.on('upgrade', (req, socket, head) => {
  const path = (req.url || '').split('?')[0];
  if (path !== WS_PATH) {
    socket.destroy();
    return;
  }
  const upstream = net.connect(XRAY_PORT, '127.0.0.1', () => {
    // Forward the original request line and headers verbatim, then any
    // bytes already read (head) — Xray performs the WebSocket handshake.
    const headers = Object.entries(req.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${headers}\r\n\r\n`);
    if (head && head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  upstream.on('error', () => {
    try { socket.destroy(); } catch (e) { /* ignore */ }
  });
  socket.on('error', () => {
    try { upstream.destroy(); } catch (e) { /* ignore */ }
  });
  socket.on('close', () => {
    try { upstream.destroy(); } catch (e) { /* ignore */ }
  });
  upstream.on('close', () => {
    try { socket.destroy(); } catch (e) { /* ignore */ }
  });
});

// A WebSocket session stays open for a long time — disable the request timeout.
server.timeout = 0;
server.requestTimeout = 0;
server.headersTimeout = 60000;
server.keepAliveTimeout = 5000;

server.listen(PORT, HOST, () => {
  console.log(`front door listening on ${PORT}, ws path ${WS_PATH}`);
});
