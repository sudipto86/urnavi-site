// transforms/allevents-stockholm.js
// Simple normalizer for AllEvents scraped items.

function slug(v) {
  if (!v) return null;
  return String(v).toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\s+/g, ' ').trim();
  const p = Date.parse(s);
  return isNaN(p) ? s : new Date(p).toISOString();
}

export default async function transform(item = {}, { source } = {}) {
  try {
    const title = item.title || item.name || null;
    const sourceUrl = item.link || item.url || null;
    const start = parseDate(item.date || item.time || item.datetime || null);
    const location = item.location || item.city || item.place || null;
    const description = item.description || item.summary || null;
    const id = slug([source?.id, title, sourceUrl, start].filter(Boolean).join('||')) || `${source?.id || 'allevents'}-${Date.now()}`;

    return {
      id,
      title,
      startDate: start,
      endDate: null,
      location,
      description,
      sourceUrl,
      source: source?.id || 'allevents-stockholm',
      raw: item
    };
  } catch (err) {
    console.warn(`[transform:allevents-stockholm] error: ${err && err.message}`);
    return null;
  }
}
