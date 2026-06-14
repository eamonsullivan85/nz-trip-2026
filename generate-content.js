/**
 * generate-content.js
 * Reads index.html and writes content.csv with every editable text element.
 * Open the CSV in Excel / Numbers / Google Sheets, edit the "content" column,
 * save it back as CSV, then run:  node sync.js
 *
 * Run once to get the current content:   node generate-content.js
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const { document } = new JSDOM(html).window;

// Must match the EDIT_SELECTORS list in index.html exactly (and in the same order)
const SELECTORS = [
  '.day .dsub',
  '.day .acc',
  '.day .plan .booked-row',
  '.day .plan .split',
  '.day .plan ul li',
  '.day .recs .rec',
  '.day-tile .dttl',
  '.day-tile ul li',
  'h2.sec',
  'h3.grp',
  '.accom span',
  '.cond-grid div',
  '.briefing p',
  '.briefing h3',
  '.colcard h4',
  '.colcard ul li',
].join(',');

const els = [...document.querySelectorAll(SELECTORS)];

function describeEl(el) {
  const panel = el.closest('section.panel');
  const sid = panel ? panel.id : 'overview';

  const day = el.closest('.day');
  const dayDate = day ? (day.querySelector('.ddate') || {}).textContent || '' : '';

  const tile = el.closest('.day-tile');
  const tileDate = tile ? (tile.querySelector('.dnum') || {}).textContent || '' : '';

  let type = 'text';
  if (el.matches('.dsub'))              type = 'Day subtitle';
  else if (el.matches('.acc'))          type = 'Arrival/check-in note';
  else if (el.matches('.booked-row'))   type = 'Booked confirmation';
  else if (el.matches('.split'))        type = 'Pacing / split note';
  else if (el.matches('.day .plan ul li')) type = 'Plan bullet';
  else if (el.matches('.recs .rec'))    type = 'Option / recommendation';
  else if (el.matches('.day-tile .dttl'))  type = 'Calendar tile title';
  else if (el.matches('.day-tile ul li'))  type = 'Calendar tile bullet';
  else if (el.matches('h2.sec'))        type = 'Section heading';
  else if (el.matches('h3.grp'))        type = 'Group heading';
  else if (el.matches('.accom span'))   type = 'Accommodation info';
  else if (el.matches('.cond-grid div')) type = 'Conditions text';
  else if (el.matches('.briefing p'))   type = 'Briefing paragraph';
  else if (el.matches('.briefing h3'))  type = 'Briefing heading';
  else if (el.matches('.colcard h4'))   type = 'Card heading';
  else if (el.matches('.colcard ul li')) type = 'Card bullet';

  const location = (dayDate || tileDate || '').trim() || sid;
  return `${sid} | ${location} | ${type}`;
}

function csvCell(v) {
  return '"' + String(v).replace(/\r?\n/g, ' ').replace(/"/g, '""') + '"';
}

const rows = [['index', 'description', 'content']];
els.forEach((el, i) => {
  rows.push([i, describeEl(el), el.innerHTML.trim()]);
});

const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
fs.writeFileSync(path.join(__dirname, 'content.csv'), csv, 'utf8');

console.log(`✓ content.csv written — ${rows.length - 1} editable elements`);
console.log('  Open in Excel / Google Sheets, edit the "content" column, save as CSV,');
console.log('  then run:  node sync.js');
