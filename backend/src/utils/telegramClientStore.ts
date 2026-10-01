import { TelegramClient } from "telegram";

const clientStore = new Map<string, TelegramClient>();

export const setClient = (userId: string, client: TelegramClient) => {
  clientStore.set(userId, client);
};

export const getClient = (userId: string) => {
  return clientStore.get(userId);
};

export const deleteClient = (userId: string) => {
  clientStore.delete(userId);
};
// 🔥 NOTE: This store is a simple in-memory solution for managing TelegramClient instances per RA user. In a production environment, consider using a more robust storage solution (e.g., Redis) to handle scalability and persistence across server restarts.
