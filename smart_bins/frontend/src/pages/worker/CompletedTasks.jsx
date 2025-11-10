import React, { useEffect, useState } from "react";
import WorkerSidebar from "../../components/WorkerSidebar";
import API from "../../services/api";

export default function CompletedTasks() {
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await API.get("/tasks/worker/list");
      const completed = data.filter(t => t.status === "completed");
      setTasks(completed);
    } catch (e) {
      setErr(e.message || "Failed to load completed tasks");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="layout">
      <WorkerSidebar />
      <div className="content">
        <h2>Completed Tasks</h2>

        {err && <div className="error">{err}</div>}

        {tasks.length === 0 ? <div>No completed tasks yet</div> : (
          <table className="table">
            <thead>
              <tr><th>Task ID</th><th>Bin ID</th><th>Completed At</th></tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                 <td>{t.alert?.bin_id ?? "-"}</td>
                 <td>{t.completed_at ? new Date(t.completed_at).toLocaleString() : "-"}</td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
