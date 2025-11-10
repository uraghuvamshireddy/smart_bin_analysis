import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function WorkerSidebar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const active = (p) =>
    loc.pathname.includes(p) ? "side-link active" : "side-link";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };


  return (
    <div className="sidebar">
      <div className="brand">SmartBin Worker</div>

      <nav>
        <Link className={active("/worker/dashboard")} to="/worker/dashboard">
          Dashboard
        </Link>

        <Link className={active("/worker/tasks")} to="/worker/tasks">
          Assigned Tasks
        </Link>

        <Link className={active("/worker/completed")} to="/worker/completed">
          Completed Tasks
        </Link>

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
