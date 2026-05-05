import client from "./client";

export const getSettings = () =>
  client.get("/hotel-settings/").then((r) => r.data);

export const updateSettings = (data) =>
  client.patch("/hotel-settings/", data).then((r) => r.data);