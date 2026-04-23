type OtpData = {
  phoneCodeHash: string;
  phoneNumber: string;
  expiresAt: number;
};

// store per RA user
const store = new Map<number, OtpData>();

export const otpStore = {
  set: (userId: number, data: OtpData) => {
    store.set(userId, data);
  },

  get: (userId: number): OtpData | undefined => {
    const data = store.get(userId);

    if (!data) return undefined;

    // 🔥 expiry check (IMPORTANT FIX)
    if (Date.now() > data.expiresAt) {
      store.delete(userId);
      return undefined;
    }

    return data;
  },

  delete: (userId: number) => {
    store.delete(userId);
  }
};
// 🔥 NOTE: This store is a simple in-memory solution for managing OTP data per RA user. In a production environment, consider using a more robust storage solution (e.g., Redis) to handle scalability and persistence across server restarts.