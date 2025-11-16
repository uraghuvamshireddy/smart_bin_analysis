import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../../services/api";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const workerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
});

const binIcon = new L.Icon({
iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",  iconSize: [35, 35],
});


export default function OptimalRouteMap() {
  const location = useLocation();
  const binIds = location.state?.binIds || [];

  const [bins, setBins] = useState([]);
  const [workerPos, setWorkerPos] = useState(null);
  const [route, setRoute] = useState([]);

  // ✅ Get worker location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setWorkerPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => alert("Enable location! Unable to fetch worker GPS.")
    );
  }, []);

  // ✅ Get bins assigned
  useEffect(() => {
    async function load() {
      const all = await API.get("/bins/");
      const selected = all.filter(b => binIds.includes(b.bin_id));
      setBins(selected);
    }
    load();
  }, [binIds]);

  // ✅ Compute optimized + real road route
  useEffect(() => {
    if (!workerPos || bins.length === 0) return;

    let ordered = nearestOrder(workerPos, bins);

    let routePoints = [];

    async function fetchRoute() {
      for (let i = 0; i < ordered.length - 1; i++) {
        const a = ordered[i];
        const b = ordered[i + 1];

        const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          routePoints.push(...coords);
        }
      }
      setRoute(routePoints);
    }

    fetchRoute();
  }, [workerPos, bins]);

  // ✅ Simple nearest-neighbor to sort bins
  const nearestOrder = (start, bins) => {
    let order = [start];
    let remaining = [...bins];
    let pos = { lat: start[0], lng: start[1] };

    while (remaining.length > 0) {
      remaining.sort(
        (a, b) =>
          distance(pos, a) - distance(pos, b)
      );
      let next = remaining.shift();
      order.push([next.latitude, next.longitude]);
      pos = next;
    }
    return order;
  };

  const distance = (p, b) => Math.hypot(p.lat - b.latitude, p.lng - b.longitude);

  if (!workerPos) return <div>📍 Getting location...</div>;

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={workerPos} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={workerPos} icon={workerIcon}>
  <Popup>Worker Start Point</Popup>
</Marker>

{bins.map(b => (
  <Marker key={b.bin_id} position={[b.latitude, b.longitude]} icon={binIcon}>
    <Popup>Bin: {b.bin_id}</Popup>
  </Marker>
))}


        {/* ✅ Road Route */}
        {route.length > 1 && <Polyline positions={route} />}
      </MapContainer>
    </div>
  );
}
