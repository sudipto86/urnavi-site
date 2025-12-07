// scripts/transforms/visitoslo.js
// Defensive normalizer for VisitOslo scraped items.

function makeId(v) {
  if (!v) return null;
  return String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

function parseDateFlexible(raw) {
  if (!raw) return null;
  const s = String(raw)
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const p = Date.parse(s);
  if (!isNaN(p)) return new Date(p).toISOString();
  return s;
}

export default async function transform(item = {}, { source } = {}) {
  try {
    const title = item.title || item.name || item.headline || null;
    const sourceUrl = item.link || item.url || null;
    const start = parseDateFlexible(
      item.date || item.time || item.datetime || null
    );
    const location = item.location || item.venue || item.place || null;
    const description = item.description || item.summary || null;

    const id =
      makeId(
        [source?.id, title, sourceUrl, start].filter(Boolean).join("||")
      ) ||
      `${source?.id || "visitoslo"}-${Date.now()}`;

    const countryCode = (source?.country || "NO").toUpperCase();
    const country =
      countryCode === "SE" ? "Sweden" :
      countryCode === "NO" ? "Norway" :
      countryCode;

    const city = source?.region || "Oslo";

    return {
      id,
      title,
      startDate: start,
      endDate: null,
      location,
      description,
      sourceUrl,
      source: source?.id || "visitoslo-events",
      country,
      city,
      raw: item
    };
  } catch (err) {
    console.warn(`[transform:visitoslo] error: ${err && err.message}`);
    return null;
  }
}
