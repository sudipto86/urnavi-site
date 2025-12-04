import React, { useMemo, useState } from "react";
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

// small helper to pan/fly when clicking list items (if later)
function FlyToMarker({ coords }) {
    const map = useMap();
    if (coords) {
        map.flyTo(coords, 14, { duration: 0.6 });
    }
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

    return (
        <div className="map-wrap">
            <MapContainer center={[59.3293, 18.0686]} zoom={13} style={{ height: "100vh", width: "100%" }}>
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {visible.map(ev => (
                    <Marker key={ev.id} position={[ev.lat, ev.lng]} eventHandlers={{
                        click: () => setSelectedCoords([ev.lat, ev.lng])
                    }}>
                        <Popup>
                            <div style={{ maxWidth: 240 }}>
                                <strong>{ev.title}</strong>
                                <div style={{ fontSize: 13, color: "#555" }}>{ev.date} • {ev.country}</div>
                                <div style={{ marginTop: 8 }}>{ev.description || ""}</div>
                                <div style={{ marginTop: 8 }}>
                                    <a href="#" onClick={e => e.preventDefault()}>View details</a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <FlyToMarker coords={selectedCoords} />
            </MapContainer>

            {visible.length === 0 && (
                <div className="no-results">
                    No matching events. Try clearing filters.
                </div>
            )}
        </div>
    );
}
