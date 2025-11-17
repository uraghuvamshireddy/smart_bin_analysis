import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkerSidebar from "../../components/WorkerSidebar";
import API from "../../services/api";

export default function AssignedTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const resp = await API.get("/tasks/worker/list");
      const data = resp?.data ?? resp ?? [];
      const assigned = data.filter(t => t.status === "assigned");
      setTasks(assigned);
    } catch (e) {
      setErr(e.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(id) {
    if (!confirm("Mark this task as completed?")) return;
    try {
      await API.post(`/tasks/${id}/complete`);
      alert("Task marked completed.");
      await load();
    } catch (e) {
      if (e.response && e.response.status === 400 && e.response.data && e.response.data.detail === "Bin not clean enough according to sensor. Please re-check and try again.") {
        alert("Bin is not clean enough according to sensor. Please re-check and try again.");
      } else {
        alert(e.message || "Failed to complete task");
      }
      await load();
    }
  }

  useEffect(() => {
    load();
  }, []);

  const goToMap = () => {
    const binIds = tasks.map(t => t.alert?.bin_id).filter(Boolean);
    navigate("/worker/route", { state: { binIds } });
  };

  return (
    <div className="layout">
      <WorkerSidebar />
      <div className="content">
        <h2>Assigned Tasks</h2>
        {tasks.length > 0 && (
          <button className="btn" style={{ marginBottom: "10px" }} onClick={goToMap}>
            Show Map Route
          </button>
        )}
        {err && <div className="error">{err}</div>}
        {loading ? <div>Loading...</div> : (
          tasks.length === 0 ? <div>No assigned tasks right now</div> : (
            <table className="table">
              <thead>
                <tr><th>Task ID</th><th>Bin ID</th><th>Alert ID</th><th>Status</th><th>Assigned At</th><th>Action</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.alert?.bin_id ?? "-"}</td>
                    <td>{t.alert?.id ?? "-"}</td>
                    <td>{t.status}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>
                      {t.status === "assigned" ? (
                        <button className="btn small" onClick={() => completeTask(t.id)}>Complete</button>
                      ) : (
                        <span>{t.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}