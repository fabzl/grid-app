import { create } from 'zustand';

export type UserProfile = {
  id: string;
  name: string;
  rut?: string;
  isVerified: boolean;
  idPhotoUri?: string;
  lat?: number;
  lon?: number;
};

type AuthState = {
  currentUser: UserProfile | null;
  login: (name: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  login: (name: string) =>
    set({
      currentUser: {
        id: 'me',
        name,
        isVerified: false,
      },
    }),
  logout: () => set({ currentUser: null }),
  updateProfile: (updates) =>
    set((s) => (s.currentUser ? { currentUser: { ...s.currentUser, ...updates } } : s)),
}));

export function validateRut(input: string): boolean {
  const clean = input.replace(/\.|-/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expected;
}


