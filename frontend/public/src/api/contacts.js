import client from "./client";

export const sendContactMessage = (data) => {
  return client.post("/contacts/", data);
};
