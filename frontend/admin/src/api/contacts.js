import client from "./client";

export const getContactMessages = (params) => {
  return client.get("/contacts/", { params }).then((r) => r.data);
};

export const updateContactMessage = (id, data) => {
  return client.patch(`/contacts/${id}/`, data).then((r) => r.data);
};

export const deleteContactMessage = (id) => {
  return client.delete(`/contacts/${id}/`).then((r) => r.data);
};
