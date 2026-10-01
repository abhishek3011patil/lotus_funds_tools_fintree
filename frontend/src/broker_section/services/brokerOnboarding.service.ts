import api from "../../utils/axio";
import type { ApiHistoryRecord } from "../../pages/common/RecommendationHistory";
import type { BrokerClient, BrokerClientDelivery } from "../types/broker.types";

export interface AssociatedAnalyst {
  id: string;
  name: string;
  sebiRegistration: string;
  category: string | null;
  registrationExpiry: string | null;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";
  onboardingMethod?: "DIRECT" | "LINK" | "EXISTING";
}
export interface BrokerInvitation {
  registrationPath: string;
  expiresAt: string;
  emailSent: boolean;
}
export const getBrokerAnalysts = async () => (await api.get<AssociatedAnalyst[]>("/broker/research-analysts")).data;
export const searchBrokerAnalysts = async (search: string) =>
  (await api.get<AssociatedAnalyst[]>("/broker/research-analysts/search", { params: { search } })).data;
export const addBrokerAnalyst = async (raId: string) => api.post("/broker/research-analysts", { raId });
export const removeBrokerAnalyst = async (raId: string) => api.delete(`/broker/research-analysts/${encodeURIComponent(raId)}`);
export const createBrokerInvitation = async (method: "DIRECT" | "LINK", email = "", sendEmail = false) =>
  (await api.post<BrokerInvitation>("/broker/ra-invitations", { method, email, sendEmail })).data;
export const getBrokerCalls = async () => (await api.get<ApiHistoryRecord[]>("/broker/research-calls")).data;
export const publishBrokerCall = async (callId: string, message: string) =>
  (await api.post(`/broker/research-calls/${encodeURIComponent(callId)}/publish`, { message })).data;
export const getBrokerClients = async (search = "") =>
  (await api.get<{ clients: BrokerClient[] }>("/broker/clients", { params: { search } })).data.clients;
export const createBrokerClient = async (client: { name: string; email: string; phoneNumber: string; aadhaarNumber: string; panNumber: string }) =>
  (await api.post("/broker/clients", client)).data;
export const setBrokerClientChannel = async (clientId: string, channel: "whatsapp" | "telegram", enabled: boolean, phoneNumber?: string) =>
  enabled
    ? (await api.post(`/broker/clients/${encodeURIComponent(clientId)}/${channel}`, { phoneNumber, consentConfirmed: true })).data
    : (await api.delete(`/broker/clients/${encodeURIComponent(clientId)}/${channel}`)).data;
export const getBrokerClientDeliveries = async (clientId: string) =>
  (await api.get<{ deliveries: BrokerClientDelivery[] }>(`/broker/clients/${encodeURIComponent(clientId)}/deliveries`)).data.deliveries;
export const onboardingError = (error: unknown): string => {
  const value = error as { response?: { data?: { message?: string } } };
  return value.response?.data?.message || "Unable to complete this request. Please try again.";
};
