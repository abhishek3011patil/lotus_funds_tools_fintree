import api from "../../utils/axio";
import type { ClientDashboardResponse } from "./types";

export const fetchClientDashboard = async (signal?: AbortSignal) => {
  const response = await api.get<ClientDashboardResponse>("/client/dashboard", {
    signal,
  });
  return response.data;
};
