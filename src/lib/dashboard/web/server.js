const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { createWatchRuntime } = require('../runtime/watch-runtime');
const { detectAvailableFlows, detectFlow } = require('../flow-detect');
const { loadWebDashboardData } = require('./snapshot');

const PUBLIC_DIR = path.join(__dirname, 'public');
const TOKEN_COOKIE = 'specsmd_dashboard_token';

function parsePort(raw) {
  const parsed = Number.parseInt(String(raw || '0'), 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 65535) {
    return 0;
  }
  return parsed;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sendHtml(res, body, token) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'set-cookie': `${TOKEN_COOKIE}=${token}; Path=/; SameSite=Strict`,
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

function contentTypeFor(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function safeStaticPath(requestPath) {
  const pathname = requestPath === '/' ? '/index.html' : requestPath;
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalized);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return null;
  }
  return filePath;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separator = cookie.indexOf('=');
      if (separator === -1) return cookies;
      cookies[cookie.slice(0, separator)] = decodeURIComponent(cookie.slice(separator + 1));
      return cookies;
    }, {});
}

function hasValidCommandToken(req, token) {
  const headerToken = req.headers['x-specsmd-dashboard-token'];
  const cookies = parseCookies(req);
  return headerToken === token || cookies[TOKEN_COOKIE] === token;
}

function isAllowedCommandRequest(req, host, port, token) {
  if (!hasValidCommandToken(req, token)) {
    return false;
  }

  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    const expectedPort = String(port);
    const requestHost = req.headers.host || `${host}:${expectedPort}`;
    return parsed.protocol === 'http:'
      && parsed.host === requestHost;
  } catch {
    return false;
  }
}

function isSafeWorkspacePath(workspacePath, candidatePath) {
  if (typeof candidatePath !== 'string' || candidatePath.trim() === '') {
    return false;
  }
  try {
    const resolvedWorkspace = fs.realpathSync.native(workspacePath);
    const resolvedCandidate = fs.realpathSync.native(candidatePath);
    const stat = fs.statSync(resolvedCandidate);
    return stat.isFile()
      && (resolvedCandidate === resolvedWorkspace || resolvedCandidate.startsWith(`${resolvedWorkspace}${path.sep}`));
  } catch {
    return false;
  }
}

function openExternal(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return false;
  }
  const opener = process.platform === 'darwin'
    ? 'open'
    : (process.platform === 'win32' ? 'cmd' : 'xdg-open');
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(opener, args, { detached: true, stdio: 'ignore' });
  child.unref();
  return true;
}

function openLocalFile(filePath) {
  const opener = process.platform === 'darwin'
    ? 'open'
    : (process.platform === 'win32' ? 'cmd' : 'xdg-open');
  const args = process.platform === 'win32' ? ['/c', 'start', '', filePath] : [filePath];
  const child = spawn(opener, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

function buildWatchRoots(workspacePath, flow) {
  const normalizedFlow = String(flow || '').toLowerCase();
  if (normalizedFlow === 'aidlc') {
    return [path.join(workspacePath, 'memory-bank')];
  }
  if (normalizedFlow === 'simple') {
    return [path.join(workspacePath, 'specs')];
  }
  return [path.join(workspacePath, '.specs-fire')];
}

async function startDashboardWeb(options = {}) {
  const workspacePath = path.resolve(options.path || options.workspacePath || process.cwd());
  const host = options.host || '127.0.0.1';
  const port = parsePort(options.port);
  const commandToken = crypto.randomBytes(24).toString('base64url');
  const clients = new Set();
  let watcher = null;
  let lastData = null;
  let activeFlow = options.flow || null;

  async function loadAndBroadcast() {
    lastData = await loadWebDashboardData({ workspacePath, flow: activeFlow });
    if (lastData.flow) {
      activeFlow = lastData.flow;
    }
    const message = lastData.webviewMessage || lastData;
    const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
    for (const client of clients) {
      client.write(payload);
    }
    return lastData;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${host}`);

      if (req.method === 'GET' && requestUrl.pathname === '/api/snapshot') {
        const data = await loadAndBroadcast();
        sendJson(res, data.ok ? 200 : 400, data);
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/api/message') {
        if (!isAllowedCommandRequest(req, host, actualPort, commandToken)) {
          sendJson(res, 403, {
            ok: false,
            error: {
              code: 'FORBIDDEN_ORIGIN',
              message: 'Dashboard commands must originate from the local dashboard page.'
            }
          });
          return;
        }
        const rawBody = await readRequestBody(req);
        const message = rawBody ? JSON.parse(rawBody) : {};
        if (message.type === 'refresh' || message.type === 'ready') {
          const data = await loadAndBroadcast();
          sendJson(res, 200, { ok: true, data });
          return;
        }
        if (message.type === 'switchFlow') {
          const availableFlows = detectAvailableFlows(workspacePath);
          const requestedFlow = typeof message.flowId === 'string' ? message.flowId : null;
          if (requestedFlow && availableFlows.includes(requestedFlow)) {
            activeFlow = requestedFlow;
          } else if (availableFlows.length > 0) {
            const currentIndex = availableFlows.indexOf(activeFlow);
            activeFlow = availableFlows[(currentIndex + 1) % availableFlows.length];
          }
          const data = await loadAndBroadcast();
          sendJson(res, 200, { ok: true, data });
          return;
        }
        if (message.type === 'openExternal') {
          const opened = openExternal(message.url);
          sendJson(res, opened ? 200 : 400, opened
            ? { ok: true }
            : { ok: false, error: { code: 'INVALID_URL', message: 'Only http(s) URLs can be opened.' } });
          return;
        }
        if (message.type === 'openArtifact' && isSafeWorkspacePath(workspacePath, message.path)) {
          openLocalFile(message.path);
          sendJson(res, 200, { ok: true });
          return;
        }
        sendJson(res, 202, { ok: true, ignored: true });
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname === '/events') {
        if (!isAllowedCommandRequest(req, host, actualPort, commandToken)) {
          sendJson(res, 403, {
            ok: false,
            error: {
              code: 'FORBIDDEN_ORIGIN',
              message: 'Dashboard event streams must originate from the local dashboard page.'
            }
          });
          return;
        }
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive'
        });
        res.write('\n');
        clients.add(res);
        if (lastData) {
          const message = lastData.webviewMessage || lastData;
          res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
        }
        req.on('close', () => {
          clients.delete(res);
        });
        return;
      }

      if (req.method === 'GET') {
        const filePath = safeStaticPath(requestUrl.pathname);
        if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          sendText(res, 404, 'Not found');
          return;
        }
        const body = fs.readFileSync(filePath);
        if (filePath.endsWith('.html')) {
          sendHtml(res, body, commandToken);
          return;
        }
        res.writeHead(200, {
          'content-type': contentTypeFor(filePath),
          'cache-control': filePath.endsWith('.html') ? 'no-store' : 'public, max-age=60',
          'content-length': body.length
        });
        res.end(body);
        return;
      }

      sendText(res, 405, 'Method not allowed');
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || String(error)
        }
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const url = `http://${host}:${actualPort}/`;

  const initialData = await loadAndBroadcast();
  if (options.watch !== false && initialData.flow) {
    const roots = detectAvailableFlows(workspacePath)
      .flatMap((flow) => buildWatchRoots(workspacePath, flow))
      .filter((root) => fs.existsSync(root));
    if (roots.length > 0) {
      watcher = createWatchRuntime({
        rootPaths: roots,
        onRefresh: () => {
          loadAndBroadcast().catch(() => {});
        }
      });
      watcher.start();
    }
  }

  async function close() {
    if (watcher) {
      await watcher.close();
      watcher = null;
    }
    for (const client of clients) {
      client.end();
    }
    clients.clear();
    await new Promise((resolve) => server.close(resolve));
  }

  return {
    server,
    url,
    host,
    port: actualPort,
    workspacePath,
    close,
    getLastData: () => lastData
  };
}

async function run(options = {}) {
  const handle = await startDashboardWeb(options);
  console.log(`specsmd dashboard web: ${handle.url}`);
  console.log(`workspace: ${handle.workspacePath}`);
  console.log('Press Ctrl+C to stop.');

  if (options.open !== false) {
    openExternal(handle.url);
  }

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

module.exports = {
  startDashboardWeb,
  run,
  parsePort,
  buildWatchRoots
};
