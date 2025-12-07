// transforms/meetup-stockholm.js
function slugify(s) { return s ? s.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') : null; }
function parseDate(raw) { if (!raw) return null; const p = Date.parse(raw); return isNaN(p) ? raw : new Date(p).toISOString(); }


export default async function transform(item, { source } = {}) {
// Meetup often exposes event time in a single string or <time> element; keep flexible
const title = item.title || item.name || null;
const link = item.link || item.url || null;
const date = parseDate(item.date || item.time || null);
const id = slugify([title, link, date].filter(Boolean).join('||')) || `meetup-${Date.now()}`;


return {
id,
title,
startDate: date,
endDate: null,
location: item.location || null,
description: item.description || null,
sourceUrl: link,
source: source?.id || 'meetup-stockholm',
raw: item
};
}