// scripts/transforms/visitstockholm.js
// Normalize VisitStockholm API items to canonical Event shape.

function safeSlug(s) {
  if (!s) return null;
  return String(s).toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
}

function parseDateFlexible(value) {
  if (!value) return null;
  try {
    if (typeof value === 'string') {
      const p = Date.parse(value);
      if (!isNaN(p)) return new Date(p).toISOString();
      return value.trim();
    }
    if (value && typeof value === 'object') {
      if (value.start) {
        const p = Date.parse(value.start);
        if (!isNaN(p)) return new Date(p).toISOString();
        return value.start;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default async function transform(item = {}, { source } = {}) {
  try {
    const title =
      item.title ||
      item.name ||
      item.headline ||
      null;

    const sourceUrl =
      item.url ||
      item.eventUrl ||
      (item.links && item.links[0] && item.links[0].href) ||
      null;

    const start = parseDateFlexible(
      item.startDate ||
      item.start ||
      item.date ||
      (item.dates && item.dates[0] && item.dates[0].start) ||
      (item.occurrences && item.occurrences[0] && item.occurrences[0].start) ||
      null
    );

    const end = parseDateFlexible(
      item.endDate ||
      item.end ||
      (item.dates && item.dates[0] && item.dates[0].end) ||
      (item.occurrences && item.occurrences[0] && item.occurrences[0].end) ||
      null
    );

    const location =
      (item.location &&
        (item.location.name ||
         item.location.address ||
         item.location.city)) ||
      item.venue ||
      item.place ||
      null;

    const description =
      item.description ||
      item.summary ||
      item.longDescription ||
      null;

    // Map country code -> human name
    const countryCode = (source?.country || "SE").toUpperCase();
    const country =
      countryCode === "SE" ? "Sweden" :
      countryCode === "NO" ? "Norway" :
      countryCode;

    const city =
      item.location?.city ||
      source?.region ||
      "Stockholm";

    const id =
      safeSlug(
        [source?.id, title, sourceUrl, start].filter(Boolean).join("||")
      ) ||
      `${source?.id || "visitstockholm"}-${Date.now()}`;

    return {
      id,
      title,
      startDate: start,
      endDate: end || null,
      location,
      description,
      sourceUrl,
      source: source?.id || "visitstockholm-events",
      country,
      city,
      raw: item
    };
  } catch (err) {
    console.warn(`[transform:visitstockholm] error: ${err && err.message}`);
    return null;
  }
}
