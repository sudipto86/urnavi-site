// scripts/fetch-events.js
import fs from "fs/promises";
import path from "path";

// Countries you want to fetch for
const COUNTRIES = [
  { code: "sweden", query: "sweden" },
  { code: "india",  query: "india" }
];

// Eventbrite token must come from GitHub Secrets
const EB_TOKEN = process.env.EVENTBRITE_TOKEN;

if (!EB_TOKEN) {
  console.error("EVENTBRITE_TOKEN is missing! Set GitHub Secret EVENTBRITE_TOKEN.");
  process.exit(1);
}

// Fetch events from Eventbrite API
async function fetchEventbriteEvents(query) {
  const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(query)}&expand=venue,category`;

  console.log("Fetching:", url);

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${EB_TOKEN}`
    }
  });

  if (!res.ok) {
    throw new Error(`Eventbrite API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.events || [];
}

// Normalize Eventbrite event data to your site structure
function normalizeEvents(events) {
  return events.map(ev => ({
    title: ev.name?.text || "Untitled event",
    date: ev.start?.local || "",
    desc: ev.summary || "",
    link: ev.url || "",
    cta: "Event Info"
  }));
}

// Write data/<country>.json
async function writeCountryJson(countryCode, events) {
  const output = {
    lastChecked: new Date().toISOString().slice(0,10),
    events,
    markets: [],     // keep empty (or add static markets)
    source: "eventbrite"
  };

  const filePath = path.join(process.cwd(), "data", `${countryCode}.json`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(output, null, 2), "utf8");

  console.log("Updated:", filePath);
}

async function main() {
  try {
    for (const c of COUNTRIES) {
      const rawEvents = await fetchEventbriteEvents(c.query);
      const normalized = normalizeEvents(rawEvents);
      await writeCountryJson(c.code, normalized);
    }

    console.log("All countries updated!");
  } catch (err) {
    console.error("Error:", err);
    process.exit(2);
  }
}

main();
