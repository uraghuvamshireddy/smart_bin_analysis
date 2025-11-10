import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ICON_GREEN = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ICON_ORANGE = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ICON_RED = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ICON_BLUE = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds || bounds.length === 0) return;
    try {
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
    }
  }, [map, bounds]);
  return null;
}

export default function AdminMapPage() {
  const [bins, setBins] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const boundsRef = useRef([]);

  useEffect(() => {
    setLoading(true);
    setError("");

    API.get("/bins/")
      .then((res) => {
        const payload = res?.data ?? res ?? [];
        if (!Array.isArray(payload)) {
          if (payload?.bins && Array.isArray(payload.bins)) setBins(payload.bins);
          else setBins([]);
        } else {
          setBins(payload);
        }
      })
      .catch((e) => {
        console.error("Failed to load bins", e);
        setBins([]);
        setError("Failed to load bins");
      });

    API.get("/ml/hotspots")
      .then((res) => {
        const p = res?.data ?? res ?? {};
        const centers = p.hotspot_centers ?? p.centers ?? [];
        const normalized = centers.map((c) => {
          if (c.latitude !== undefined && c.longitude !== undefined) {
            return { latitude: Number(c.latitude), longitude: Number(c.longitude) };
          }
          if (Array.isArray(c) && c.length >= 2) return { latitude: Number(c[0]), longitude: Number(c[1]) };
          return null;
        }).filter(Boolean);
        setHotspots(normalized);
      })
      .catch((e) => {
        console.error("Failed to load hotspots", e);
        setHotspots([]);
      })
      .finally(() => setLoading(false));
  }, []);

  boundsRef.current = [];
  bins.forEach((b) => {
    if (b?.latitude != null && b?.longitude != null) {
      boundsRef.current.push([Number(b.latitude), Number(b.longitude)]);
    }
  });
  hotspots.forEach((h) => {
    if (h?.latitude != null && h?.longitude != null) {
      boundsRef.current.push([Number(h.latitude), Number(h.longitude)]);
    }
  });

  const defaultCenter = [23.8315, 91.2864]; 
  const initialZoom = 12;

  const iconFor = (fillPct) => {
    const pct = Number(fillPct ?? 0);
    if (pct >= 80) return ICON_RED;
    if (pct >= 50) return ICON_ORANGE;
    return ICON_GREEN;
  };

  return (
    <div className="layout" style={{ minHeight: "80vh" }}>
      <Sidebar />
      <div className="content" style={{ padding: 12 }}>
        <h2>Admin Map — Bins & Hotspots</h2>

        {loading && <div>Loading map data...</div>}
        {error && <div className="error">{error}</div>}

        <div style={{ height: "72vh", width: "100%", position: "relative", marginTop: 8 }}>
          <MapContainer center={defaultCenter} zoom={initialZoom} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {boundsRef.current.length > 0 && <FitBounds bounds={boundsRef.current} />}

            {Array.isArray(bins) && bins.map((b) => {
              const lat = Number(b.latitude);
              const lon = Number(b.longitude);
              if (Number.isFinite(lat) && Number.isFinite(lon)) {
                return (
                  <Marker
                    key={b.bin_id ?? b.id ?? `${lat}-${lon}`}
                    position={[lat, lon]}
                    icon={iconFor(b.current_fill_pct ?? b.fill_pct ?? b.fill_level ?? 0)}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <b>Bin ID:</b> {b.bin_id ?? b.id} <br />
                        <b>Fill:</b> {(b.current_fill_pct ?? b.fill_pct ?? b.fill_level ?? 0)}% <br />
                        <b>Capacity:</b> {b.capacity_litres ?? "-"} L
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}

            {Array.isArray(hotspots) && hotspots.map((h, idx) => {
              const lat = Number(h.latitude);
              const lon = Number(h.longitude);
              if (Number.isFinite(lat) && Number.isFinite(lon)) {
                return (
                  <Marker
                    key={`hp-${idx}`}
                    position={[lat, lon]}
                    icon={ICON_BLUE}
                  >
                    <Popup>
                      <div>
                        <b>Suggested New Bin</b><br />
                        Lat: {lat.toFixed(5)} <br />
                        Lon: {lon.toFixed(5)}
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>

          <div className="map-legend" style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            background: "#fff",
            padding: 10,
            borderRadius: 6,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            zIndex: 1000,
            fontSize: 13
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" width="18" alt="red" />
              <span> 80 - 100% (High)</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png" width="18" alt="orange" />
              <span>50 - 79% (Medium)</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" width="18" alt="green" />
              <span>0- 50% (Low)</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" width="18" alt="blue" />
              <span>Suggested New Bin</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
