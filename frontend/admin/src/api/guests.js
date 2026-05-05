import client from "./client";

export const getGuests = (params) =>
  client.get("/guests/", { params }).then((r) => r.data);

export const getGuest = (id) =>
  client.get(`/guests/${id}/`).then((r) => r.data);