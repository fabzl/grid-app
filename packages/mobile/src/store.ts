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

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  lat?: number;
  lon?: number;
  createdAt: number;
  sold: boolean;
};

export type Service = {
  id: string;
  providerId: string;
  type: 'taxi' | 'delivery' | 'room_rental' | 'professional' | 'other';
  title: string;
  description: string;
  pricePerKm?: number;
  basePrice?: number;
  pricePerNight?: number; // Para habitaciones
  pricePerHour?: number; // Para servicios profesionales
  currency: string;
  lat?: number;
  lon?: number;
  available: boolean;
  createdAt: number;
  // Para habitaciones
  roomCapacity?: number;
  roomImages?: string[];
  amenities?: string[];
  // Para servicios profesionales
  professionalCategory?: string; // ej: 'abogado', 'contador', 'diseñador', etc.
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUri?: string;
  type: 'text' | 'image';
  timestamp: number;
};

type AuthState = {
  currentUser: UserProfile | null;
  login: (name: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  // User moderation
  reportedUsers: Set<string>;
  mutedUsers: Set<string>;
  hiddenUsers: Set<string>;
  reportUser: (userId: string, reason: string) => void;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  hideUser: (userId: string) => void;
  unhideUser: (userId: string) => void;
  // Messages
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, receiverId: string, text?: string, imageUri?: string) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
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
    set((s) => (s.currentUser ? { currentUser: { ...s.currentUser, ...updates } : s)),
  reportedUsers: new Set(),
  mutedUsers: new Set(),
  hiddenUsers: new Set(),
  reportUser: (userId: string, reason: string) => {
    const { reportedUsers } = get();
    const updated = new Set(reportedUsers);
    updated.add(userId);
    set({ reportedUsers: updated });
    console.log(`Usuario ${userId} reportado: ${reason}`);
  },
  muteUser: (userId: string) => {
    const { mutedUsers } = get();
    const updated = new Set(mutedUsers);
    updated.add(userId);
    set({ mutedUsers: updated });
  },
  unmuteUser: (userId: string) => {
    const { mutedUsers } = get();
    const updated = new Set(mutedUsers);
    updated.delete(userId);
    set({ mutedUsers: updated });
  },
  hideUser: (userId: string) => {
    const { hiddenUsers } = get();
    const updated = new Set(hiddenUsers);
    updated.add(userId);
    set({ hiddenUsers: updated });
  },
  unhideUser: (userId: string) => {
    const { hiddenUsers } = get();
    const updated = new Set(hiddenUsers);
    updated.delete(userId);
    set({ hiddenUsers: updated });
  },
  messages: {},
  sendMessage: (chatId: string, receiverId: string, text?: string, imageUri?: string) => {
    const { messages, currentUser } = get();
    if (!currentUser) return;
    
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      chatId,
      senderId: currentUser.id,
      receiverId,
      text,
      imageUri,
      type: imageUri ? 'image' : 'text',
      timestamp: Date.now(),
    };
    
    const chatMessages = messages[chatId] || [];
    set({
      messages: {
        ...messages,
        [chatId]: [...chatMessages, message],
      },
    });
  },
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
