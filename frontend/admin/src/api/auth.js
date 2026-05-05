import axios from "axios";
import client from "./client";

export const login = (username, password) =>
  axios
    .post(`${import.meta.env.VITE_API_URL}/auth/token/`, { username, password })
    .then((r) => r.data);

export const refreshToken = (refresh) =>
  axios
    .post(`${import.meta.env.VITE_API_URL}/auth/token/refresh/`, { refresh })
    .then((r) => r.data);