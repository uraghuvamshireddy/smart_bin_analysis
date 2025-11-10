import React from "react";

export default function KpiCard({ title, value, hint, color = "#2563eb" }) {
  return (
    <div className="kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value ?? "-"}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
