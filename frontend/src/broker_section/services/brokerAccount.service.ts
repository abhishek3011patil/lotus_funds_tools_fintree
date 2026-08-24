import api from "../../utils/axio";
import type { CurrentSubscriptionResponse } from "../../types/subscription";
import type { BrokerAccountResponse } from "../types/brokerAccount";

export const getMyBrokerAccount = async () =>
  (await api.get<BrokerAccountResponse>("/broker/me")).data;

export const getMyBrokerSubscription = async () =>
  (await api.get<CurrentSubscriptionResponse>("/subscriptions/me")).data;

export const changeMyBrokerPassword = async (
  currentPassword: string,
  newPassword: string
) =>
  (
    await api.post<{ success: boolean; message: string }>(
      "/broker/change-password",
      { currentPassword, newPassword }
    )
  ).data;
