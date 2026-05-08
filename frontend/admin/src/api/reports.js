import client from "./client";

export const getRevenueReport = (from, to) =>
  client.get("/reports/revenue/", { params: { from, to } }).then((r) => r.data);

export const getOccupancyReport = (from, to) =>
  client.get("/reports/occupancy/", { params: { from, to } }).then((r) => r.data);

export const exportCSV = (from, to) =>
  client
    .get("/reports/export/", { params: { from, to }, responseType: "blob" })
    .then((r) => r.data);