import api from "../utils/axio";

export type AudienceMemberType = "CLIENT" | "BROKER";
export type AudienceMember = { type: AudienceMemberType; id: string; name: string };
export type AudienceGroup = {
  id: string;
  name: string;
  description: string | null;
  members: AudienceMember[];
  createdAt: string;
  updatedAt: string;
};
export type AudienceConnection = { id: string; name: string; email?: string | null; sebiRegistration?: string | null };

export const fetchAudienceGroups = async () =>
  (await api.get<{ groups: AudienceGroup[] }>("/ra/dashboard/audience-groups")).data.groups ?? [];

export const fetchAudienceConnections = async () => {
  const data = (await api.get<{ clients?: AudienceConnection[]; brokers?: AudienceConnection[] }>("/ra/dashboard/audience-groups/connections")).data;
  return { clients: data.clients ?? [], brokers: data.brokers ?? [] };
};

export const createAudienceGroup = async (input: { name: string; description: string; members: Array<{ type: AudienceMemberType; id: string }> }) =>
  (await api.post("/ra/dashboard/audience-groups", input)).data;

export const updateAudienceGroup = async (groupId: string, input: { name: string; description: string; members: Array<{ type: AudienceMemberType; id: string }> }) =>
  (await api.put(`/ra/dashboard/audience-groups/${encodeURIComponent(groupId)}`, input)).data;

export const deleteAudienceGroup = async (groupId: string) =>
  api.delete(`/ra/dashboard/audience-groups/${encodeURIComponent(groupId)}`);
