// scripts/fetch-events.js
// ES module ingest script for urnavi
// Fetches sources, runs transforms, normalizes dates, writes event JSON files.

import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import Parser from "rss-parser";
import { load } from "cheerio";
import pLimit from "p-limit";
import dotenv from "dotenv";

// import city + country coordinates for lat/lng fallback
import { CITY_COORDS, COUNTRY_COORDS } from "../client/src/data/cityCoordinates.js";

dotenv.config();

// --- config: use scripts/sources.json and write into client/src/data ---
const SOURCES_FILE = path.resolve("./scripts/sources.json");
const OUTPUT_DIR = path.resolve("./client/src/data");
const OUTPUT_ALL = path.join(OUTPUT_DIR, "events.json");
const OUTPUT_12MO = path.join(OUTPUT_DIR, "upcoming-12mo.json");

const CONCURRENCY = Number(process.env.INGEST_CONCURRENCY) || 4;
const USER_AGENT =
  process.env.INGEST_USER_AGENT || "urnavi-bot/0.1 (+https://urnavi.com)";

function nowIso() {
  return new Date().toISOString();
}

// --------------------
// DATE NORMALIZATION
// --------------------
function tryNormalizeDateToIso(raw) {
  if (!raw) return null;
  const s0 = String(raw).replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

  const native = Date.parse(s0);
  if (!isNaN(native)) return new Date(native).toISOString();

  const months = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const pat1 = s0.match(/(?:^[A-Za-zäöåÅÄÖ]{3,},?\s*)?(\d{1,2})\s+([A-Za-z]{3,})\s*(?:[•\-\|]\s*)?(\d{1,2}:\d{2})(?:\s*(AM|PM|am|pm))?(?:\s*(\d{4}))?/);
  if (pat1) {
    let [, dd, mon, time, ampm, explicitYear] = pat1;
    dd = Number(dd);
    const monKey = String(mon).toLowerCase();
    const mIndex = months[monKey] ?? months[monKey.slice(0, 3)];
    if (mIndex !== undefined) {
      let hour = 0, minute = 0;
      if (time) {
        const tm = time.split(":").map((x) => Number(x));
        hour = tm[0] || 0;
        minute = tm[1] || 0;
      }
      if (ampm) {
        const a = ampm.toLowerCase();
        if (a === "pm" && hour < 12) hour += 12;
        if (a === "am" && hour === 12) hour = 0;
      }

      const now = new Date();
      let year = explicitYear ? Number(explicitYear) : now.getFullYear();
      let candidate = new Date(year, mIndex, dd, hour, minute, 0, 0);

      if (!explicitYear && candidate < now) {
        candidate = new Date(year + 1, mIndex, dd, hour, minute, 0, 0);
      }

      if (!isNaN(candidate.getTime())) return candidate.toISOString();
    }
  }

  const pat2 = s0.match(
    /(?:^[A-Za-z]{3,},?\s*)?(\d{1,2})[\/\s\-\.]+([A-Za-z]{3,})(?:[\/\s\-\.]+(\d{2,4}))?/i
  );
  if (pat2) {
    let [, dd, mon, yy] = pat2;
    dd = Number(dd);
    const monKey = String(mon).toLowerCase();
    const mIndex = months[monKey] ?? months[monKey.slice(0, 3)];
    if (mIndex !== undefined) {
      const now = new Date();
      let year = yy ? Number(yy) : now.getFullYear();
      let candidate = new Date(year, mIndex, dd, 0, 0, 0, 0);
      if (!yy && candidate < now) {
        candidate = new Date(year + 1, mIndex, dd, 0, 0, 0, 0);
      }
      if (!isNaN(candidate.getTime())) return candidate.toISOString();
    }
  }

  const pat3 = s0.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}:\d{2})(:\d{2})?)?/
  );
  if (pat3) {
    let [, dd, mm, yy, time] = pat3;
    dd = Number(dd);
    mm = Number(mm);
    if (String(yy).length === 2)
      yy = Number(yy) < 50 ? 2000 + Number(yy) : 1900 + Number(yy);
    const hourMin = (time || "00:00").split(":").map((x) => Number(x));
    const candidate = new Date(
      Number(yy),
      mm - 1,
      dd,
      hourMin[0] || 0,
      hourMin[1] || 0,
      0,
      0
    );
    if (!isNaN(candidate.getTime())) return candidate.toISOString();
  }

  const p2 = Date.parse(s0.replace(/•/g, " "));
  if (!isNaN(p2)) return new Date(p2).toISOString();

  return s0;
}

// ----------------------------
// READ SOURCES.JSON
// ----------------------------
async function readSources() {
  let raw;
  try {
    raw = await fs.readFile(SOURCES_FILE, "utf8");
  } catch (err) {
    throw new Error(`[fatal] cannot read ${SOURCES_FILE}: ${err.message}`);
  }

  try {
    const cfg = JSON.parse(raw);
    return cfg.sources || [];
  } catch (err) {
    console.error(`[fatal] Failed JSON parse: ${err.message}`);
    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      console.error(String(i + 1).padStart(4, " "), lines[i]);
    }
    throw err;
  }
}

// ----------------------------
// FETCHERS (rss/api/scrape)
// ----------------------------
async function fetchRss(source) {
  const parser = new Parser();
  const feed = await parser.parseURL(source.url);
  return feed.items || [];
}

async function fetchApi(source) {
  const headers = { "User-Agent": USER_AGENT };
  if (source.auth?.type === "apikey") {
    const key = process.env[source.auth.envVar];
    if (key) headers[source.auth.headerName] = key;
  }

  const url = new URL(source.url);
  if (source.params) {
    for (const [k, v] of Object.entries(source.params)) {
      url.searchParams.set(k, v);
    }
  }

  const resp = await fetch(url.toString(), { headers });
  if (!resp.ok) throw new Error(`API fetch failed: ${resp.status}`);

  const body = await resp.json();

  if (source.resultPath) {
    const parts = source.resultPath.split(".");
    let cur = body;
    for (const p of parts) {
      if (cur?.[p] !== undefined) cur = cur[p];
      else return [];
    }
    return Array.isArray(cur) ? cur : [];
  }

  if (Array.isArray(body)) return body;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.events)) return body.events;
  return [];
}

async function fetchScrape(source) {
  const resp = await fetch(source.url, {
    headers: { "User-Agent": USER_AGENT }
  });
  if (!resp.ok) throw new Error(`Scrape failed: ${resp.status}`);

  const html = await resp.text();
  const $ = load(html);
  const selItem = source.selectors?.item;

  if (!selItem) return [];

  const results = [];
  $(selItem).each((i, el) => {
    const item = {};
    for (const [field, selector] of Object.entries(source.selectors)) {
      if (field === "item") continue;

      if (selector.includes("@")) {
        const [sel, attr] = selector.split("@");
        const node = $(el).find(sel).first();
        item[field] = node.attr(attr) || null;
      } else {
        const node = $(el).find(selector).first();
        item[field] = node.text()?.trim() || null;
      }
    }
    results.push(item);
  });

  return results;
}

// ----------------------------
// TRANSFORMS
// ----------------------------
function basicMap(item, source, index) {
  return {
    id: `${source.id}-${index}`,
    title: item.title || "Untitled Event",
    startDate: item.date || item.time || item.datetime || null,
    endDate: item.endDate || null,
    location: item.location || null,
    description: item.description || null,
    sourceUrl: item.link || item.url || null,
    source: source.id,
    raw: item
  };
}

async function runTransform(source, rawItems) {
  if (!Array.isArray(rawItems)) return [];

  if (!source.transform) {
    return rawItems.map((it, i) => basicMap(it, source, i));
  }

  const fullPath = path.resolve(source.transform);
  let mod;
  try {
    mod = await import(`file://${fullPath}`);
  } catch (err) {
    console.warn(
      `[warn] transform load failed for ${source.id}: ${err.message}`
    );
    return rawItems.map((it, i) => basicMap(it, source, i));
  }

  const transform = mod.default ?? null;
  if (!transform) {
    console.warn(`[warn] no default export in ${source.transform}`);
    return rawItems.map((it, i) => basicMap(it, source, i));
  }

  const mapped = [];
  for (const item of rawItems) {
    try {
      const out = await transform(item, { source });
      if (out) mapped.push(out);
    } catch (e) {
      console.warn(`[warn] transform error in ${source.id}: ${e.message}`);
    }
  }

  return mapped;
}

// ----------------------------
// FILTER by 12 months
// ----------------------------
function eventHasStartDateWithinNextMonths(ev, months = 12) {
  if (!ev?.startDate) return false;
  const t = Date.parse(ev.startDate);
  if (isNaN(t)) return false;
  const start = new Date(t);
  const now = new Date();
  const futureLimit = new Date(now);
  futureLimit.setMonth(now.getMonth() + months);
  return start >= now && start <= futureLimit;
}

// ----------------------------
// MAIN
// ----------------------------
async function main() {
  const sources = await readSources();

  console.log(
    `[info] fetching from ${sources.length} sources (concurrency=${CONCURRENCY})`
  );

  const limit = pLimit(CONCURRENCY);
  const tasks = sources.map((src) => limit(() => fetchOne(src)));
  const results = await Promise.all(tasks);

  const collected = [];
  for (const r of results) {
    if (Array.isArray(r.events)) collected.push(...r.events);
  }

  // Deduplicate by (source|sourceUrl)
  const seen = new Set();
  const deduped = [];
  for (const e of collected) {
    const key = e.sourceUrl ? `${e.source}|${e.sourceUrl}` : e.id;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(e);
    }
  }

  // Normalize all dates
  for (const ev of deduped) {
    if (ev.startDate) {
      ev.startDate = tryNormalizeDateToIso(ev.startDate);
    }
  }

  // Fill lat/lng using city + country fallback
  for (const ev of deduped) {
    if (ev.lat && ev.lng) continue;

    const country = ev.country || null;
    const city = ev.city || null;

    let latLng = null;
    if (city && country) {
      const key = `${city}, ${country}`;
      if (CITY_COORDS[key]) {
        latLng = CITY_COORDS[key];
      }
    }
    if (!latLng && country && COUNTRY_COORDS[country]) {
      latLng = COUNTRY_COORDS[country];
    }

    if (latLng) {
      ev.lat = latLng.lat;
      ev.lng = latLng.lng;
    }
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Frontend-friendly flat events array
  const frontendEvents = deduped
    .filter((ev) => ev.startDate && ev.lat && ev.lng)
    .map((ev) => ({
      id: ev.id,
      title: ev.title,
      start: ev.startDate,
      category: ev.category || "Event",
      country: ev.country || null,
      city: ev.city || null,
      lat: ev.lat,
      lng: ev.lng,
      url: ev.sourceUrl || null
    }));

  await fs.writeFile(
    OUTPUT_ALL,
    JSON.stringify(frontendEvents, null, 2),
    "utf8"
  );

  // Keep upcoming 12 months in a separate file (raw shape, for debugging / future use)
  const upcoming = deduped.filter((ev) =>
    eventHasStartDateWithinNextMonths(ev, 12)
  );

  await fs.writeFile(
    OUTPUT_12MO,
    JSON.stringify(
      { generatedAt: nowIso(), count: upcoming.length, events: upcoming },
      null,
      2
    ),
    "utf8"
  );

  console.log(`[info] wrote ${frontendEvents.length} events to ${OUTPUT_ALL}`);
  console.log(
    `[info] wrote ${upcoming.length} upcoming (12 months) to ${OUTPUT_12MO}`
  );
}

async function fetchOne(source) {
  try {
    let raw;
    if (source.type === "rss") raw = await fetchRss(source);
    else if (source.type === "api") raw = await fetchApi(source);
    else if (source.type === "scrape") raw = await fetchScrape(source);
    else throw new Error("Unknown source type");

    const events = await runTransform(source, raw);

    // --- NEW: enforce country + city from source if missing ---
    const countryCode = (source.country || "").toUpperCase();
    const countryName =
      countryCode === "SE" ? "Sweden" :
      countryCode === "NO" ? "Norway" :
      countryCode || null;

    const cityName = source.region || null;

    for (const ev of events) {
      if (!ev.country && countryName) ev.country = countryName;
      if (!ev.city && cityName) ev.city = cityName;
    }
    // ----------------------------------------------------------

    console.log(
      `[info] ${source.id}: got ${raw ? raw.length : 0} raw, ${events.length} normalized`
    );

    return { sourceId: source.id, events };
  } catch (err) {
    console.error(`[error] source ${source.id} failed: ${err.message}`);
    return { sourceId: source.id, events: [] };
  }
}


if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[fatal]", err);
    process.exit(1);
  });
}

export default { main };
