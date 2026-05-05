import client from "./client";

export const getRooms = (params) =>
  client.get("/rooms/", { params }).then((r) => r.data);

export const getRoom = (id) =>
  client.get(`/rooms/${id}/`).then((r) => r.data);

export const getRoomAvailability = (id, year, month) =>
  client.get(`/rooms/${id}/availability/`, { params: { year, month } }).then((r) => r.data);