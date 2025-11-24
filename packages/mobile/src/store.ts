import { create } from 'zustand';
import { holochainClient, Post as HolochainPost } from './holochain';
import * as Location from 'expo-location';

export type UserProfile = {
  id: string;
  email?: string;
  name: string;
  rut?: string;
  isVerified: boolean;
  idPhotoUri?: string;
  profileImageHash?: string;
  idCardImageHash?: string;
  lat?: number;
  lon?: number;
  ghostMode?: boolean;
  lastSeen?: number;
  isDriver?: boolean;
  driverStatus?: 'available' | 'busy' | 'offline';
  vehicleInfo?: VehicleInfo;
};

export type VehicleInfo = {
  make: string;
  model: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  capacity: number;
  pricePerKm?: number;
  basePrice?: number;
  currency: string;
};

export type StickerData = {
  stickerType: 'emoji' | 'image' | 'text';
  content: string;
  x: number; // 0-1
  y: number; // 0-1
  scale: number;
  rotation: number;
};

export type Post = {
  id: string;
  hash?: string; // Entry hash from Holochain
  authorId: string;
  authorName?: string;
  text?: string;
  imageHashes: string[];
  imageUris?: string[];
  videoHash?: string;
  videoUri?: string;
  stickerData?: StickerData[];
  createdAt: number;
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
  claps?: number;
  likes?: number;
  userLiked?: boolean;
  comments?: PostComment[];
};

export type PostComment = {
  id: string;
  hash?: string;
  authorId: string;
  authorName?: string;
  text: string;
  createdAt: number;
  parentCommentHash?: string;
  replies?: PostComment[];
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
  type: 'taxi' | 'delivery' | 'room_rental' | 'accommodation' | 'professional' | 'other';
  title: string;
  description: string;
  pricePerKm?: number;
  basePrice?: number;
  pricePerNight?: number; // Para habitaciones y alojamientos
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
  // Para alojamientos (Airbnb)
  accommodationType?: 'casa_completa' | 'habitacion' | 'sofa' | 'departamento';
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string;
  cancellationPolicy?: string;
  minimumNights?: number;
  maximumNights?: number;
  videos?: string[]; // Videos del alojamiento
};

export type Message = {
  id: string;
  hash?: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  text?: string;
  imageHash?: string;
  imageUri?: string;
  videoHash?: string;
  videoUri?: string;
  type: 'text' | 'image' | 'video';
  timestamp: number;
  read: boolean;
};

export type Chat = {
  userId: string;
  userName: string;
  lastMessage?: Message;
  unreadCount: number;
  totalCharacters?: number; // Total characters exchanged in this chat
  isFriend?: boolean;
};

export type Wish = {
  id: string;
  hash?: string;
  authorId: string;
  authorName?: string;
  text: string;
  imageHash?: string;
  imageUri?: string;
  videoHash?: string;
  videoUri?: string;
  fulfilled: boolean;
  createdAt: number;
  helpers?: WishHelp[];
};

export type WishHelp = {
  id: string;
  hash?: string;
  wishId: string;
  helperId: string;
  helperName?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: number;
};

type AuthState = {
  currentUser: UserProfile | null;
  // Auth functions
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginSimple: (name: string) => void; // For backward compatibility
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  // Posts / Feed
  posts: Post[];
  feed: Post[];
  loadingFeed: boolean;
  createPost: (text: string | null, imageUris: string[], videoUri: string | null, stickerData: StickerData[], location?: { lat: number; lon: number; address?: string }) => Promise<void>;
  loadFeed: () => Promise<void>;
  loadUserPosts: (userId: string) => Promise<Post[]>;
  loadMyPosts: () => Promise<Post[]>;
  // Post interactions
  clapPost: (postHash: string, count: number) => Promise<void>;
  likePost: (postHash: string) => Promise<void>;
  unlikePost: (postHash: string) => Promise<void>;
  commentPost: (postHash: string, text: string, parentCommentHash?: string) => Promise<void>;
  loadPostComments: (postHash: string) => Promise<PostComment[]>;
  reportPost: (postHash: string, reason: string, description?: string) => Promise<void>;
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
  chats: Chat[];
  loadingChats: boolean;
  sendMessage: (receiverId: string, text?: string, imageUri?: string, videoUri?: string) => Promise<void>;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  markMessageRead: (messageHash: string) => Promise<void>;
  getUnreadCount: () => Promise<number>;
  // User blocking
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => Promise<boolean>;
  getBlockedUsers: () => Promise<string[]>;
  blockedUsers: Set<string>;
  // Tamagochi
  tamagochi: Tamagochi | null;
  tamagochiDeaths: TamagochiDeath[];
  loadingTamagochi: boolean;
  createTamagochi: (name: string) => Promise<void>;
  feedTamagochi: () => Promise<void>;
  cleanTamagochi: () => Promise<void>;
  playWithTamagochi: () => Promise<void>;
  killTamagochi: () => Promise<void>;
  updateTamagochiState: () => Promise<void>;
  loadTamagochiDeaths: () => Promise<void>;
  loadTamagochi: () => Promise<void>;
  tamagochiEnabled: boolean;
  setTamagochiEnabled: (enabled: boolean) => void;
  // Ghost mode
  ghostMode: boolean;
  setGhostMode: (enabled: boolean) => Promise<void>;
  updateLastSeen: () => Promise<void>;
  // Friends
  friends: Set<string>;
  addFriend: (userId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  isFriend: (userId: string) => Promise<boolean>;
  loadFriends: () => Promise<void>;
  // User preferences
  appColor: string;
  tamagochiEnabled: boolean;
  locationSharingEnabled: boolean;
  setAppColor: (color: string) => Promise<void>;
  setTamagochiEnabled: (enabled: boolean) => Promise<void>;
  setLocationSharingEnabled: (enabled: boolean) => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  // Location
  getUserLocation: (userId: string) => Promise<{ lat: number; lon: number } | null>;
  // Products
  createProduct: (title: string, description: string, price: number, currency: string, imageUris: string[], lat?: number, lon?: number) => Promise<void>;
  commentOnProduct: (productId: string, text: string, parentCommentHash?: string) => Promise<void>;
  getProductComments: (productId: string) => Promise<any[]>;
  // Ad Banners
  activeBanner: any | null;
  loadActiveBanner: () => Promise<void>;
  recordBannerImpression: (bannerHash: string) => Promise<void>;
  recordBannerClick: (bannerHash: string) => Promise<void>;
  // Wishes
  wishes: Wish[];
  loadingWishes: boolean;
  createWish: (text: string, imageUri?: string, videoUri?: string) => Promise<void>;
  loadWishes: () => Promise<void>;
  loadUserWishes: (userId: string) => Promise<Wish[]>;
  helpWish: (wishId: string, message?: string) => Promise<void>;
  getWishHelpers: (wishId: string) => Promise<WishHelp[]>;
  markWishFulfilled: (wishId: string) => Promise<void>;
  // Driver
  isDriver: boolean;
  driverStatus: 'available' | 'busy' | 'offline' | null;
  vehicleInfo: VehicleInfo | null;
  availableDrivers: Array<{ driverId: string; lat: number; lon: number; status?: string }>;
  registerAsDriver: (vehicleInfo: VehicleInfo, pricePerKm?: number, basePrice?: number, currency?: string) => Promise<void>;
  updateDriverStatus: (status: 'available' | 'busy' | 'offline', lat?: number, lon?: number) => Promise<void>;
  updateDriverPricing: (pricePerKm?: number, basePrice?: number, currency?: string) => Promise<void>;
  loadAvailableDrivers: () => Promise<void>;
  loadAllDrivers: () => Promise<void>;
  // Ride quoting
  quoteRide: (pickupLat: number, pickupLon: number, dropoffLat: number, dropoffLon: number) => Promise<Array<{
    driverId: string;
    driverName: string;
    distanceKm: number;
    estimatedPrice: number;
    currency: string;
    vehicleInfo?: any;
    estimatedDurationMinutes?: number;
  }>>;
};

export type Tamagochi = {
  name: string;
  stage: 'egg' | 'baby' | 'child' | 'teen' | 'adult';
  energy: number;
  hunger: number;
  hygiene: number;
  happiness: number;
  experience: number;
  level: number;
  bornAt: number;
  lastFedAt: number;
  lastCleanedAt: number;
  lastPlayedAt: number;
  isAlive: boolean;
};

export type TamagochiDeath = {
  tamagochiName: string;
  deathReason: string;
  diedAt: number;
  ageSeconds: number;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  posts: [],
  feed: [],
  loadingFeed: false,
  
  register: async (email: string, password: string, name: string) => {
    try {
      const agentId = await holochainClient.registerUser(email, password, name);
      const user = await holochainClient.getUserProfile();
      if (user) {
        set({
          currentUser: {
            id: agentId,
            email: user.email,
            name: user.name,
            rut: user.rut,
            isVerified: user.is_verified,
            profileImageHash: user.profile_image_hash,
            idCardImageHash: user.id_card_image_hash,
            lat: user.lat,
            lon: user.lon,
          },
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      const agentId = await holochainClient.login(email, password);
      const user = await holochainClient.getUserProfile();
      if (user) {
        set({
          currentUser: {
            id: agentId,
            email: user.email,
            name: user.name,
            rut: user.rut,
            isVerified: user.is_verified,
            profileImageHash: user.profile_image_hash,
            idCardImageHash: user.id_card_image_hash,
            lat: user.lat,
            lon: user.lon,
          },
        });
        // Load feed after login
        get().loadFeed();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  loginSimple: (name: string) =>
    set({
      currentUser: {
        id: 'me',
        name,
        isVerified: false,
      },
    }),
  
  logout: () => set({ currentUser: null, feed: [], posts: [] }),
  
  requestPasswordReset: async (email: string) => {
    try {
      const token = await holochainClient.requestPasswordReset(email);
      return token;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },
  
  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      await holochainClient.resetPassword(email, token, newPassword);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },
  
  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser) return;
      
      const holochainUpdates: any = {};
      if (updates.name) holochainUpdates.name = updates.name;
      if (updates.rut) holochainUpdates.rut = updates.rut;
      if (updates.lat !== undefined) holochainUpdates.lat = updates.lat;
      if (updates.lon !== undefined) holochainUpdates.lon = updates.lon;
      
      const updatedUser = await holochainClient.updateUserProfile(holochainUpdates);
      
    set((s) => {
      if (s.currentUser) {
          return {
            currentUser: {
              ...s.currentUser,
              ...updates,
              name: updatedUser.name,
              rut: updatedUser.rut,
              lat: updatedUser.lat,
              lon: updatedUser.lon,
            },
          };
      }
      return s;
      });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  createPost: async (text: string | null, imageUris: string[], videoUri: string | null, stickerData: StickerData[], location?: { lat: number; lon: number; address?: string }) => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser) throw new Error('Not logged in');
      
      // Upload images to Holochain
      const imageHashes: string[] = [];
      for (const uri of imageUris) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        const hash = await holochainClient.uploadImage(bytes, blob.type);
        imageHashes.push(hash);
      }
      
      // Upload video if present
      let videoHash: string | null = null;
      if (videoUri) {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        videoHash = await holochainClient.uploadImage(bytes, blob.type); // Reuse uploadImage for videos
      }
      
      // Convert sticker data format
      const holochainStickers = stickerData.map(s => ({
        sticker_type: s.stickerType,
        content: s.content,
        x: s.x,
        y: s.y,
        scale: s.scale,
        rotation: s.rotation,
      }));
      
      await holochainClient.createPost(text, imageHashes, videoHash, holochainStickers, location);
      
      // Reload feed
      await get().loadFeed();
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },
  
  loadFeed: async () => {
    try {
      set({ loadingFeed: true });
      const posts = await holochainClient.getFeed(50);
      
      // Convert Holochain posts to app posts
      const appPosts: Post[] = await Promise.all(
        posts.map(async (post: HolochainPost) => {
          // Load images
          const imageUris: string[] = [];
          for (const hash of post.image_hashes) {
            try {
              const image = await holochainClient.getImage(hash);
              if (image) {
                const blob = new Blob([image.bytes], { type: image.mime_type });
                const uri = URL.createObjectURL(blob);
                imageUris.push(uri);
              }
            } catch (error) {
              console.error('Error loading image:', error);
            }
          }
          
          // Get author profile for name and verification status
          let authorName: string | undefined;
          let authorIsVerified = false;
          try {
            const authorProfile = await holochainClient.getUserProfile(post.author_id);
            if (authorProfile) {
              authorName = authorProfile.name;
              authorIsVerified = authorProfile.is_verified;
            }
          } catch (error) {
            console.error('Error loading author profile:', error);
          }
          
          return {
            id: post.author_id + '_' + post.created_at,
            hash: post.hash,
            authorId: post.author_id,
            authorName: authorName || 'Usuario',
            text: post.text || undefined,
            imageHashes: post.image_hashes,
            imageUris,
            createdAt: post.created_at,
            location: post.location,
            authorIsVerified,
          };
        })
      );
      
      set({ feed: appPosts, loadingFeed: false });
    } catch (error) {
      console.error('Load feed error:', error);
      set({ loadingFeed: false });
    }
  },
  
  loadUserPosts: async (userId: string) => {
    try {
      const posts = await holochainClient.getUserPosts(userId, 50);
      // Convert similar to loadFeed
      return posts.map((post: HolochainPost) => ({
        id: post.author_id + '_' + post.created_at,
        authorId: post.author_id,
        text: post.text || undefined,
        imageHashes: post.image_hashes,
        imageUris: [],
        createdAt: post.created_at,
        location: post.location,
      }));
    } catch (error) {
      console.error('Load user posts error:', error);
      return [];
    }
  },
  
  loadMyPosts: async () => {
    try {
      const posts = await holochainClient.getMyPosts(50);
      set({ posts: posts.map((post: HolochainPost) => ({
        id: post.author_id + '_' + post.created_at,
        authorId: post.author_id,
        text: post.text || undefined,
        imageHashes: post.image_hashes,
        imageUris: [],
        videoHash: post.video_hash || undefined,
        stickerData: post.sticker_data?.map((s: any) => ({
          stickerType: s.sticker_type,
          content: s.content,
          x: s.x,
          y: s.y,
          scale: s.scale,
          rotation: s.rotation,
        })),
        createdAt: post.created_at,
        location: post.location,
      })) });
    } catch (error) {
      console.error('Load my posts error:', error);
    }
  },
  
  clapPost: async (postHash: string, count: number) => {
    try {
      await holochainClient.clapPost(postHash, count);
      // Reload feed to update clap count
      await get().loadFeed();
    } catch (error) {
      console.error('Clap post error:', error);
      throw error;
    }
  },
  
  likePost: async (postHash: string) => {
    try {
      await holochainClient.likePost(postHash);
      // Reload feed to update like count
      await get().loadFeed();
    } catch (error) {
      console.error('Like post error:', error);
      throw error;
    }
  },
  
  unlikePost: async (postHash: string) => {
    try {
      await holochainClient.unlikePost(postHash);
      // Reload feed to update like count
      await get().loadFeed();
    } catch (error) {
      console.error('Unlike post error:', error);
      throw error;
    }
  },
  
  commentPost: async (postHash: string, text: string, parentCommentHash?: string) => {
    try {
      await holochainClient.commentPost(postHash, text, parentCommentHash);
      // Reload feed to show new comment
      await get().loadFeed();
    } catch (error) {
      console.error('Comment post error:', error);
      throw error;
    }
  },
  
  loadPostComments: async (postHash: string) => {
    try {
      const comments = await holochainClient.getPostComments(postHash);
      
      // Convert and load user profiles for each comment
      const appComments: PostComment[] = await Promise.all(
        comments.map(async (comment: any) => {
          // Get author profile
          let authorName = 'Usuario';
          let authorIsVerified = false;
          try {
            const authorProfile = await holochainClient.getUserProfile(comment.author_id);
            if (authorProfile) {
              authorName = authorProfile.name;
              authorIsVerified = authorProfile.is_verified;
            }
          } catch (error) {
            console.error('Error loading comment author profile:', error);
          }
          
          // Get replies if any
          let replies: PostComment[] = [];
          if (comment.replies) {
            replies = await Promise.all(
              comment.replies.map(async (reply: any) => {
                let replyAuthorName = 'Usuario';
                let replyAuthorIsVerified = false;
                try {
                  const replyAuthorProfile = await holochainClient.getUserProfile(reply.author_id);
                  if (replyAuthorProfile) {
                    replyAuthorName = replyAuthorProfile.name;
                    replyAuthorIsVerified = replyAuthorProfile.is_verified;
                  }
                } catch (error) {
                  console.error('Error loading reply author profile:', error);
                }
                
                return {
                  id: reply.author_id + '_' + reply.created_at,
                  hash: reply.hash,
                  authorId: reply.author_id,
                  authorName: replyAuthorName,
                  authorIsVerified: replyAuthorIsVerified,
                  text: reply.text,
                  createdAt: reply.created_at,
                  parentCommentHash: reply.parent_comment_hash,
                };
              })
            );
          }
          
          return {
            id: comment.author_id + '_' + comment.created_at,
            hash: comment.hash,
            authorId: comment.author_id,
            authorName,
            authorIsVerified,
            text: comment.text,
            createdAt: comment.created_at,
            parentCommentHash: comment.parent_comment_hash,
            replies,
          };
        })
      );
      
      return appComments;
    } catch (error) {
      console.error('Load post comments error:', error);
      return [];
    }
  },
  
  reportPost: async (postHash: string, reason: string, description?: string) => {
    try {
      await holochainClient.reportPost(postHash, reason, description);
    } catch (error) {
      console.error('Report post error:', error);
      throw error;
    }
  },
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
  chats: [],
  loadingChats: false,
  
  sendMessage: async (receiverId: string, text?: string, imageUri?: string, videoUri?: string) => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser) throw new Error('Not logged in');
      
      // Check if user is blocked
      const isBlocked = await get().isUserBlocked(receiverId);
      if (isBlocked) {
        throw new Error('No puedes enviar mensajes a este usuario (está bloqueado)');
      }
      
      let imageHash: string | undefined;
      let videoHash: string | undefined;
      let encryptedText: string | undefined;
      
      // Encrypt text message if present
      if (text) {
        try {
          const { MessageEncryption } = await import('./encryption');
          const chatId = formatChatId(currentUser.id, receiverId);
          const sharedKey = await MessageEncryption.generateSharedKey(chatId);
          encryptedText = await MessageEncryption.encryptMessage(text, sharedKey);
        } catch (encError) {
          console.error('Encryption error, sending unencrypted:', encError);
          // Fallback to unencrypted if encryption fails
        }
      }
      
      // Upload image if present
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        imageHash = await holochainClient.uploadImage(bytes, blob.type);
      }
      
      // Upload video if present
      if (videoUri) {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        videoHash = await holochainClient.uploadImage(bytes, blob.type); // Reuse for videos
      }
      
      await holochainClient.sendMessage(receiverId, encryptedText || text, imageHash, videoHash);
      
      // Reload messages for this chat
      const chatId = formatChatId(currentUser.id, receiverId);
      await get().loadMessages(chatId);
      
      // Reload chats to update last message
      await get().loadChats();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },
  
  loadChats: async () => {
    try {
      set({ loadingChats: true });
      const chatUserIds = await holochainClient.getChats();
      const friends = get().friends;
      
      const chats: Chat[] = await Promise.all(
        chatUserIds.map(async (userId: string) => {
          const chatId = formatChatId(get().currentUser?.id || '', userId);
          const messages = await holochainClient.getMessages(chatId);
          
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          
          // Count unread
          const unreadCount = messages.filter((m: any) => 
            m.receiver_id === get().currentUser?.id && !m.read
          ).length;
          
          // Calculate total characters exchanged
          let totalCharacters = 0;
          for (const msg of messages) {
            if (msg.text) {
              // Try to decrypt if encrypted, otherwise use as is
              let text = msg.text;
              if (text.startsWith('encrypted:')) {
                try {
                  const { MessageEncryption } = await import('./encryption');
                  const sharedKey = await MessageEncryption.generateSharedKey(chatId);
                  text = await MessageEncryption.decryptMessage(text.replace('encrypted:', ''), sharedKey);
                } catch (e) {
                  // If decryption fails, skip this message
                  continue;
                }
              }
              totalCharacters += text.length;
            }
          }
          
          // Get user profile for name
          let userName = 'Usuario';
          try {
            const userProfile = await holochainClient.getUserProfile(userId);
            if (userProfile) {
              userName = userProfile.name;
            }
          } catch (error) {
            console.error('Error loading user profile for chat:', error);
          }
          
          return {
            userId,
            userName,
            lastMessage: lastMessage ? convertHolochainMessage(lastMessage) : undefined,
            unreadCount,
            totalCharacters,
            isFriend: friends.has(userId),
          };
        })
      );
      
      // Sort by total characters (most chatted first), then by last message timestamp
      chats.sort((a, b) => {
        // First sort by total characters (descending)
        const charDiff = (b.totalCharacters || 0) - (a.totalCharacters || 0);
        if (charDiff !== 0) return charDiff;
        
        // Then by last message timestamp
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.timestamp - a.lastMessage.timestamp;
      });
      
      set({ chats, loadingChats: false });
    } catch (error) {
      console.error('Load chats error:', error);
      set({ loadingChats: false });
    }
  },
  
  loadMessages: async (chatId: string) => {
    try {
      const messages = await holochainClient.getMessages(chatId);
      
      // Convert and load images/videos
      const appMessages: Message[] = await Promise.all(
        messages.map(async (msg: any) => {
          let imageUri: string | undefined;
          let videoUri: string | undefined;
          
          if (msg.image_hash) {
            try {
              const image = await holochainClient.getImage(msg.image_hash);
              if (image) {
                const blob = new Blob([image.bytes], { type: image.mime_type });
                imageUri = URL.createObjectURL(blob);
              }
            } catch (error) {
              console.error('Error loading message image:', error);
            }
          }
          
          if (msg.video_hash) {
            try {
              const video = await holochainClient.getImage(msg.video_hash); // Reuse for videos
              if (video) {
                const blob = new Blob([video.bytes], { type: video.mime_type });
                videoUri = URL.createObjectURL(blob);
              }
            } catch (error) {
              console.error('Error loading message video:', error);
            }
          }
          
          // Decrypt text if encrypted
          let decryptedText = msg.text || undefined;
          if (decryptedText && currentUser) {
            try {
              const { MessageEncryption } = await import('./encryption');
              const chatId = msg.chat_id;
              const sharedKey = await MessageEncryption.generateSharedKey(chatId);
              // Try to decrypt (if it's encrypted)
              if (decryptedText.startsWith('encrypted:')) {
                const encryptedData = decryptedText.replace('encrypted:', '');
                decryptedText = await MessageEncryption.decryptMessage(encryptedData, sharedKey);
              }
            } catch (decError) {
              // If decryption fails, use original text
              console.error('Decryption error:', decError);
            }
          }
          
          return {
            id: msg.chat_id + '_' + msg.timestamp,
            hash: msg.hash,
            chatId: msg.chat_id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            text: decryptedText,
            imageHash: msg.image_hash || undefined,
      imageUri,
            videoHash: msg.video_hash || undefined,
            videoUri,
            type: msg.video_hash ? 'video' : msg.image_hash ? 'image' : 'text',
            timestamp: msg.timestamp,
            read: msg.read || false,
          };
        })
      );
      
      set((s) => ({
      messages: {
          ...s.messages,
          [chatId]: appMessages,
        },
      }));
    } catch (error) {
      console.error('Load messages error:', error);
    }
  },
  
  markMessageRead: async (messageHash: string) => {
    try {
      await holochainClient.markMessageRead(messageHash);
      // Update local state
      set((s) => {
        const updatedMessages = { ...s.messages };
        for (const chatId in updatedMessages) {
          updatedMessages[chatId] = updatedMessages[chatId].map(msg =>
            msg.hash === messageHash ? { ...msg, read: true } : msg
          );
        }
        return { messages: updatedMessages };
      });
    } catch (error) {
      console.error('Mark message read error:', error);
    }
  },
  
  getUnreadCount: async () => {
    try {
      return await holochainClient.getUnreadCount();
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  },
  
  blockedUsers: new Set(),
  
  blockUser: async (userId: string) => {
    try {
      await holochainClient.blockUser(userId);
      set((s) => {
        const updated = new Set(s.blockedUsers);
        updated.add(userId);
        return { blockedUsers: updated };
      });
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  },
  
  unblockUser: async (userId: string) => {
    try {
      await holochainClient.unblockUser(userId);
      set((s) => {
        const updated = new Set(s.blockedUsers);
        updated.delete(userId);
        return { blockedUsers: updated };
      });
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  },
  
  isUserBlocked: async (userId: string) => {
    try {
      return await holochainClient.isUserBlocked(userId);
    } catch (error) {
      console.error('Is user blocked error:', error);
      return false;
    }
  },
  
  getBlockedUsers: async () => {
    try {
      const blocked = await holochainClient.getBlockedUsers();
      set({ blockedUsers: new Set(blocked) });
      return blocked;
    } catch (error) {
      console.error('Get blocked users error:', error);
      return [];
    }
  },
  
  tamagochi: null,
  tamagochiDeaths: [],
  loadingTamagochi: false,
  
  createTamagochi: async (name: string) => {
    try {
      await holochainClient.createTamagochi(name);
      const created = await holochainClient.getTamagochi();
      if (created) {
        set({ tamagochi: convertTamagochi(created) });
      }
    } catch (error) {
      console.error('Create tamagochi error:', error);
      throw error;
    }
  },
  
  feedTamagochi: async () => {
    try {
      const updated = await holochainClient.feedTamagochi();
      set({ tamagochi: convertTamagochi(updated) });
    } catch (error) {
      console.error('Feed tamagochi error:', error);
      throw error;
    }
  },
  
  cleanTamagochi: async () => {
    try {
      const updated = await holochainClient.cleanTamagochi();
      set({ tamagochi: convertTamagochi(updated) });
    } catch (error) {
      console.error('Clean tamagochi error:', error);
      throw error;
    }
  },
  
  playWithTamagochi: async () => {
    try {
      const updated = await holochainClient.playWithTamagochi();
      set({ tamagochi: convertTamagochi(updated) });
    } catch (error) {
      console.error('Play with tamagochi error:', error);
      throw error;
    }
  },
  
  killTamagochi: async () => {
    try {
      await holochainClient.killTamagochi();
      set({ tamagochi: null });
      await get().loadTamagochiDeaths();
    } catch (error) {
      console.error('Kill tamagochi error:', error);
      throw error;
    }
  },
  
  updateTamagochiState: async () => {
    try {
      set({ loadingTamagochi: true });
      
      // First auto-grow (happens on each app entry) - only if tamagochi exists
      const currentTamagochi = get().tamagochi;
      if (currentTamagochi && currentTamagochi.isAlive) {
        try {
          const grown = await holochainClient.autoGrowTamagochi();
          if (grown) {
            const converted = convertTamagochi(grown);
            set({ tamagochi: converted });
          }
        } catch (error) {
          // If auto-grow fails, continue with update
          console.error('Auto-grow error:', error);
        }
      }
      
      // Then update state (decrease stats over time)
      const updated = await holochainClient.updateTamagochiState();
      if (updated) {
        set({ tamagochi: convertTamagochi(updated), loadingTamagochi: false });
      } else {
        set({ tamagochi: null, loadingTamagochi: false });
      }
    } catch (error) {
      console.error('Update tamagochi state error:', error);
      set({ loadingTamagochi: false });
    }
  },
  
  loadTamagochiDeaths: async () => {
    try {
      const deaths = await holochainClient.getTamagochiDeaths();
      set({ tamagochiDeaths: deaths.map(convertDeath) });
    } catch (error) {
      console.error('Load tamagochi deaths error:', error);
    }
  },
  
  loadTamagochi: async () => {
    try {
      const tamagochi = await holochainClient.getTamagochi();
      if (tamagochi) {
        set({ tamagochi: convertTamagochi(tamagochi) });
      } else {
        set({ tamagochi: null });
      }
    } catch (error) {
      console.error('Load tamagochi error:', error);
      set({ tamagochi: null });
    }
  },
  
  // tamagochiEnabled is now managed by setTamagochiEnabled in preferences
  
  ghostMode: false,
  setGhostMode: async (enabled: boolean) => {
    try {
      const updatedUser = await holochainClient.setGhostMode(enabled);
      set((s) => {
        if (s.currentUser) {
          return {
            ghostMode: enabled,
            currentUser: {
              ...s.currentUser,
              ghostMode: updatedUser.ghost_mode,
              lastSeen: updatedUser.last_seen,
            },
          };
        }
        return { ghostMode: enabled };
      });
    } catch (error) {
      console.error('Set ghost mode error:', error);
      throw error;
    }
  },
  
  updateLastSeen: async () => {
    try {
      await holochainClient.updateLastSeen();
    } catch (error) {
      console.error('Update last seen error:', error);
    }
  },
  
  // Friends
  friends: new Set<string>(),
  
  addFriend: async (userId: string) => {
    try {
      await holochainClient.addFriend(userId);
      set((s) => {
        const updated = new Set(s.friends);
        updated.add(userId);
        return { friends: updated };
      });
    } catch (error) {
      console.error('Add friend error:', error);
      throw error;
    }
  },
  
  removeFriend: async (userId: string) => {
    try {
      await holochainClient.removeFriend(userId);
      set((s) => {
        const updated = new Set(s.friends);
        updated.delete(userId);
        return { friends: updated };
      });
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  },
  
  isFriend: async (userId: string) => {
    try {
      return await holochainClient.isFriend(userId);
    } catch (error) {
      console.error('Is friend error:', error);
      return false;
    }
  },
  
  loadFriends: async () => {
    try {
      const friendIds = await holochainClient.getFriends();
      set({ friends: new Set(friendIds) });
    } catch (error) {
      console.error('Load friends error:', error);
    }
  },
  
  // User preferences
  appColor: '#1f7aec',
  tamagochiEnabled: true,
  locationSharingEnabled: false,
  
  setAppColor: async (color: string) => {
    try {
      await holochainClient.updateUserPreferences({ app_color: color });
      set({ appColor: color });
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('appColor', color);
      }
    } catch (error) {
      console.error('Set app color error:', error);
      throw error;
    }
  },
  
  setTamagochiEnabled: async (enabled: boolean) => {
    try {
      await holochainClient.updateUserPreferences({ tamagochi_enabled: enabled });
      set({ tamagochiEnabled: enabled });
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tamagochiEnabled', String(enabled));
      }
    } catch (error) {
      console.error('Set tamagochi enabled error:', error);
      throw error;
    }
  },
  
  setLocationSharingEnabled: async (enabled: boolean) => {
    try {
      await holochainClient.updateUserPreferences({ location_sharing_enabled: enabled });
      set({ locationSharingEnabled: enabled });
    } catch (error) {
      console.error('Set location sharing error:', error);
      throw error;
    }
  },
  
  loadUserPreferences: async () => {
    try {
      const prefs = await holochainClient.getUserPreferences();
      if (prefs) {
        set({
          appColor: prefs.app_color || '#1f7aec',
          tamagochiEnabled: prefs.tamagochi_enabled !== false,
          locationSharingEnabled: prefs.location_sharing_enabled || false,
        });
      }
    } catch (error) {
      console.error('Load user preferences error:', error);
    }
  },
  
  // Location
  getUserLocation: async (userId: string) => {
    try {
      const location = await holochainClient.getUserLocation(userId);
      return location;
    } catch (error) {
      console.error('Get user location error:', error);
      return null;
    }
  },
  
  // Products
  createProduct: async (title: string, description: string, price: number, currency: string, imageUris: string[], lat?: number, lon?: number) => {
    try {
      // Upload images to Holochain
      const imageHashes: string[] = [];
      for (const uri of imageUris) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        const hash = await holochainClient.uploadImage(bytes, blob.type);
        imageHashes.push(hash);
      }
      
      await holochainClient.createProduct({
        title,
        description,
        price,
        currency,
        image_hashes: imageHashes,
        lat: lat || null,
        lon: lon || null,
      });
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },
  
  commentOnProduct: async (productId: string, text: string, parentCommentHash?: string) => {
    try {
      await holochainClient.commentOnProduct(productId, text, parentCommentHash);
    } catch (error) {
      console.error('Comment on product error:', error);
      throw error;
    }
  },
  
  getProductComments: async (productId: string) => {
    try {
      return await holochainClient.getProductComments(productId);
    } catch (error) {
      console.error('Get product comments error:', error);
      return [];
    }
  },
  
  // Ad Banners
  activeBanner: null,
  
  loadActiveBanner: async () => {
    try {
      const banners = await holochainClient.getActiveBanners();
      if (banners && banners.length > 0) {
        set({ activeBanner: banners[0] });
        // Record impression
        if (banners[0].hash) {
          get().recordBannerImpression(banners[0].hash);
        }
      }
    } catch (error) {
      console.error('Load active banner error:', error);
    }
  },
  
  recordBannerImpression: async (bannerHash: string) => {
    try {
      await holochainClient.recordBannerImpression(bannerHash);
    } catch (error) {
      console.error('Record banner impression error:', error);
    }
  },
  
  recordBannerClick: async (bannerHash: string) => {
    try {
      await holochainClient.recordBannerClick(bannerHash);
    } catch (error) {
      console.error('Record banner click error:', error);
    }
  },
  
  // Wishes
  wishes: [],
  loadingWishes: false,
  
  createWish: async (text: string, imageUri?: string, videoUri?: string) => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser) throw new Error('Not logged in');
      
      let imageHash: string | undefined;
      let videoHash: string | undefined;
      
      // Upload image if present
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        imageHash = await holochainClient.uploadImage(bytes, blob.type);
      }
      
      // Upload video if present
      if (videoUri) {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        videoHash = await holochainClient.uploadImage(bytes, blob.type); // Reuse for videos
      }
      
      await holochainClient.createWish(text, imageHash, videoHash);
      
      // Reload wishes
      await get().loadWishes();
    } catch (error) {
      console.error('Create wish error:', error);
      throw error;
    }
  },
  
  loadWishes: async () => {
    try {
      set({ loadingWishes: true });
      const wishes = await holochainClient.getWishes();
      
      // Convert and load images/videos
      const appWishes: Wish[] = await Promise.all(
        wishes.map(async (wish: any) => {
          let imageUri: string | undefined;
          let videoUri: string | undefined;
          
          if (wish.image_hash) {
            try {
              const image = await holochainClient.getImage(wish.image_hash);
              if (image) {
                const blob = new Blob([image.bytes], { type: image.mime_type });
                imageUri = URL.createObjectURL(blob);
              }
            } catch (error) {
              console.error('Error loading wish image:', error);
            }
          }
          
          if (wish.video_hash) {
            try {
              const video = await holochainClient.getImage(wish.video_hash);
              if (video) {
                const blob = new Blob([video.bytes], { type: video.mime_type });
                videoUri = URL.createObjectURL(blob);
              }
            } catch (error) {
              console.error('Error loading wish video:', error);
            }
          }
          
          return {
            id: wish.author_id + '_' + wish.created_at,
            hash: wish.hash,
            authorId: wish.author_id,
            text: wish.text,
            imageHash: wish.image_hash || undefined,
            imageUri,
            videoHash: wish.video_hash || undefined,
            videoUri,
            fulfilled: wish.fulfilled || false,
            createdAt: wish.created_at,
          };
        })
      );
      
      set({ wishes: appWishes, loadingWishes: false });
    } catch (error) {
      console.error('Load wishes error:', error);
      set({ loadingWishes: false });
    }
  },
  
  loadUserWishes: async (userId: string) => {
    try {
      const wishes = await holochainClient.getUserWishes(userId);
      // Convert similar to loadWishes
      return wishes.map((wish: any) => ({
        id: wish.author_id + '_' + wish.created_at,
        hash: wish.hash,
        authorId: wish.author_id,
        text: wish.text,
        imageHash: wish.image_hash || undefined,
        videoHash: wish.video_hash || undefined,
        fulfilled: wish.fulfilled || false,
        createdAt: wish.created_at,
      }));
    } catch (error) {
      console.error('Load user wishes error:', error);
      return [];
    }
  },
  
  helpWish: async (wishId: string, message?: string) => {
    try {
      await holochainClient.helpWish(wishId, message);
      // Reload wishes to update helpers
      await get().loadWishes();
    } catch (error) {
      console.error('Help wish error:', error);
      throw error;
    }
  },
  
  getWishHelpers: async (wishId: string) => {
    try {
      const helpers = await holochainClient.getWishHelpers(wishId);
      return helpers.map((h: any) => ({
        id: h.helper_id + '_' + h.created_at,
        hash: h.hash,
        wishId: h.wish_id,
        helperId: h.helper_id,
        message: h.message || undefined,
        status: h.status,
        createdAt: h.created_at,
      }));
    } catch (error) {
      console.error('Get wish helpers error:', error);
      return [];
    }
  },
  
  markWishFulfilled: async (wishId: string) => {
    try {
      await holochainClient.markWishFulfilled(wishId);
      await get().loadWishes();
    } catch (error) {
      console.error('Mark wish fulfilled error:', error);
      throw error;
    }
  },
  
  // Tamagochi Visits
  visitTamagochi: async (ownerId: string, message?: string) => {
    try {
      await holochainClient.visitTamagochi(ownerId, message);
    } catch (error) {
      console.error('Visit tamagochi error:', error);
      throw error;
    }
  },
  
  getTamagochiVisits: async (ownerId: string) => {
    try {
      return await holochainClient.getTamagochiVisits(ownerId);
    } catch (error) {
      console.error('Get tamagochi visits error:', error);
      return [];
    }
  },
  
  // Profile Cover
  setProfileCover: async (coverType: 'tamagochi' | 'image' | 'video', imageUri?: string, videoUri?: string) => {
    try {
      let imageHash: string | undefined;
      let videoHash: string | undefined;
      
      if (imageUri && coverType === 'image') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        imageHash = await holochainClient.uploadImage(bytes, blob.type);
      }
      
      if (videoUri && coverType === 'video') {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        videoHash = await holochainClient.uploadImage(bytes, blob.type);
      }
      
      await holochainClient.setProfileCover(coverType, imageHash, videoHash);
    } catch (error) {
      console.error('Set profile cover error:', error);
      throw error;
    }
  },
  
  getProfileCover: async (userId: string) => {
    try {
      return await holochainClient.getProfileCover(userId);
    } catch (error) {
      console.error('Get profile cover error:', error);
      return null;
    }
  },
  
  // Driver functions
  isDriver: false,
  driverStatus: null,
  vehicleInfo: null,
  availableDrivers: [],
  
  registerDriver: async (vehicleInfo: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    licensePlate?: string;
    capacity: number;
    pricePerKm: number;
    basePrice?: number;
    currency: string;
  }) => {
    try {
      await holochainClient.registerAsDriver(
        {
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          year: vehicleInfo.year,
          color: vehicleInfo.color,
          licensePlate: vehicleInfo.licensePlate,
          capacity: vehicleInfo.capacity,
        },
        vehicleInfo.pricePerKm,
        vehicleInfo.basePrice,
        vehicleInfo.currency
      );
      set({ isDriver: true });
    } catch (error) {
      console.error('Register driver error:', error);
      throw error;
    }
  },
  
  getDriverInfo: async () => {
    try {
      const info = await holochainClient.getDriverInfo();
      if (info) {
        set({
          isDriver: true,
          driverStatus: info.status || null,
          vehicleInfo: info.vehicle_info || null,
        });
        return info;
      }
      return null;
    } catch (error) {
      console.error('Get driver info error:', error);
      return null;
    }
  },
  
  getAvailableDrivers: async () => {
    try {
      const drivers = await holochainClient.getAvailableDrivers();
      // Get full driver info for each
      const driversWithInfo = await Promise.all(
        drivers.map(async (d: any) => {
          try {
            const user = await holochainClient.getUserProfile(d.driver_id);
            return {
              driverId: d.driver_id,
              driverName: user?.name || 'Conductor',
              lat: d.lat,
              lon: d.lon,
              status: d.status,
              vehicleInfo: d.vehicle_info,
            };
          } catch (error) {
            return {
              driverId: d.driver_id,
              driverName: 'Conductor',
              lat: d.lat,
              lon: d.lon,
              status: d.status,
            };
          }
        })
      );
      set({ availableDrivers: driversWithInfo });
      return driversWithInfo;
    } catch (error) {
      console.error('Get available drivers error:', error);
      return [];
    }
  },
  
  updateDriverStatus: async (status: 'available' | 'busy' | 'offline', lat?: number, lon?: number) => {
    try {
      await holochainClient.updateDriverStatus(status, lat, lon);
      set({ driverStatus: status });
    } catch (error) {
      console.error('Update driver status error:', error);
      throw error;
    }
  },
  
  quoteRide: async (pickupLat: number, pickupLon: number, dropoffLat: number, dropoffLon: number) => {
    try {
      return await holochainClient.quoteRide(pickupLat, pickupLon, dropoffLat, dropoffLon);
    } catch (error) {
      console.error('Quote ride error:', error);
      throw error;
    }
  },
  
  // Tamagochi Visits
  visitTamagochi: async (ownerId: string, message?: string) => {
    try {
      await holochainClient.visitTamagochi(ownerId, message);
    } catch (error) {
      console.error('Visit tamagochi error:', error);
      throw error;
    }
  },
  
  getTamagochiVisits: async (ownerId: string) => {
    try {
      return await holochainClient.getTamagochiVisits(ownerId);
    } catch (error) {
      console.error('Get tamagochi visits error:', error);
      return [];
    }
  },
  
  // Profile Cover
  setProfileCover: async (coverType: 'tamagochi' | 'image' | 'video', imageUri?: string, videoUri?: string) => {
    try {
      let imageHash: string | undefined;
      let videoHash: string | undefined;
      
      if (imageUri && coverType === 'image') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        imageHash = await holochainClient.uploadImage(bytes, blob.type);
      }
      
      if (videoUri && coverType === 'video') {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        videoHash = await holochainClient.uploadImage(bytes, blob.type);
      }
      
      await holochainClient.setProfileCover(coverType, imageHash, videoHash);
    } catch (error) {
      console.error('Set profile cover error:', error);
      throw error;
    }
  },
  
  getProfileCover: async (userId: string) => {
    try {
      return await holochainClient.getProfileCover(userId);
    } catch (error) {
      console.error('Get profile cover error:', error);
      return null;
    }
  },
}));

// Load tamagochi enabled setting on init
if (typeof window !== 'undefined' && window.localStorage) {
  const enabled = window.localStorage.getItem('tamagochiEnabled');
  if (enabled !== null) {
    useAuthStore.setState({ tamagochiEnabled: enabled === 'true' });
  }
}

function convertTamagochi(t: any): Tamagochi {
  return {
    name: t.name,
    stage: t.stage,
    energy: t.energy,
    hunger: t.hunger,
    hygiene: t.hygiene,
    happiness: t.happiness,
    experience: t.experience,
    level: t.level,
    bornAt: t.born_at,
    lastFedAt: t.last_fed_at,
    lastCleanedAt: t.last_cleaned_at,
    lastPlayedAt: t.last_played_at,
    isAlive: t.is_alive,
  };
}

function convertDeath(d: any): TamagochiDeath {
  return {
    tamagochiName: d.tamagochi_name,
    deathReason: d.death_reason,
    diedAt: d.died_at,
    ageSeconds: d.age_seconds,
  };
}

function formatChatId(a: string, b: string): string {
  const ids = [a, b].sort();
  return `chat_${ids[0]}_${ids[1]}`;
}

function convertHolochainMessage(msg: any): Message {
  return {
    id: msg.chat_id + '_' + msg.timestamp,
    hash: msg.hash,
    chatId: msg.chat_id,
    senderId: msg.sender_id,
    receiverId: msg.receiver_id,
    text: msg.text || undefined,
    imageHash: msg.image_hash || undefined,
    videoHash: msg.video_hash || undefined,
    type: msg.video_hash ? 'video' : msg.image_hash ? 'image' : 'text',
    timestamp: msg.timestamp,
    read: msg.read || false,
  };
}

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

export function calculateAge(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getZodiacSign(dateOfBirth: string | undefined): string | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;
  
  const month = birthDate.getMonth() + 1; // 1-12
  const day = birthDate.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈ Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉ Tauro';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊ Géminis';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋ Cáncer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌ Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍ Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎ Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏ Escorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐ Sagitario';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑ Capricornio';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒ Acuario';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '♓ Piscis';
  
  return null;
}
