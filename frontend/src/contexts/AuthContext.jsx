import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking; false = no auth; object = authed
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lumikids_user");
    const token = localStorage.getItem("lumikids_token");
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    api.get("/auth/me")
      .then((r) => {
        setUser(r.data);
        localStorage.setItem("lumikids_user", JSON.stringify(r.data));
      })
      .catch(() => {
        localStorage.removeItem("lumikids_token");
        localStorage.removeItem("lumikids_user");
        setUser(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("lumikids_token", data.token);
    localStorage.setItem("lumikids_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("lumikids_token");
    localStorage.removeItem("lumikids_user");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
