import client from "./client";

export const createBooking = (data) =>
  client.post("/bookings/", data).then((r) => r.data);

export const createPaymentOrder = (bookingId) =>
  client.post("/payments/create-order/", { booking_id: bookingId }).then((r) => r.data);

export const verifyPayment = (data) =>
  client.post("/payments/verify/", data).then((r) => r.data);