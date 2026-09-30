export type ClientProfile = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  status: string;
  memberSince: string;
  avatarUrl?: string | null;
};

export type ClientProfileResponse = { success: boolean; data: ClientProfile };
