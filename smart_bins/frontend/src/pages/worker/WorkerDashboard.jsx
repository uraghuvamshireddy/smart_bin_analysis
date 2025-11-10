import React, { useEffect, useState } from "react";
import WorkerSidebar from "../../components/WorkerSidebar";
import API from "../../services/api";

export default function WorkerDashboard() {
  const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0 });

  async function load() {
    try {
      const tasks = await API.get("/tasks/worker/list");
      const pending = tasks.filter(t => t.status === "assigned").length;
      const completed = tasks.filter(t => t.status === "completed").length;
      setSummary({ total: tasks.length, pending, completed });
    } catch (err) {
      console.error("load worker summary:", err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="layout">
      <WorkerSidebar />
      <div className="content">
        <h1>Worker Dashboard</h1>
        <div className="cards" style={{ marginTop: 12 }}>
          <div className="card small">Total Tasks: {summary.total}</div>
          <div className="card small">Pending: {summary.pending}</div>
          <div className="card small">Completed: {summary.completed}</div>
        </div>
      </div>
    </div>
  );
}
