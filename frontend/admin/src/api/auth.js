import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const login = (username, password) =>
  axios
    .post(`${API_BASE}/auth/token/`, { username, password })
    .then((r) => r.data);

export const refreshToken = (refresh) =>
  axios
    .post(`${API_BASE}/auth/token/refresh/`, { refresh })
    .then((r) => r.data);
