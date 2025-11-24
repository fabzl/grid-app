// Encryption utilities for private messages
// Uses Web Crypto API for end-to-end encryption

export class MessageEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  private static async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptMessage(text: string, sharedKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      sharedKey,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  static async decryptMessage(encryptedData: string, sharedKey: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      sharedKey,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Generate a shared key for a chat (simplified - in production use proper key exchange)
  static async generateSharedKey(chatId: string): Promise<CryptoKey> {
    // Use chatId as seed for deterministic key generation
    const encoder = new TextEncoder();
    const seed = encoder.encode(chatId);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      seed,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(16), // In production, use random salt
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
}

