/**
 * sync.js
 * Reads content.csv and pushes every row to the live site.
 * Only rows whose content differs from what's already saved are posted.
 *
 * Usage:
 *   node sync.js                             # push to production
 *   SITE_URL=http://localhost:3000 node sync.js   # push to local dev
 */

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');

const SITE_URL = (process.env.SITE_URL || 'https://burgivansnztrip.up.railway.app').replace(/\/$/, '');
const CSV_FILE = path.join(__dirname, 'content.csv');

// ---- minimal CSV parser ----
function parseCSV(str) {
  const lines = str.split('\n');
  const headers = parseRow(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseRow(l);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function parseRow(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && !inQ)              { inQ = true; }
    else if (c === '"' && inQ)          { if (line[i+1] === '"') { cur += '"'; i++; } else inQ = false; }
    else if (c === ',' && !inQ)        { out.push(cur); cur = ''; }
    else                                { cur += c; }
  }
  out.push(cur);
  return out;
}

// ---- HTTP helper ----
function request(method, urlStr, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || undefined,
      path: u.pathname + u.search,
      method,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function sync() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error('content.csv not found — run:  node generate-content.js  first');
    process.exit(1);
  }

  const csv = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCSV(csv);
  console.log(`Loaded ${rows.length} rows from content.csv`);

  // Fetch what's currently saved on the server so we skip unchanged rows
  let saved = {};
  try {
    saved = await request('GET', `${SITE_URL}/api/edits`);
  } catch (e) {
    console.warn('Could not fetch current edits — will push all rows');
  }

  let updated = 0, skipped = 0, errors = 0;
  for (const row of rows) {
    const eid = parseInt(row.index, 10);
    const content = row.content;
    if (isNaN(eid) || content === undefined) continue;

    // Skip if content hasn't changed
    if (String(saved[eid] ?? '') === content) { skipped++; continue; }

    try {
      await request('POST', `${SITE_URL}/api/edit`, { eid, html: content });
      console.log(`  ✓ [${eid}] ${row.description.slice(0, 60)}`);
      updated++;
    } catch (e) {
      console.error(`  ✗ [${eid}] ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone — ${updated} updated, ${skipped} unchanged, ${errors} errors`);
  if (updated > 0) console.log('  Reload the site to see changes: ' + SITE_URL);
}

sync().catch(e => { console.error(e); process.exit(1); });
