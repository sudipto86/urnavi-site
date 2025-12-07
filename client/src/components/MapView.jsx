import React, { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/map.css";
import rawEvents from "../data/events.json";

// Normalize events shape: either array or { events: [...] }
const events = Array.isArray(rawEvents) ? rawEvents : rawEvents.events || [];

// Fix Leaflet default icons for Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).href,
  iconUrl: new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url
  ).href,
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url
  ).href
});

// Helper: compute bounds from events with lat/lng
function computeBounds(evts) {
  const coords = evts
    .filter((e) => e.lat && e.lng)
    .map((e) => [Number(e.lat), Number(e.lng)]);
  if (!coords.length) return null;
  return L.latLngBounds(coords);
}

// Zoom control in bottom-right
function ZoomControlBR() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: "bottomright" });
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

// Handles zooming to all events / specific country / reset
function MapController({ country, resetToken }) {
  const map = useMap();

  useEffect(() => {
    // On mount or when country/reset changes, compute bounds
    let targetEvents = events;

    if (country && country !== "all") {
      targetEvents = events.filter(
        (e) => (e.country || "").trim() === country
      );
    }

    const bounds = computeBounds(targetEvents);

    if (bounds && bounds.isValid()) {
      try {
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 8
        });
      } catch {
        const center = bounds.getCenter();
        map.setView(center, 4);
      }
    } else {
      // Fallback view centered roughly between Sweden/Norway
      map.setView([58, 12], 4);
    }
  }, [country, resetToken, map]);

  return null;
}

export default function MapView({ filters, resetToken }) {
  // Apply filters to events
  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (!ev.lat || !ev.lng) return false;

      // WHERE: country
      if (filters.country && filters.country !== "all") {
        if ((ev.country || "").trim() !== filters.country) return false;
      }

      // WHAT: category
      if (filters.category && filters.category !== "all") {
        if ((ev.category || "").trim() !== filters.category) return false;
      }

      // WHEN: month (filters.dateFrom is "YYYY-MM-DD")
      if (filters.dateFrom) {
        const monthKey = filters.dateFrom.slice(0, 7); // "YYYY-MM"
        const d = (ev.start || ev.date || "").slice(0, 7);
        if (!d || d !== monthKey) return false;
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="map-wrap">
      <MapContainer
        center={[58, 12]} // between Sweden & Norway
        zoom={4}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap & Carto"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />

        <ZoomControlBR />
        <MapController country={filters.country} resetToken={resetToken} />

        {filtered.map((ev) => (
          <Marker key={ev.id} position={[ev.lat, ev.lng]}>
            <Popup>
              <strong>{ev.title}</strong>
              <div style={{ fontSize: 13, color: "#555" }}>
                {ev.start || ev.date || "Date TBA"}
                {ev.city ? <> • {ev.city}</> : null}
                {ev.country ? <> • {ev.country}</> : null}
              </div>
              {ev.url && (
                <div style={{ marginTop: 6 }}>
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View / Book ↗
                  </a>
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {filtered.length === 0 && (
        <div className="no-results">
          No matching events — try adjusting filters.
        </div>
      )}
    </div>
  );
}
