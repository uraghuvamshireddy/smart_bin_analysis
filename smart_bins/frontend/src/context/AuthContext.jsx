import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");
  }, [token, role]);

const login = ({ token, role }) => {
  const formattedToken = token?.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  setToken(formattedToken);
  setRole(role);
};


  const logout = () => {
    setToken("");
    setRole("");
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
