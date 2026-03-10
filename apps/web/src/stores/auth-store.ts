import { create } from "zustand";

interface MerchantProfile {
  businessName: string;
  taxId: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  merchantProfile: MerchantProfile | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setMerchantProfile: (profile: MerchantProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  merchantProfile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setMerchantProfile: (profile) => set({ merchantProfile: profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, merchantProfile: null, isLoading: false }),
}));
