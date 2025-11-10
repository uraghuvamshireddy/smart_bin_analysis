import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API from "../services/api";

const ICON_GREEN = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png", iconSize: [25,41], iconAnchor:[12,41] });
const ICON_ORANGE = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png", iconSize: [25,41], iconAnchor:[12,41] });
const ICON_RED = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png", iconSize: [25,41], iconAnchor:[12,41] });
const ICON_BLUE = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png", iconSize: [25,41], iconAnchor:[12,41] });

export default function MapHotspots({ center=[23.8315,91.2864], zoom=12 }) {
  const [bins, setBins] = useState([]);
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    API.get("/bins/").then(d => setBins(d)).catch(()=>setBins([]));
    API.get("/ml/hotspots").then(d => setHotspots(d.hotspot_centers || [])).catch(()=>setHotspots([]));
  }, []);

  const iconFor = (pct) => pct >= 80 ? ICON_RED : (pct >= 50 ? ICON_ORANGE : ICON_GREEN);

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: 420, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {Array.isArray(bins) && bins.map(b => (
        <Marker key={b.bin_id} position={[b.latitude, b.longitude]} icon={iconFor(b.current_fill_pct || 0)}>
          <Popup><b>{b.bin_id}</b><br/>Fill: {b.current_fill_pct}%</Popup>
        </Marker>
      ))}
      {Array.isArray(hotspots) && hotspots.map((h,i) => (
        <Marker key={"hp"+i} position={[h.latitude, h.longitude]} icon={ICON_BLUE}>
          <Popup>Suggested new bin area</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
