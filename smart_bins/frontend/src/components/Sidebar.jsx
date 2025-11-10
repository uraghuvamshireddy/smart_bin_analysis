import React from "react";
import { Link, useLocation,useNavigate } from "react-router-dom";

export default function Sidebar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const active = (p) => (loc.pathname.includes(p) ? "side-link active" : "side-link");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="brand">SmartBin Admin</div>
      <nav>
        <Link className={active("/admin/dashboard")} to="/admin/dashboard">Dashboard</Link>
        <Link className={active("/admin/bins")} to="/admin/bins">Bins</Link>
        <Link className={active("/admin/alerts")} to="/admin/alerts">Alerts</Link>
        <Link className={active("/admin/tasks")} to="/admin/tasks">Tasks</Link>
          <Link className={active("/admin/map")} to="/admin/map">Map View</Link>

         <button
              onClick={handleLogout}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "red",
                cursor: "pointer",
                fontSize: "16px",
                textAlign: "left",
                padding: "10px 0"
              }}
            >
              Logout
            </button>
      </nav>
    </div>
  );
}
