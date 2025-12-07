// fetch-events.js
// Simple event ingestor for UrNavi (Sweden, starting with Stockholm Live)
// - Fetches official event pages
// - Normalizes to { id, title, start, end, category, country, city, lat, lng, url }
// - Fills missing lat/lng from client/src/data/cityCoordinates.js
//
// Usage (from project root):
//   node fetch-events.js
//
// Requires:
//   npm install node-fetch@3 cheerio dotenv
//   "type": "module" in root package.json

import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { load as loadHtml } from "cheerio";
import dotenv from "dotenv";
import { CITY_COORDS, COUNTRY_COORDS } from "./client/src/data/cityCoordinates.js";

dotenv.config();

// ----------------------
// Small helpers
// ----------------------

function makeId(parts) {
  const raw = parts.filter(Boolean).join("||");
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeDate(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\u00A0/g, " ").trim();
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) return new Date(parsed).toISOString();
  return s; // fallback, still store it
}

function attachCoordinates(ev) {
  // If event already has lat/lng, keep them
  if (ev.lat && ev.lng) return ev;

  const countryName = ev.country || "";
  const cityName = ev.city || "";

  const cityKey =
    cityName && countryName ? `${cityName}, ${countryName}` : null;

  if (cityKey && CITY_COORDS[cityKey]) {
    const { lat, lng } = CITY_COORDS[cityKey];
    return { ...ev, lat, lng };
  }

  if (COUNTRY_COORDS[countryName]) {
    const { lat, lng } = COUNTRY_COORDS[countryName];
    return { ...ev, lat, lng };
  }

  // As a last resort, leave without coords (map will ignore it)
  return ev;
}

// Where we write final data (this is what your React app already uses)
const OUTPUT_FILE = path.resolve("./client/src/data/events.json");

// ----------------------
// Source 1: Stockholm Live (official arenas)
// https://stockholmlive.com/en/events/
// ----------------------

const STOCKHOLM_LIVE_URL = "https://stockholmlive.com/en/events/";

// Very simple scraper tuned to the current HTML structure.
// If they redesign the site, you may need to tweak selectors.
async function fetchStockholmLiveEvents() {
  console.log("[stockholmlive] fetching…", STOCKHOLM_LIVE_URL);
  const res = await fetch(STOCKHOLM_LIVE_URL, {
    headers: {
      "User-Agent":
        process.env.INGEST_USER_AGENT ||
        "urnavi-bot/0.1 (+https://urnavi.com)",
    },
  });

  if (!res.ok) {
    console.warn(
      `[stockholmlive] HTTP ${res.status} when fetching events page`
    );
    return [];
  }

  const html = await res.text();
  const $ = loadHtml(html);

  const events = [];

  // The content is basically:
  //   <p>Date...</p>
  //   <h3>Title</h3>
  //   <p>Category</p>
  //   <p>Venue</p>
  //
  // We'll grab all <h3> under the main "#main" area and
  // look at neighboring elements for date / category / venue.
  $("h3").each((i, el) => {
    const title = $(el).text().trim();
    if (!title) return;

    const container = $(el).parent();
    const siblings = container.contents().toArray();

    // Very loose heuristic: date tends to appear just before the <h3>,
    // category & venue just after.
    let dateText = null;
    let category = null;
    let venue = null;

    // search previous siblings for something that looks like a date
    for (let j = 0; j < siblings.length; j++) {
      if (siblings[j] === el && j > 0) {
        const prevText = $(siblings[j - 1]).text().trim();
        if (prevText && /\d{4}|\d{1,2}\s+[A-Za-z]+/.test(prevText)) {
          dateText = prevText;
        }
      }
    }

    // search next few siblings for category & venue
    let seenAfter = 0;
    for (let j = 0; j < siblings.length; j++) {
      if (siblings[j] === el) {
        seenAfter = 1;
        continue;
      }
      if (!seenAfter) continue;
      const t = $(siblings[j]).text().trim();
      if (!t) continue;

      if (!category) {
        category = t;
      } else if (!venue) {
        venue = t;
        break;
      }
    }

    const start = normalizeDate(dateText);
    const urlEl = $(el).closest("a[href]");
    const url =
      urlEl.attr("href") && urlEl.attr("href").startsWith("http")
        ? urlEl.attr("href")
        : null;

    const event = {
      id: makeId(["stockholmlive", title, dateText || "", venue || ""]),
      title,
      start: start,
      end: null,
      category: category || "Music/show",
      country: "Sweden",
      city: "Stockholm",
      venue: venue || null,
      url,
      source: "stockholmlive",
    };

    events.push(attachCoordinates(event));
  });

  console.log(`[stockholmlive] parsed approx ${events.length} events`);
  return events;
}

// ----------------------
// Main
// ----------------------

async function main() {
  console.log("[urnavi] starting ingest…");

  const collected = [];

  // 1) Stockholm Live (Stockholm, Sweden)
  try {
    const seEvents = await fetchStockholmLiveEvents();
    collected.push(...seEvents);
  } catch (err) {
    console.error("[stockholmlive] failed:", err.message);
  }

  // TODO: later we can add:
  //   - VisitStockholm "Events" page
  //   - VisitOslo "What's on" page
  // using the same pattern.

  // Deduplicate by (source + title + date)
  const seen = new Set();
  const deduped = [];
  for (const ev of collected) {
    const key = `${ev.source || "x"}|${ev.title}|${ev.start || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(ev);
    }
  }

  // Final pass: only keep events that have at least coordinates or a city
  const finalEvents = deduped.filter((ev) => ev.lat && ev.lng);

  console.log(
    `[urnavi] total collected: ${collected.length}, with coords: ${finalEvents.length}`
  );

  const payload = finalEvents;

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2), "utf8");

  console.log("[urnavi] wrote", OUTPUT_FILE);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[fatal]", err);
    process.exit(1);
  });
}

export default { main };
