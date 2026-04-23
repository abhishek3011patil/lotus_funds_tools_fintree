import { TelegramClient } from "telegram";

const clientStore = new Map<number, TelegramClient>();

export const setClient = (userId: number, client: TelegramClient) => {
  clientStore.set(userId, client);
};

export const getClient = (userId: number) => {
  return clientStore.get(userId);
};

export const deleteClient = (userId: number) => {
  clientStore.delete(userId);
};
// 🔥 NOTE: This store is a simple in-memory solution for managing TelegramClient instances per RA user. In a production environment, consider using a more robust storage solution (e.g., Redis) to handle scalability and persistence across server restarts.