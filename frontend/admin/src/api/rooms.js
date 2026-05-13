import client from "./client";

export const getRooms = (params) =>
  client.get("/rooms/", { params }).then((r) => r.data);

export const getRoom = (id) =>
  client.get(`/rooms/${id}/`).then((r) => r.data);

export const createRoom = (data) =>
  client.post("/rooms/", data).then((r) => r.data);

export const updateRoom = (id, data) =>
  client.patch(`/rooms/${id}/`, data).then((r) => r.data);

export const updateRoomStatus = (id, status) =>
  client.patch(`/rooms/${id}/update_status/`, { status }).then((r) => r.data);

export const deleteRoom = (id) =>
  client.delete(`/rooms/${id}/`).then((r) => r.data);

export const getAmenities = () =>
  client.get("/rooms/amenities/").then((r) => r.data);

export const createAmenity = (data) =>
  client.post("/rooms/amenities/", data).then((r) => r.data);

export const uploadRoomPhoto = (id, file, isPrimary = false) => {
  const form = new FormData();
  form.append("image", file);
  if (isPrimary) form.append("is_primary", "true");
  return client
    .post(`/rooms/${id}/photos/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const setPrimaryPhoto = (roomId, photoId) =>
  client.patch(`/rooms/${roomId}/photos/${photoId}/`, { is_primary: true }).then((r) => r.data);

export const deleteRoomPhoto = (roomId, photoId) =>
  client.delete(`/rooms/${roomId}/photos/${photoId}/`).then((r) => r.data);