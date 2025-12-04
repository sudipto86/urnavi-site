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

// Programmatic zoom control positioned bottomright
function ZoomControlBottomRight() {
    const map = useMap();
    useEffect(() => {
        const ctrl = L.control.zoom({ position: "bottomright" });
        ctrl.addTo(map);
        return () => {
            ctrl.remove();
        };
    }, [map]);
    return null;
}

// Fly helper
function FlyToMarker({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 12, { duration: 0.6 });
        }
    }, [coords, map]);
    return null;
}

export default function MapView({ filters }) {
    const [selectedCoords, setSelectedCoords] = useState(null);

    // filter events client-side
    const visible = useMemo(() => {
        return events.filter(e => {
            if (filters.category && filters.category !== "all" && e.category !== filters.category) return false;
            if (filters.country && filters.country !== "all" && e.country !== filters.country) return false;
            if (filters.dateFrom) {
                if (!e.date) return false;
                if (new Date(e.date) < new Date(filters.dateFrom)) return false;
            }
            if (filters.dateTo) {
                if (!e.date) return false;
                if (new Date(e.date) > new Date(filters.dateTo)) return false;
            }
            return true;
        });
    }, [filters]);

    // determine pan target when visible changes
    const first = visible[0];

    // sensible default center: if visible exists fly to first; otherwise show world-ish view
    const defaultCenter = first ? [first.lat, first.lng] : [20.0, 10.0];

    return (
        <div className="map-wrap">
            <MapContainer
                center={defaultCenter}
                zoom={first ? 10 : 2}
                style={{ height: "100vh", width: "100%" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ZoomControlBottomRight />

                {visible.map(ev => (
                    <Marker key={ev.id} position={[ev.lat, ev.lng]} eventHandlers={{
                        click: () => setSelectedCoords([ev.lat, ev.lng])
                    }}>
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
            </MapContainer>

            {visible.length === 0 && (
                <div className="no-results">
                    No matching events. Try changing filters.
                </div>
            )}
        </div>
    );
}
