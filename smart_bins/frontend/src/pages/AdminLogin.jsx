import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  async function submit(e) {
    e?.preventDefault();
    setError("");

    try {
      const data = await API.post("/auth/login", form);

      const token = data.token ?? data.access_token ?? data["access_token"];
      const role = data.role ?? data.user_role ?? data.role_name ?? "";

      if (!token) throw new Error("No token returned from server");
      if (!role) {
       throw new Error("No role returned from server");
      }
      login({ token, role: role || "admin" });

      if ((role || "admin") === "admin") navigate("/admin/dashboard");
      else if ((role || "").toLowerCase() === "worker") navigate("/worker/dashboard");
      else navigate("/admin/dashboard");

    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="center-page">
      <form className="card form" onSubmit={submit}>
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}

        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn" type="submit">Login</button>
        <button
  type="button"
  className="btn secondary"
  onClick={() => navigate("/user/map")}
  style={{ marginTop: "10px", backgroundColor: "#444" }}
>
  Continue as User
</button>

      </form>
    </div>
  );
}
