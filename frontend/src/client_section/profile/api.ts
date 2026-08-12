import api from "../../utils/axio";
import type { ClientProfileResponse } from "./types";

export const fetchClientProfile = async (signal?: AbortSignal) => {
  const response = await api.get<ClientProfileResponse>("/client/account/profile", { signal });
  return response.data.data;
};

export const updateClientPassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.post<{ success: boolean; message: string }>(
    "/client/account/change-password",
    { currentPassword, newPassword }
  );
  return response.data;
};
