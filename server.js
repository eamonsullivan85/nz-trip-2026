const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const html = fs.readFileSync(path.join(__dirname, 'index.html'));

// In-memory stores — survive restarts only while process lives (fine for a trip planner)
const votes = {};  // {key: {up, down}}
const notes = {};  // {dayKey: [{name, text, ts}]}
const items = {};  // {tableKey: [{name, url, addedBy}]}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', d => { body += d; if (body.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function json(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // GET /api/state — return all shared state in one round-trip
  if (req.method === 'GET' && url.pathname === '/api/state') {
    return json(res, { votes, notes, items });
  }

  // POST /api/vote — {key, dir ('up'|'down'|null), prev ('up'|'down'|null)}
  if (req.method === 'POST' && url.pathname === '/api/vote') {
    try {
      const { key, dir, prev } = await parseBody(req);
      if (!votes[key]) votes[key] = { up: 0, down: 0 };
      const v = votes[key];
      if (prev === 'up')   v.up   = Math.max(0, v.up   - 1);
      if (prev === 'down') v.down = Math.max(0, v.down - 1);
      if (dir  === 'up')   v.up++;
      if (dir  === 'down') v.down++;
      return json(res, v);
    } catch (e) { res.writeHead(400); res.end('bad request'); return; }
  }

  // POST /api/note — {section, name, text}
  if (req.method === 'POST' && url.pathname === '/api/note') {
    try {
      const { section, name, text } = await parseBody(req);
      if (!notes[section]) notes[section] = [];
      notes[section].push({
        name: String(name || 'Anonymous').slice(0, 30),
        text: String(text || '').slice(0, 400),
        ts: Date.now()
      });
      return json(res, notes[section]);
    } catch (e) { res.writeHead(400); res.end('bad request'); return; }
  }

  // POST /api/item — {tableKey, name, url, addedBy}
  if (req.method === 'POST' && url.pathname === '/api/item') {
    try {
      const { tableKey, name, url: itemUrl, addedBy } = await parseBody(req);
      if (!items[tableKey]) items[tableKey] = [];
      items[tableKey].push({
        name: String(name || '').slice(0, 80),
        url: String(itemUrl || '').slice(0, 200),
        addedBy: String(addedBy || '').slice(0, 30)
      });
      return json(res, items[tableKey]);
    } catch (e) { res.writeHead(400); res.end('bad request'); return; }
  }

  // Serve the page for everything else
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => console.log('NZ Trip 2026 itinerary running on port ' + port));
