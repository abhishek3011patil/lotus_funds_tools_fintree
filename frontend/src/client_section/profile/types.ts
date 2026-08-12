export type ClientProfile = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  status: string;
  memberSince: string;
};

export type ClientProfileResponse = { success: boolean; data: ClientProfile };
