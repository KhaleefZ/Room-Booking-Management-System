import client from "./client";

export const getHotelSettings = () =>
  client.get("/hotel-settings/").then((r) => r.data);
