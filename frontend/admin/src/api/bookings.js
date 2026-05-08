import client from "./client";

export const getBookings = (params) =>
  client.get("/bookings/", { params }).then((r) => r.data);

export const getBooking = (id) =>
  client.get(`/bookings/${id}/`).then((r) => r.data);

export const updateBookingStatus = (id, status) =>
  client.patch(`/bookings/${id}/update_status/`, { status }).then((r) => r.data);

export const checkoutBooking = (id) =>
  client.post(`/bookings/${id}/checkout/`).then((r) => r.data);

export const downloadInvoice = (id) =>
  client.get(`/bookings/${id}/download_invoice/`, { responseType: 'blob' })
    .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
    });

export const updateBooking = (id, data) =>
  client.patch(`/bookings/${id}/`, data).then((r) => r.data);

export const createBooking = (data) =>
  client.post("/bookings/", data).then((r) => r.data);