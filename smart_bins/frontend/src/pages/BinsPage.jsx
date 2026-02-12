import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationSelector({ form, setForm }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      setForm({ ...form, latitude: lat, longitude: lng });
    },
  });
  return null;
}

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function BinsPage() {
  const [bins, setBins] = useState([]);
  
  const [form, setForm] = useState({ 
    bin_id: "", 
    latitude: "", 
    longitude: "", 
    capacity_litres: 100 
  });

  const [editingId, setEditingId] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const DEFAULT_CENTER = [12.9716, 77.5946]; 

  async function load() {
    setLoading(true);
    try {
      const data = await API.get("/bins/");
      setBins(data);
    } catch (err) {
      setError(err.message || "Failed to load bins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    try {
      const payload = {
        bin_id: form.bin_id,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        capacity_litres: parseInt(form.capacity_litres, 10),
      };

      if (editingId) {
        await API.put(`/bins/${encodeURIComponent(editingId)}`, payload);
      } else {
        await API.post("/bins/", payload);
      }

      resetForm();
      load();
    } catch (err) {
      setError(err.message || "Operation failed");
    }
  }

  async function deleteBin(bin_id) {
    if (!confirm(`Delete bin ${bin_id}?`)) return;
    try {
      await API.del(`/bins/${encodeURIComponent(bin_id)}`);
      load();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  function startEdit(bin) {
    setEditingId(bin.bin_id);
    setForm({
      bin_id: bin.bin_id,
      latitude: bin.latitude,
      longitude: bin.longitude,
      capacity_litres: bin.capacity_litres,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ bin_id: "", latitude: "", longitude: "", capacity_litres: 100 });
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <h2>{editingId ? "Edit Bin" : "Add New Bin"}</h2>

        <div className="card" style={{ marginBottom: "20px", padding: "0", overflow: "hidden" }}>
          <div style={{ height: "350px", width: "100%" }}>
            <MapContainer 
              center={DEFAULT_CENTER} 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              
              <LocationSelector form={form} setForm={setForm} />

              <MapRecenter lat={form.latitude} lng={form.longitude} />

              {form.latitude && form.longitude && (
                <Marker position={[form.latitude, form.longitude]} />
              )}
            </MapContainer>
          </div>
          <div style={{ padding: "10px", background: "#f9f9f9", borderTop: "1px solid #eee" }}>
            <small>📍 Click anywhere on the map to set the bin location automatically.</small>
          </div>
        </div>

        <form className="card form-inline" onSubmit={handleSubmit} style={{ alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Bin ID</label>
            <input 
              placeholder="Bin ID" 
              value={form.bin_id} 
              onChange={(e)=>setForm({...form, bin_id:e.target.value})} 
              required 
              disabled={!!editingId} 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Latitude</label>
            <input 
              placeholder="Lat" 
              value={form.latitude} 
              onChange={(e)=>setForm({...form, latitude:e.target.value})} 
              required 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Longitude</label>
            <input 
              placeholder="Lon" 
              value={form.longitude} 
              onChange={(e)=>setForm({...form, longitude:e.target.value})} 
              required 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label>Capacity (L)</label>
            <input 
              placeholder="100" 
              value={form.capacity_litres} 
              onChange={(e)=>setForm({...form, capacity_litres:e.target.value})} 
            />
          </div>

          <div style={{ display: "flex", gap: "10px", paddingBottom: "2px" }}>
            <button className="btn" type="submit">
              {editingId ? "Update Bin" : "Add Bin"}
            </button>
            
            {editingId && (
              <button className="btn" type="button" onClick={resetForm} style={{ background: "#999" }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        {loading ? <div>Loading bins...</div> : (
          <table className="table" style={{ marginTop: "20px" }}>
            <thead>
              <tr>
                <th>Bin ID</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((b) => (
                <tr key={b.bin_id} style={{ background: editingId === b.bin_id ? "#fff3cd" : "transparent" }}>
                  <td>{b.bin_id}</td>
                  <td>{b.latitude}</td>
                  <td>{b.longitude}</td>
                  <td>{b.capacity_litres ?? "-"}</td>
                  <td>
                    <button className="btn small" style={{ marginRight: "6px" }} onClick={() => startEdit(b)}>
                      Edit
                    </button>
                    <button className="btn small" onClick={() => deleteBin(b.bin_id)} style={{ background: "#ff4d4d" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}