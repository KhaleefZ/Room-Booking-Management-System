import client from "./client";

export const validatePromo = (code, amount) =>
  client.post("/promos/validate/", { code, amount }).then((r) => r.data);