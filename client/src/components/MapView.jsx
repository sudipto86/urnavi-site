import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/map.css";
import events from "../data/events.json";

// Fix default icon URL paths for many bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href
});

// helper to place a temporary pointer when user clicks map
function ClickPointer({ onPointer }) {
    useMapEvent("click", (e) => {
        onPointer(e.latlng);
    });
    return null;
}

export default function MapView() {
    const [pointer, setPointer] = useState(null);

    return (
        <MapContainer
            center={[59.3293, 18.0686]}
            zoom={13}
            style={{ height: "100vh", width: "100%" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {events.map((ev) => (
                <Marker key={ev.id} position={[ev.lat, ev.lng]}>
                    <Popup>
                        <div style={{ maxWidth: 220 }}>
                            <strong>{ev.title}</strong>
                            <div style={{ fontSize: 13, color: "#555" }}>{ev.date}</div>
                            <div style={{ marginTop: 8 }}>
                                <a href="#" onClick={(e) => e.preventDefault()}>View details</a>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            <ClickPointer onPointer={(latlng) => setPointer(latlng)} />
            {pointer && (
                <Marker position={[pointer.lat, pointer.lng]}>
                    <Popup>
                        <div>
                            <strong>Selected location</strong>
                            <div style={{ fontSize: 13, color: "#555" }}>
                                {pointer.lat.toFixed(5)}, {pointer.lng.toFixed(5)}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
}
