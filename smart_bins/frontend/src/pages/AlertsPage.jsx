import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

export default function AlertsPage() {
  const [active, setActive] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const a = await API.get("/alert/active");
      const r = await API.get("/alert/resolved");
      setActive(a);
      setResolved(r);
    } catch (err) {
      setError(err.message || "Failed to load alerts");
    }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <h2>Alerts</h2>
        {error && <div className="error">{error}</div>}

        <div className="card">
          <h3>Active Alerts</h3>
          {active.length === 0 ? <div>No active alerts</div> : (
            <ul>
              {active.map(a=>(
                <li key={a.id}>
                  <strong>{a.bin_id}</strong> — created at {new Date(a.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card" style={{marginTop: 12}}>
          <h3>Resolved Alerts</h3>
          {resolved.length === 0 ? <div>No resolved alerts</div> : (
            <ul>
              {resolved.map(a=>(
                <li key={a.id}>
                  <strong>{a.bin_id}</strong> — resolved at {a.resolved_at ? new Date(a.resolved_at).toLocaleString() : "-"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
