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
//async function fetchEventbriteEvents(query) {
// Replace your existing fetchEventbriteEvents with this function
async function fetchEventbriteEvents(query) {
  const base = 'https://www.eventbriteapi.com/v3/events/search/';
  // Try primary URL with location.address and expand
  const url1 = `${base}?location.address=${encodeURIComponent(query)}&expand=venue,category`;
  // Fallback url with q parameter
  const url2 = `${base}?q=${encodeURIComponent(query)}&expand=venue,category`;

  async function doRequest(url) {
    console.log("Fetching:", url);
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${EB_TOKEN}`,
        "Accept": "application/json"
      }
    });

    const text = await res.text(); // read raw body for debugging
    let body;
    try { body = JSON.parse(text); } catch(e) { body = text; }

    if (!res.ok) {
      // show full debug info in logs
      console.error(`Eventbrite request failed: ${res.status} ${res.statusText}`);
      console.error("Response body:", body);
      const err = new Error(`Eventbrite API failed: ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    // success
    return body.events || body; // body.events is the usual list
  }

  // Try first URL; if it 404s, try fallback
  try {
    return await doRequest(url1);
  } catch (err) {
    if (err.status === 404) {
      console.warn("First URL returned 404; trying fallback query (q=).");
      try {
        return await doRequest(url2);
      } catch (err2) {
        // rethrow so action logs show both attempts
        throw err2;
      }
    }
    // rethrow for other statuses (401, 403, etc.)
    throw err;
  }
}

//}

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
