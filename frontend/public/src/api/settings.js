import client from "./client";

export const getHotelSettings = () =>
  client.get("/hotel-settings/").then((r) => r.data);

export const getPublicSettings = () =>
  client.get("/hotel-settings/public/").then((r) => r.data);
