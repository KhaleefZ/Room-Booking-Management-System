import client from "./client";

export const checkIdExists = (idNumber) =>
  client.get("/guests/check_id_exists/", { params: { id_number: idNumber } }).then((r) => r.data);
