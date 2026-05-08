import client from "./client";

export const getPromos = () =>
  client.get("/promos/").then((r) => r.data);

export const createPromo = (data) =>
  client.post("/promos/", data).then((r) => r.data);

export const updatePromo = (id, data) =>
  client.patch(`/promos/${id}/`, data).then((r) => r.data);

export const deletePromo = (id) =>
  client.delete(`/promos/${id}/`).then((r) => r.data);