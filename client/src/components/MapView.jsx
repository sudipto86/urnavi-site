// client/src/components/MapView.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/map.css";
import events from "../data/events.json";

// Fix default Leaflet icon paths for Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href
});

// Add zoom control in bottom-right
function ZoomControlBR() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: "bottomright" });
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

/*
 MapController:
 - fits bounds on initial load to cover all events (world view)
 - when filters.country changes, fits bounds to that country's event bbox
 - when resetSignal changes (clear filters), refit to world view
 - reacts to window resize and refits with responsive padding
*/
function MapController({ allBounds, countryBounds, resetSignal }) {
  const map = useMap();
  const lastFitted = useRef(null);

  // helper to compute padding based on window size
  function paddingByWindow() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // responsive padding: 8-12% of viewport with sensible clamp
    const padW = Math.min(240, Math.max(40, Math.round(w * 0.08)));
    const padH = Math.min(200, Math.max(40, Math.round(h * 0.08)));
    return [padW, padH];
  }

  // fit to a given bounds safely
  function safeFit(bounds) {
    if (!bounds || !bounds.isValid()) return;
    try {
      map.flyToBounds(bounds, { padding: paddingByWindow(), duration: 0.6 });
      lastFitted.current = bounds.toBBoxString();
    } catch (err) {
      // fallback: setView to center
      const c = bounds.getCenter();
      map.setView(c, Math.min(4, map.getZoom()));
    }
  }

  // initial fit: all events
  useEffect(() => {
    if (allBounds && allBounds.isValid()) {
      safeFit(allBounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBounds]);

  // when country bounds changes (i.e., country selected), fit to that
  useEffect(() => {
    if (countryBounds && countryBounds.isValid()) {
      safeFit(countryBounds);
    }
  }, [countryBounds]);

  // when resetSignal increments, fit to all bounds again
  useEffect(() => {
    if (resetSignal != null && allBounds && allBounds.isValid()) {
      safeFit(allBounds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // refit on window resize to keep layout comfy
  useEffect(() => {
    function onResize() {
      // refit to last fitted bounds if present
      if (!lastFitted.current) {
        if (allBounds && allBounds.isValid()) safeFit(allBounds);
        return;
      }
      // re-create bounds from lastFitted string
      const [minx, miny, maxx, maxy] = lastFitted.current.split(",").map(parseFloat);
      const b = L.latLngBounds(L.latLng(miny, minx), L.latLng(maxy, maxx));
      safeFit(b);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [allBounds]);

  return null;
}

export default function MapView({ filters, resetToken }) {
  // zoom defaults and selected coords removed: map is controlled by MapController
  // compute filtered events
  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filters.category && filters.category !== "all" && e.category !== filters.category) return false;
      if (filters.country && filters.country !== "all" && e.country !== filters.country) return false;
      if (filters.dateFrom) {
        const prefix = filters.dateFrom.slice(0,7);
        if (!e.date || !e.date.startsWith(prefix)) return false;
      }
      return true;
    });
  }, [filters]);

  // compute bbox for all events (used for initial world-fit)
  const allBounds = useMemo(() => {
    if (!events || !events.length) return null;
    const lats = events.map(e => e.lat);
    const lngs = events.map(e => e.lng);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    const bounds = L.latLngBounds([south, west], [north, east]);
    return bounds.isValid() ? bounds : null;
  }, []);

  // compute bbox for currently filtered country (if applicable)
  const countryBounds = useMemo(() => {
    if (!filters.country || filters.country === "all") return null;
    if (!filtered || !filtered.length) return null;
    const lats = filtered.map(e => e.lat);
    const lngs = filtered.map(e => e.lng);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    const bounds = L.latLngBounds([south, west], [north, east]);
    return bounds.isValid() ? bounds : null;
  }, [filters.country, filtered]);

  // For overview markers: show a simple marker per country (centroid), no labels
  const countryAggregates = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const c = ev.country || "Unknown";
      const e = map.get(c) || { country: c, latSum: 0, lngSum: 0, n: 0 };
      e.latSum += ev.lat;
      e.lngSum += ev.lng;
      e.n += 1;
      map.set(c, e);
    }
    return Array.from(map.values()).map(v => ({
      country: v.country,
      lat: v.latSum / v.n,
      lng: v.lngSum / v.n,
      count: v.n
    })).sort((a,b) => b.count - a.count);
  }, []);

  // Rendered markers:
  // - If a country filter is active: show markers for every event in that country (zoomed to country)
  // - If not: show country-level markers (centroids) so the world is readable
  const showCountryMarkers = !filters.country || filters.country === "all";
  const showEventMarkersInCountry = filters.country && filters.country !== "all";

  return (
    <div className="map-wrap">
      <MapContainer
        center={[20.0, 10.0]}
        zoom={3}
        style={{ height: "100vh", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
        minZoom={2}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap & Carto'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />

        <ZoomControlBR />

        {/* controller: fits bounds on load / country change / reset */}
        <MapController allBounds={allBounds} countryBounds={countryBounds} resetSignal={resetToken} />

        {/* Overview: country markers */}
        {showCountryMarkers && countryAggregates.map(c => (
          <Marker key={`country-${c.country}`} position={[c.lat, c.lng]}>
            <Popup>
              <div style={{ maxWidth: 220 }}>
                <strong>{c.country}</strong>
                <div style={{ fontSize: 13, color: "#555" }}>{c.count} events</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Country view: show individual events in country */}
        {showEventMarkersInCountry && filtered.map(ev => (
          <Marker key={ev.id} position={[ev.lat, ev.lng]}>
            <Popup>
              <div style={{ maxWidth: 260 }}>
                <strong>{ev.title}</strong>
                <div style={{ fontSize: 13, color: "#555" }}>{ev.date} • {ev.country}</div>
                <div style={{ marginTop: 8 }}>{ev.description || ""}</div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {filtered.length === 0 && (
        <div className="no-results">No matching events — try adjusting filters.</div>
      )}
    </div>
  );
}
