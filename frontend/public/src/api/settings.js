import client from "./client";

export const getPublicSettings = async () => {
  const response = await client.get("/hotel-settings/public/");
  return response.data;
};
