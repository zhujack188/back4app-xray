// Launcher for the Back4App Xray node.
// Xray binary is baked into the Docker image at build time (official release).
// Builds config.json from config.template.json using UUID/WS_PATH/XRAY_PORT env vars,
// starts Xray, then starts the Node front-door (server.js).
// Secrets come from environment variables only — never hard-code them.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const XRAY_BIN = path.join(__dirname, 'xray');
const CONFIG_TEMPLATE = path.join(__dirname, 'config.template.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

const UUID = process.env.UUID;
const WS_PATH = process.env.WS_PATH;
const XRAY_PORT = process.env.XRAY_PORT || '10001';

if (!UUID) { console.error('UUID env var is required'); process.exit(1); }
if (!WS_PATH) { console.error('WS_PATH env var is required'); process.exit(1); }

if (!fs.existsSync(XRAY_BIN)) {
  console.error('xray binary missing at', XRAY_BIN);
  process.exit(1);
}
try { fs.chmodSync(XRAY_BIN, 0o755); } catch (e) { console.error('chmod xray failed (continuing):', e.message); }
console.log('xray binary present');

const template = fs.readFileSync(CONFIG_TEMPLATE, 'utf8');
const config = template
  .split('__UUID__').join(UUID)
  .split('__WS_PATH__').join(WS_PATH)
  .split('__XRAY_PORT__').join(XRAY_PORT);
fs.writeFileSync(CONFIG_FILE, config);
console.log('config.json written');

const xray = spawn(XRAY_BIN, ['-config', CONFIG_FILE], { stdio: 'inherit' });
xray.on('exit', (code) => {
  console.error(`xray exited with code ${code}`);
  process.exit(1);
});

// Start the front-door in-process.
require('./server.js');
