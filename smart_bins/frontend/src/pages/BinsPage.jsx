import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

export default function BinsPage() {
  const [bins, setBins] = useState([]);
    const [editBin, setEditBin] = useState(null);
  const [form, setForm] = useState({ bin_id: "", latitude: "", longitude: "", capacity_litres: 100 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function createBin(e) {
    e.preventDefault();
    setError("");
    try {
      await API.post("/bins/", {
        bin_id: form.bin_id,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        capacity_litres: parseInt(form.capacity_litres, 10),
      });
      setForm({ bin_id: "", latitude: "", longitude: "", capacity_litres: 100 });
      load();
    } catch (err) {
      setError(err.message || "Failed to create bin");
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

  function openEdit(bin) {
  setEditBin(bin.bin_id);
  setForm({
    bin_id: bin.bin_id,
    latitude: bin.latitude,
    longitude: bin.longitude,
    capacity_litres: bin.capacity_litres,
  });
}



  function closeEdit() {
    setEditBin(null);
  }

   async function updateBin() {
  try {
    await API.put(`/bins/${encodeURIComponent(editBin)}`, {
  bin_id: form.bin_id,
  latitude: parseFloat(form.latitude),
  longitude: parseFloat(form.longitude),
  capacity_litres: parseInt(form.capacity_litres, 10),
});

    closeEdit();
    load();
  } catch (err) {
    alert("Update failed: " + err.message);
  }
}


  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <h2>Bins Management</h2>

        <form className="card form-inline" onSubmit={createBin}>
          <input placeholder="Bin ID" value={form.bin_id} onChange={(e)=>setForm({...form, bin_id:e.target.value})} required />
          <input placeholder="Latitude" value={form.latitude} onChange={(e)=>setForm({...form, latitude:e.target.value})} required />
          <input placeholder="Longitude" value={form.longitude} onChange={(e)=>setForm({...form, longitude:e.target.value})} required />
          <input placeholder="Capacity (L)" value={form.capacity_litres} onChange={(e)=>setForm({...form, capacity_litres:e.target.value})} />
          <button className="btn" type="submit">Add Bin</button>
        </form>

        {error && <div className="error">{error}</div>}
        {loading ? <div>Loading bins...</div> : (
          <table className="table">
            <thead>
              <tr><th>Bin ID</th><th>Lat</th><th>Lon</th><th>Fill %</th><th>Capacity</th><th>Actions</th></tr>
            </thead>
           <tbody>
  {bins.map((b) => (
    <tr key={b.id}>
      <td>{editBin === b.bin_id ? (
        <input value={form.bin_id}
          onChange={(e)=>setForm({...form, bin_id:e.target.value})} />
      ) : b.bin_id}</td>

      <td>{editBin === b.bin_id ? (
        <input value={form.latitude}
          onChange={(e)=>setForm({...form, latitude:e.target.value})} />
      ) : b.latitude}</td>

      <td>{editBin === b.bin_id ? (
        <input value={form.longitude}
          onChange={(e)=>setForm({...form, longitude:e.target.value})} />
      ) : b.longitude}</td>

      <td>{b.current_fill_pct ?? 0}%</td>

      <td>{editBin === b.bin_id ? (
        <input value={form.capacity_litres}
          onChange={(e)=>setForm({...form, capacity_litres:e.target.value})}/>
      ) : (b.capacity_litres ?? "-")}</td>

      <td>
        {editBin === b.bin_id ? (
          <>
            <button className="btn small" style={{ marginRight: "6px" }} onClick={updateBin}>
              Save
            </button>
            <button className="btn small" onClick={closeEdit}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="btn small" style={{ marginRight: "6px" }} onClick={() => openEdit(b)}>
              Edit
            </button>
            <button className="btn small" onClick={() => deleteBin(b.bin_id)}>
              Delete
            </button>
          </>
        )}
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
