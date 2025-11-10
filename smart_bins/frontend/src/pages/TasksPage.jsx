import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [unassignedAlerts, setUnassignedAlerts] = useState([]);
  const [filter, setFilter] = useState("assigned");
  const [form, setForm] = useState({ alert_id: "", worker_id: "" });
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const allTasks = await API.get("/tasks/admin/list");
      setTasks(allTasks);

      const activeAlerts = await API.get("/alert/active");
      const usedAlertIds = allTasks.map(t => t.alert_id);

      const unassigned = activeAlerts.filter(a => !usedAlertIds.includes(a.id));
      setUnassignedAlerts(unassigned);

      const allUsers = await API.get("/auth/users");
      const workersOnly = allUsers.filter(u => u.role === "worker");
      setWorkers(workersOnly);

    } catch (err) {
      setError(err.message || "Failed to load tasks/workers/alerts");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assign(e) {
    e.preventDefault();
    setError("");
    try {
      await API.post("/tasks/", form);
      setForm({ alert_id: "", worker_id: "" });
      loadData();
    } catch (err) {
      setError(err.message || "Assign failed");
    }
  }

  const filteredTasks = tasks.filter(t =>
    filter === "completed" ? t.status === "completed" : t.status === "assigned"
  );

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <h2>Tasks & Assignments</h2>

        <div className="card">
          <h3>Assign Alert to Worker</h3>
          <form className="form-inline" onSubmit={assign}>
            <select value={form.alert_id} onChange={(e)=>setForm({...form, alert_id:e.target.value})} required>
              <option value="">Select unassigned alert</option>
              {unassignedAlerts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.bin_id} — {new Date(a.created_at).toLocaleString()}
                </option>
              ))}
            </select>

            <select value={form.worker_id} onChange={(e)=>setForm({...form, worker_id:e.target.value})} required>
              <option value="">Select worker</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.username}</option>
              ))}
            </select>

            <button className="btn" type="submit">Assign Task</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <h3>Tasks</h3>

          <div style={{ marginBottom: 12 }}>
            <button className="btn small" onClick={() => setFilter("assigned")}>
              Assigned
            </button>
            <button className="btn small" onClick={() => setFilter("completed")} style={{ marginLeft: 8 }}>
              Completed
            </button>
          </div>

          <table className="table">
            <thead>
              <tr><th>ID</th><th>Alert</th><th>Worker</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
             <tr key={t.id}>
              <td>{t.id}</td>
           <td>{t.alert?.bin_id ?? t.alert?.id ?? "-"}</td>
            <td>{t.worker_id ?? "-"}</td>
            <td>{t.status}</td>
              </tr>
              ))}

            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
