import React, { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/map.css";
import events from "../data/events.json";

// Fix icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href
});

function ZoomControlBottomRight() {
    const map = useMap();
    useEffect(() => {
        const ctrl = L.control.zoom({ position: "bottomright" });
        ctrl.addTo(map);
        return () => ctrl.remove();
    }, []);
    return null;
}

function FlyToMarker({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.flyTo(coords, 11, { duration: 0.6 });
    }, [coords, map]);
    return null;
}

export default function MapView({ filters }) {
    const [selectedCoords, setSelectedCoords] = useState(null);

    // client-side filtering
    const visible = useMemo(() => {
        return events.filter(e => {
            if (filters.category && filters.category !== "all" && e.category !== filters.category) return false;
            if (filters.country && filters.country !== "all" && e.country !== filters.country) return false;
            if (filters.dateFrom) {
                // if month selected, compare month
                const monthPrefix = filters.dateFrom.slice(0, 7);
                if (!e.date || !e.date.startsWith(monthPrefix)) return false;
            }
            return true;
        });
    }, [filters]);

    const first = visible[0];

    // tile: Carto Voyager for fresher colors
    const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

    // settings for zoom boundaries
    const MIN_Z = 3;    // don't allow too far out
    const MAX_Z = 18;

    return (
        <div className="map-wrap">
            <MapContainer
                center={first ? [first.lat, first.lng] : [20.0, 10.0]}
                zoom={first ? 10 : 3}
                style={{ height: "100vh", width: "100%" }}
                scrollWheelZoom={true}
                zoomControl={false}    /* remove default top-left control */
                minZoom={2}
                maxZoom={MAX_Z}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap & Carto"
                    url={tileUrl}
                />

                <ZoomControlBottomRight />

                {visible.map(ev => (
                    <Marker
                        key={ev.id}
                        position={[ev.lat, ev.lng]}
                        eventHandlers={{ click: () => setSelectedCoords([ev.lat, ev.lng]) }}
                    >
                        <Popup>
                            <div style={{ maxWidth: 240 }}>
                                <strong>{ev.title}</strong>
                                <div style={{ fontSize: 13, color: "#555" }}>{ev.date} • {ev.country}</div>
                                <div style={{ marginTop: 8 }}>{ev.description || ""}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <FlyToMarker coords={selectedCoords || (first ? [first.lat, first.lng] : null)} />

                {/* gentle bounce-back: if user zooms out beyond MIN_Z, animate back */}
                <MapBounce minZoom={MIN_Z} />
            </MapContainer>

            {visible.length === 0 && (
                <div className="no-results">No matching events — try clearing filters.</div>
            )}
        </div>
    );
}

// component to implement bounce-back when zoom too small
function MapBounce({ minZoom = 3 }) {
    const map = useMap();
    useEffect(() => {
        function checkZoom() {
            const z = map.getZoom();
            if (z < minZoom) {
                // smooth bounce: zoom to minZoom with short duration
                map.setZoom(minZoom, { animate: true });
            }
        }
        map.on("zoomend", checkZoom);
        return () => map.off("zoomend", checkZoom);
    }, [map, minZoom]);
    return null;
}
