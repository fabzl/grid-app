// Holochain client for Red Libre mobile app
// This is a simplified client - in production, use @holochain/client

const HOLOCHAIN_CONDUCTOR_URL = process.env.EXPO_PUBLIC_HOLOCHAIN_URL || 'ws://localhost:4444';
const DNA_HASH = process.env.EXPO_PUBLIC_DNA_HASH || '';

export interface HolochainCall {
  zome_name: string;
  fn_name: string;
  payload: any;
}

export interface User {
  email: string;
  password_hash: string;
  name: string;
  rut?: string;
  profile_image_hash?: string;
  id_card_image_hash?: string;
  is_verified: boolean;
  lat?: number;
  lon?: number;
  created_at: number;
}

export interface Post {
  author_id: string;
  text?: string;
  image_hashes: string[];
  created_at: number;
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
}

export interface Product {
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_hashes: string[];
  lat?: number;
  lon?: number;
  created_at: number;
  sold: boolean;
}

export interface Service {
  provider_id: string;
  service_type: string;
  title: string;
  description: string;
  price_per_km?: number;
  base_price?: number;
  price_per_night?: number;
  price_per_hour?: number;
  currency: string;
  image_hashes: string[];
  lat?: number;
  lon?: number;
  available: boolean;
  created_at: number;
  room_capacity?: number;
  amenities: string[];
  professional_category?: string;
}

export interface Image {
  hash: string;
  bytes: Uint8Array;
  mime_type: string;
  created_at: number;
}

class HolochainClient {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(HOLOCHAIN_CONDUCTOR_URL);
        
        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onerror = (error) => {
          this.connected = false;
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.connected = false;
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async call(call: HolochainCall): Promise<any> {
    if (!this.connected || !this.ws) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const requestId = Math.random().toString(36);
      const message = {
        id: requestId,
        type: 'call',
        data: {
          cell_id: [DNA_HASH, ''],
          zome_name: call.zome_name,
          fn_name: call.fn_name,
          payload: call.payload,
        },
      };

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      const handler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.id === requestId) {
            clearTimeout(timeout);
            this.ws?.removeEventListener('message', handler);
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.data);
            }
          }
        } catch (error) {
          // Ignore non-matching messages
        }
      };

      this.ws.addEventListener('message', handler);
      this.ws.send(JSON.stringify(message));
    });
  }

  // User functions
  async registerUser(email: string, password: string, name: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'register_user',
      payload: { email, password, name },
    });
  }

  async login(email: string, password: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'login',
      payload: { email, password },
    });
  }

  async getUserProfile(userId?: string): Promise<User | null> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_user_profile',
      payload: userId || {},
    });
  }

  async updateUserProfile(updates: {
    name?: string;
    rut?: string;
    lat?: number;
    lon?: number;
  }): Promise<User> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'update_user_profile',
      payload: updates,
    });
  }

  async verifyUser(rut: string, idCardImageHash: string): Promise<User> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'verify_user',
      payload: { rut, id_card_image_hash: idCardImageHash },
    });
  }

  async requestPasswordReset(email: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'request_password_reset',
      payload: email,
    });
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'reset_password',
      payload: { email, token, new_password: newPassword },
    });
  }

  // Image functions
  async uploadImage(bytes: Uint8Array, mimeType: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'upload_image',
      payload: {
        bytes: Array.from(bytes),
        mime_type: mimeType,
      },
    });
  }

  async getImage(hash: string): Promise<Image | null> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_image',
      payload: hash,
    });
  }

  async setProfileImage(imageHash: string): Promise<User> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'set_profile_image',
      payload: imageHash,
    });
  }

  // Post functions
  async createPost(
    text: string | null,
    imageHashes: string[],
    videoHash: string | null,
    stickerData: any[],
    location?: { lat: number; lon: number; address?: string }
  ): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'create_post',
      payload: {
        text: text || null,
        image_hashes: imageHashes,
        video_hash: videoHash || null,
        sticker_data: stickerData,
        location: location || null,
      },
    });
  }

  async getFeed(limit?: number): Promise<Post[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_feed',
      payload: limit || null,
    });
  }

  async getUserPosts(userId: string, limit?: number): Promise<Post[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_user_posts',
      payload: { user_id: userId, limit: limit || null },
    });
  }

  async getMyPosts(limit?: number): Promise<Post[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_my_posts',
      payload: limit || null,
    });
  }

  // Product functions
  async createProduct(product: {
    title: string;
    description: string;
    price: number;
    currency: string;
    image_hashes: string[];
    lat?: number;
    lon?: number;
  }): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'create_product',
      payload: product,
    });
  }

  async getProducts(sellerId?: string): Promise<Product[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_products',
      payload: sellerId || null,
    });
  }

  async commentOnProduct(productId: string, text: string, parentCommentHash?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'comment_on_product',
      payload: [productId, text, parentCommentHash || null],
    });
  }

  async getProductComments(productId: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_product_comments',
      payload: productId,
    });
  }

  async getCommentReplies(commentHash: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_comment_replies',
      payload: commentHash,
    });
  }

  // Ad Banner functions
  async getActiveBanners(): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_active_banners',
      payload: {},
    });
  }

  async recordBannerImpression(bannerHash: string): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'record_banner_impression',
      payload: bannerHash,
    });
  }

  async recordBannerClick(bannerHash: string): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'record_banner_click',
      payload: bannerHash,
    });
  }

  // Wish functions
  async createWish(text: string, imageHash?: string, videoHash?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'create_wish',
      payload: {
        text,
        image_hash: imageHash || null,
        video_hash: videoHash || null,
      },
    });
  }

  async getWishes(): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_wishes',
      payload: {},
    });
  }

  async getUserWishes(userId: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_user_wishes',
      payload: userId,
    });
  }

  async helpWish(wishId: string, message?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'help_wish',
      payload: {
        wish_id: wishId,
        message: message || null,
      },
    });
  }

  async getWishHelpers(wishId: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_wish_helpers',
      payload: wishId,
    });
  }

  async markWishFulfilled(wishId: string): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'mark_wish_fulfilled',
      payload: wishId,
    });
  }

  // Tamagochi Visit functions
  async visitTamagochi(ownerId: string, message?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'visit_tamagochi',
      payload: {
        owner_id: ownerId,
        message: message || null,
      },
    });
  }

  async getTamagochiVisits(ownerId: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_tamagochi_visits',
      payload: ownerId,
    });
  }

  // Profile Cover functions
  async setProfileCover(coverType: 'tamagochi' | 'image' | 'video', imageHash?: string, videoHash?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'set_profile_cover',
      payload: {
        cover_type: coverType,
        image_hash: imageHash || null,
        video_hash: videoHash || null,
      },
    });
  }

  async getProfileCover(userId: string): Promise<any | null> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_profile_cover',
      payload: userId,
    });
  }

  async getTamagochiForUser(userId: string): Promise<any | null> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_tamagochi_for_user',
      payload: userId,
    });
  }

  // Service functions
  async createService(service: {
    service_type: string;
    title: string;
    description: string;
    price_per_km?: number;
    base_price?: number;
    price_per_night?: number;
    price_per_hour?: number;
    currency: string;
    image_hashes: string[];
    lat?: number;
    lon?: number;
    room_capacity?: number;
    amenities: string[];
    professional_category?: string;
  }): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'create_service',
      payload: service,
    });
  }

  async getServices(serviceType?: string): Promise<Service[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_services',
      payload: serviceType || null,
    });
  }

  // Message functions
  async sendMessage(receiverId: string, text?: string, imageHash?: string, videoHash?: string, encryptedText?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'send_message',
      payload: {
        receiver_id: receiverId,
        text: encryptedText || text || null,
        image_hash: imageHash || null,
        video_hash: videoHash || null,
        encrypted_text: encryptedText || null,
        encryption_key_id: null, // For future key exchange
      },
    });
  }

  async getMessages(chatId: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_messages',
      payload: chatId,
    });
  }

  async getChats(): Promise<string[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_chats',
      payload: {},
    });
  }

  async markMessageRead(messageHash: string): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'mark_message_read',
      payload: messageHash,
    });
  }

  async getUnreadCount(): Promise<number> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_unread_count',
      payload: {},
    });
  }

  // Post interaction functions
  async clapPost(postHash: string, count: number): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'clap_post',
      payload: { post_hash: postHash, count },
    });
  }

  async getPostClaps(postHash: string): Promise<number> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_post_claps',
      payload: postHash,
    });
  }

  async likePost(postHash: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'like_post',
      payload: postHash,
    });
  }

  async unlikePost(postHash: string): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'unlike_post',
      payload: postHash,
    });
  }

  async getPostLikes(postHash: string): Promise<number> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_post_likes',
      payload: postHash,
    });
  }

  async hasUserLikedPost(postHash: string): Promise<boolean> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'has_user_liked_post',
      payload: postHash,
    });
  }

  async commentPost(postHash: string, text: string, parentCommentHash?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'comment_post',
      payload: {
        post_hash: postHash,
        text,
        parent_comment_hash: parentCommentHash || null,
      },
    });
  }

  async getPostComments(postHash: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_post_comments',
      payload: postHash,
    });
  }

  async getCommentReplies(commentHash: string): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_comment_replies',
      payload: commentHash,
    });
  }

  // Post report functions
  async reportPost(postHash: string, reason: string, description?: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'report_post',
      payload: {
        post_hash: postHash,
        reason,
        description: description || null,
      },
    });
  }

  // User blocking functions
  async blockUser(userId: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'block_user',
      payload: userId,
    });
  }

  async unblockUser(userId: string): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'unblock_user',
      payload: userId,
    });
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'is_user_blocked',
      payload: userId,
    });
  }

  async getBlockedUsers(): Promise<string[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_blocked_users',
      payload: {},
    });
  }

  // Tamagochi functions
  async createTamagochi(name: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'create_tamagochi',
      payload: { name },
    });
  }

  async getTamagochi(): Promise<any | null> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_tamagochi',
      payload: {},
    });
  }

  async feedTamagochi(): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'feed_tamagochi',
      payload: {},
    });
  }

  async cleanTamagochi(): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'clean_tamagochi',
      payload: {},
    });
  }

  async playWithTamagochi(): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'play_with_tamagochi',
      payload: {},
    });
  }

  async killTamagochi(): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'kill_tamagochi',
      payload: {},
    });
  }

  async updateTamagochiState(): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'update_tamagochi_state',
      payload: {},
    });
  }

  async autoGrowTamagochi(): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'auto_grow_tamagochi',
      payload: {},
    });
  }

  async getTamagochiDeaths(): Promise<any[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_tamagochi_deaths',
      payload: {},
    });
  }

  // Ghost mode functions
  async setGhostMode(enabled: boolean): Promise<User> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'set_ghost_mode',
      payload: enabled,
    });
  }

  async updateLastSeen(): Promise<void> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'update_last_seen',
      payload: {},
    });
  }

  // Friends functions
  async addFriend(friendId: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'add_friend',
      payload: friendId,
    });
  }

  async removeFriend(friendId: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'remove_friend',
      payload: friendId,
    });
  }

  async getFriends(): Promise<string[]> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_friends',
      payload: {},
    });
  }

  async isFriend(userId: string): Promise<boolean> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'is_friend',
      payload: userId,
    });
  }

  // User preferences functions
  async getUserPreferences(): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_user_preferences',
      payload: {},
    });
  }

  async updateUserPreferences(preferences: {
    app_color?: string;
    tamagochi_enabled?: boolean;
    location_sharing_enabled?: boolean;
  }): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'update_user_preferences',
      payload: preferences,
    });
  }

  // Location sharing functions
  async getUserLocation(userId: string): Promise<{ lat: number; lon: number } | null> {
    const result = await this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_user_location',
      payload: userId,
    });
    if (result && Array.isArray(result) && result.length === 2) {
      return { lat: result[0], lon: result[1] };
    }
    return null;
  }

  async shareLocation(lat: number, lon: number, shareWith: string): Promise<string> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'share_location',
      payload: {
        lat,
        lon,
        share_with: shareWith,
      },
    });
  }

  async getSharedLocation(userId: string): Promise<{ lat: number; lon: number } | null> {
    const result = await this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_shared_location',
      payload: userId,
    });
    if (result && Array.isArray(result) && result.length === 2) {
      return { lat: result[0], lon: result[1] };
    }
    return null;
  }

  // Driver functions
  async registerAsDriver(vehicleInfo: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    licensePlate?: string;
    capacity: number;
  }, pricePerKm?: number, basePrice?: number, currency?: string): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'register_as_driver',
      payload: {
        vehicle_info: vehicleInfo,
        price_per_km: pricePerKm || null,
        base_price: basePrice || null,
        currency: currency || 'CLP',
      },
    });
  }

  async updateDriverPricing(pricePerKm?: number, basePrice?: number, currency?: string): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'update_driver_pricing',
      payload: {
        price_per_km: pricePerKm || null,
        base_price: basePrice || null,
        currency: currency || null,
      },
    });
  }

  async registerDriver(vehicleInfo: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    license_plate?: string;
    capacity: number;
    price_per_km: number;
    base_price?: number;
    currency: string;
  }): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'register_as_driver',
      payload: {
        vehicle_info: {
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          year: vehicleInfo.year || null,
          color: vehicleInfo.color || null,
          license_plate: vehicleInfo.license_plate || null,
          capacity: vehicleInfo.capacity,
          price_per_km: vehicleInfo.price_per_km,
          base_price: vehicleInfo.base_price || null,
          currency: vehicleInfo.currency,
        },
        price_per_km: vehicleInfo.price_per_km,
        base_price: vehicleInfo.base_price || null,
        currency: vehicleInfo.currency,
      },
    });
  }

  async getDriverInfo(): Promise<any | null> {
    try {
      const user = await this.getUserProfile();
      if (user && user.is_driver) {
        return {
          status: user.driver_status || 'offline',
          vehicle_info: user.vehicle_info || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Get driver info error:', error);
      return null;
    }
  }

  async updateDriverStatus(status: 'available' | 'busy' | 'offline', lat?: number, lon?: number): Promise<any> {
    return this.call({
      zome_name: 'grip_zome',
      fn_name: 'update_driver_status',
      payload: {
        status,
        lat: lat || null,
        lon: lon || null,
      },
    });
  }

  async getAvailableDrivers(): Promise<Array<{ driverId: string; lat: number; lon: number }>> {
    const result = await this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_available_drivers',
      payload: {},
    });
    if (Array.isArray(result)) {
      return result.map((item: any) => ({
        driverId: item[0],
        lat: item[1],
        lon: item[2],
      }));
    }
    return [];
  }

  async getDriverLocation(driverId: string): Promise<{ lat: number; lon: number } | null> {
    const result = await this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_driver_location',
      payload: driverId,
    });
    if (result && Array.isArray(result) && result.length === 2) {
      return { lat: result[0], lon: result[1] };
    }
    return null;
  }

  async getAllDrivers(): Promise<Array<{
    driverId: string;
    status: string;
    lat?: number;
    lon?: number;
    vehicleInfo?: any;
  }>> {
    const result = await this.call({
      zome_name: 'grip_zome',
      fn_name: 'get_all_drivers',
      payload: {},
    });
    if (Array.isArray(result)) {
      return result.map((item: any) => ({
        driverId: item[0],
        status: item[1],
        lat: item[2] || undefined,
        lon: item[3] || undefined,
        vehicleInfo: item[4] ? JSON.parse(item[4]) : undefined,
      }));
    }
    return [];
  }

  // Ride quoting
  async quoteRide(pickupLat: number, pickupLon: number, dropoffLat: number, dropoffLon: number): Promise<Array<{
    driverId: string;
    driverName: string;
    distanceKm: number;
    estimatedPrice: number;
    currency: string;
    vehicleInfo?: any;
    estimatedDurationMinutes?: number;
  }>> {
    const result = await this.call({
      zome_name: 'grip_zome',
      fn_name: 'quote_ride',
      payload: {
        pickup_lat: pickupLat,
        pickup_lon: pickupLon,
        dropoff_lat: dropoffLat,
        dropoff_lon: dropoffLon,
      },
    });
    if (Array.isArray(result)) {
      return result.map((quote: any) => ({
        driverId: quote.driver_id,
        driverName: quote.driver_name,
        distanceKm: quote.distance_km,
        estimatedPrice: quote.estimated_price,
        currency: quote.currency,
        vehicleInfo: quote.vehicle_info ? JSON.parse(quote.vehicle_info) : undefined,
        estimatedDurationMinutes: quote.estimated_duration_minutes,
      }));
    }
    return [];
  }
}

export const holochainClient = new HolochainClient();

