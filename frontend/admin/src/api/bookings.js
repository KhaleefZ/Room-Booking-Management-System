import client from "./client";

export const getBookings = (params) =>
  client.get("/bookings/", { params }).then((r) => r.data);

export const getBooking = (id) =>
  client.get(`/bookings/${id}/`).then((r) => r.data);

export const updateBookingStatus = (id, status) =>
  client.patch(`/bookings/${id}/update_status/`, { status }).then((r) => r.data);