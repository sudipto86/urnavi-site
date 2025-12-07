// scripts/transforms/stockholmlive.js
// Normalizer for StockholmLive scraped items.

function slugify(v) {
  if (!v) return null;
  return String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\s+/g, " ").trim();
  const p = Date.parse(s);
  return isNaN(p) ? s : new Date(p).toISOString();
}

export default async function transform(item = {}, { source } = {}) {
  try {
    const title = item.title || item.name || null;
    const sourceUrl = item.link || item.url || null;
    const start = parseDate(item.date || item.time || null);
    const location = item.location || item.venue || null;
    const description = item.description || item.summary || null;

    const id =
      slugify(
        [source?.id, title, sourceUrl, start].filter(Boolean).join("||")
      ) ||
      `${source?.id || "stockholmlive"}-${Date.now()}`;

    const countryCode = (source?.country || "SE").toUpperCase();
    const country =
      countryCode === "SE" ? "Sweden" :
      countryCode === "NO" ? "Norway" :
      countryCode;

    const city = source?.region || "Stockholm";

    return {
      id,
      title,
      startDate: start,
      endDate: null,
      location,
      description,
      sourceUrl,
      source: source?.id || "stockholmlive-events",
      country,
      city,
      raw: item
    };
  } catch (err) {
    console.warn(`[transform:stockholmlive] error: ${err && err.message}`);
    return null;
  }
}
