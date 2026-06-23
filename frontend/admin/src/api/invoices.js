import client from "./client";

export const getInvoices = (params) =>
  client.get("/bookings/invoices/", { params }).then((r) => r.data);

export const getInvoice = (id) =>
  client.get(`/bookings/invoices/${id}/`).then((r) => r.data);

export const createInvoice = (data) =>
  client.post("/bookings/invoices/", data).then((r) => r.data);

export const updateInvoice = (id, data) =>
  client.put(`/bookings/invoices/${id}/`, data).then((r) => r.data);

export const downloadManualInvoice = (id) =>
  client.get(`/bookings/invoices/${id}/download/`, { responseType: 'blob' })
    .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
