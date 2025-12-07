import React, { useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/map.css";
import events from "../data/events.json";

// Fix Leaflet default icons for Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href
});

// Custom zoom control bottom-right
function ZoomControlBR() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: "bottomright" });
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

function MapController({ allBounds, countryBounds, resetSignal }) {
  const map = useMap();
  const lastFitted = useRef(null);

  function paddingByWindow() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const padW = Math.min(240, Math.max(40, Math.round(w * 0.08)));
    const padH = Math.min(200, Math.max(40, Math.round(h * 0.08)));
    return [padW, padH];
  }

  function safeFit(bounds) {
    if (!bounds || !bounds.isValid()) return;
    try {
      map.flyToBounds(bounds, { padding: paddingByWindow(), duration: 0.6 });
      lastFitted.current = bounds.toBBoxString();
    } catch {
      const c = bounds.getCenter();
      map.setView(c, Math.min(4, map.getZoom()));
    }
  }

  // initial fit
  useEffect(() => {
    if (allBounds && allBounds.isValid()) safeFit(allBounds);
  }, [allBounds]);

  // when country bounds change
  useEffect(() => {
    if (countryBounds && countryBounds.isValid()) {
      safeFit(countryBounds);
    }
  }, [countryBounds]);

  // reset on resetSignal (Clear)
  useEffect(() => {
    if (resetSignal != null && allBounds && allBounds.isValid()) {
      safeFit(allBounds);
    }
  }, [resetSignal, allBounds]);

  return null;
}

export default function MapView({ filters, resetToken }) {
  // Filter events using basic rules
  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (!ev.lat || !ev.lng) return false; // require coords

      // WHERE
      if (filters.country && filters.country !== "all") {
        if ((ev.country || "").trim() !== filters.country) return false;
      }
      // WHAT
      if (filters.category && filters.category !== "all") {
        if ((ev.category || "").trim() !== filters.category) return false;
      }
      // WHEN
      if (filters.dateFrom) {
        const monthKey = filters.dateFrom.slice(0, 7); // YYYY-MM
        const d = (ev.start || ev.date || "").slice(0, 7);
        if (!d || d !== monthKey) return false;
      }
      return true;
    });
  }, [filters]);

  const allWithCoords = useMemo(
    () => events.filter(ev => ev.lat && ev.lng),
    []
  );

  // Bounds
  const allBounds = useMemo(() => {
    if (!allWithCoords.length) return null;
    const lats = allWithCoords.map(e => e.lat);
    const lngs = allWithCoords.map(e => e.lng);
    return L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [allWithCoords]);

  const countryBounds = useMemo(() => {
    if (!filters.country || filters.country === "all") return null;
    const inCountry = allWithCoords.filter(
      e => (e.country || "").trim() === filters.country
    );
    if (!inCountry.length) return null;
    const lats = inCountry.map(e => e.lat);
    const lngs = inCountry.map(e => e.lng);
    return L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [filters.country, allWithCoords]);

  return (
    <div className="map-wrap">
      <MapContainer
        center={[55, 10]}
        zoom={3}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap & Carto"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />

        <ZoomControlBR />
        <MapController
          allBounds={allBounds}
          countryBounds={countryBounds}
          resetSignal={resetToken}
        />

        {filtered.map(ev => (
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
