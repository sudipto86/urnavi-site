// transforms/utsav-india.js
// Defensive transform for Utsav India. Tries multiple date formats common in India.

function makeId(v) {
  if (!v) return null;
  return String(v).toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
}

// try to parse date sensibly: ISO -> Date.parse, then common formats dd-mm-yyyy, dd/mm/yyyy, verbose strings
function parseDateFlexible(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

  // 1) If already ISO or JS-parsable string
  const p = Date.parse(s);
  if (!isNaN(p)) return new Date(p).toISOString();

  // 2) Try common numeric formats: DD-MM-YYYY or DD/MM/YYYY or D-M-YYYY
  const numericMatch = s.match(/^(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{2,4})(?:\\s+(\\d{1,2}:\\d{2}))?/);
  if (numericMatch) {
    let [ , dd, mm, yy, time ] = numericMatch;
    if (yy.length === 2) {
      // assume 20xx for 2-digit year when reasonable (heuristic)
      const yNum = Number(yy);
      yy = yNum > 50 ? `19${yy}` : `20${yy}`;
    }
    // zero-pad
    dd = dd.padStart(2,'0'); mm = mm.padStart(2,'0');
    const iso = `${yy}-${mm}-${dd}` + (time ? `T${time}:00Z` : 'T00:00:00Z');
    const parsed = Date.parse(iso);
    if (!isNaN(parsed)) return new Date(parsed).toISOString();
  }

  // 3) Try to detect verbose formats like "25 March 2025" or "March 25, 2025"
  const verbose = Date.parse(s);
  if (!isNaN(verbose)) return new Date(verbose).toISOString();

  // 4) last resort: return original cleaned string (fetcher will include it in raw so you can inspect)
  return s;
}

export default async function transform(item = {}, { source } = {}) {
  try {
    // item keys from selectors: title, date, location, link, description
    const title = item.title || item.name || null;
    const sourceUrl = item.link || item.url || null;
    const rawDate = item.date || item.time || item.datetime || null;
    const start = parseDateFlexible(rawDate);

    const location = item.location || item.place || item.venue || null;
    const description = item.description || item.summary || null;

    const id = makeId([source?.id, title, sourceUrl, start].filter(Boolean).join('||')) || `${source?.id||'utsav'}-${Date.now()}`;

    return {
      id,
      title,
      startDate: start,
      endDate: null,
      location,
      description,
      sourceUrl,
      source: source?.id || 'utsav-india',
      raw: item
    };
  } catch (err) {
    console.warn(`[transform:utsav-india] error: ${err && err.message}`);
    return null;
  }
}
