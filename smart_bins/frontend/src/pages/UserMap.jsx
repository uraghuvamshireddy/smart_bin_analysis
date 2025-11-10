import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API from "../services/api"; // Assuming API service is in ../../services/api

// Define custom icons for different fill levels
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

const ICON_BLUE = new L.Icon({ // For user's current location
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Helper component to fit map bounds to markers
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds || bounds.length === 0) return;
    try {
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
      console.error("Error fitting bounds:", e);
    }
  }, [map, bounds]);
  return null;
}


export default function UserMap() {
  const [bins, setBins] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestBin, setNearestBin] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to fetch bins (can be called repeatedly)
  const fetchBins = async () => {
    try {
      const res = await API.get("/bins/");
      const payload = res?.data ?? res ?? [];
      if (!Array.isArray(payload)) {
        if (payload?.bins && Array.isArray(payload.bins)) setBins(payload.bins);
        else setBins([]);
      } else {
        setBins(payload);
      }
    } catch (e) {
      console.error("Failed to load bins", e);
      setBins([]);
      setError("Failed to load bins.");
    }
  };

  // ✅ Get user's current location continuously with watchPosition
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false); // Location found, stop initial loading indicator
      },
      (err) => {
        console.error("Error getting user location:", err);
        setError("Please enable location services to see your position.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Cleanup function to clear watchPosition when component unmounts
    return () => navigator.geolocation.clearWatch(watchId);
  }, []); // Empty dependency array means this runs once on mount

  // ✅ Get bins periodically
  useEffect(() => {
    fetchBins(); // Fetch immediately on mount

    const intervalId = setInterval(fetchBins, 30000); // Fetch every 30 seconds

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs once on mount

  // Calculate nearest bin and route when userLocation or bins change
  useEffect(() => {
    if (!userLocation || bins.length === 0) {
      // If we have userLocation but no bins, loading might be misleading
      if (userLocation && bins.length === 0) setLoading(false);
      return;
    }

    setLoading(true); // Indicate that route is being calculated
    let minDistance = Infinity;
    let closestBin = null;

    bins.forEach((bin) => {
      const binLat = Number(bin.latitude);
      const binLon = Number(bin.longitude);
      if (Number.isFinite(binLat) && Number.isFinite(binLon)) {
        const dist = distance(
          { lat: userLocation[0], lng: userLocation[1] },
          { latitude: binLat, longitude: binLon }
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestBin = bin;
        }
      }
    });
    setNearestBin(closestBin);

    async function fetchRoute() {
      if (closestBin) {
        const userCoords = `${userLocation[1]},${userLocation[0]}`;
        const binCoords = `${Number(closestBin.longitude)},${Number(closestBin.latitude)}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${userCoords};${binCoords}?overview=full&geometries=geojson`;

        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes?.[0]?.geometry?.coordinates) {
            const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
            setRoute(coords);
          } else {
            console.warn("No route found from OSRM.");
            setRoute([]);
          }
        } catch (e) {
          console.error("Error fetching route from OSRM:", e);
          setRoute([]);
        }
      } else {
        setRoute([]); // Clear route if no bins or no closest bin found
      }
      setLoading(false); // Route calculation finished
    }

    fetchRoute();
  }, [userLocation, bins]); // This useEffect depends on userLocation and bins

  // ... (distance, iconFor, allMapPoints, and return JSX remain the same) ...
  const distance = (p1, p2) =>
    Math.hypot(p1.lat - p2.latitude, p1.lng - p2.longitude);

  // Determine icon based on fill percentage
  const iconFor = (fillPct) => {
    const pct = Number(fillPct ?? 0);
    if (pct >= 80) return ICON_RED;
    if (pct >= 50) return ICON_ORANGE;
    return ICON_GREEN;
  };

  // Prepare bounds for FitBounds component
  const allMapPoints = [];
  if (userLocation) allMapPoints.push(userLocation);
  bins.forEach(b => {
    const lat = Number(b.latitude);
    const lon = Number(b.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      allMapPoints.push([lat, lon]);
    }
  });


  if (loading && !userLocation) return <div style={{ padding: 20 }}>Getting your location and map data...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!userLocation) return <div style={{ padding: 20 }}>Waiting for your location...</div>;


  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
      <h2 style={{ padding: "10px 20px", margin: 0 }}>Smart Bin User Map</h2>
      <div style={{ flexGrow: 1, position: "relative" }}>
        <MapContainer
          center={userLocation}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Fit map bounds to all points */}
          {allMapPoints.length > 0 && <FitBounds bounds={allMapPoints} />}

          {/* User's current location marker */}
          {userLocation && (
            <Marker position={userLocation} icon={ICON_BLUE}>
              <Popup>Your Current Location</Popup>
            </Marker>
          )}

          {/* Bin Markers */}
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
                      <b>Capacity:</b> {b.capacity_litres ?? "-"} L <br />
                      {nearestBin && nearestBin.bin_id === b.bin_id && <b>(Nearest Bin)</b>}
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

          {/* Shortest path to nearest bin */}
          {route.length > 1 && <Polyline positions={route} color="blue" weight={5} />}
        </MapContainer>

        {/* Map Legend */}
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
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" width="18" alt="blue marker" />
            <span> Your Location</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" width="18" alt="red marker" />
            <span> 80 - 100% Full (High)</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png" width="18" alt="orange marker" />
            <span> 50 - 79% Full (Medium)</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" width="18" alt="green marker" />
            <span> 0 - 49% Full (Low)</span>
          </div>
        </div>
      </div>
    </div>
  );
}