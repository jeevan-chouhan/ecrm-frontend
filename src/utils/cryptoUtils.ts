/**
 * Crypto utility for AES-GCM encryption
 * Matches backend CryptoUtil implementation
 */

const GCM_IV_LENGTH = 12; // bytes
const ENCRYPT_KEY = "d86d7bab3d6ac01a";

/**
 * Convert string to ArrayBuffer
 */
const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

/**
 * Convert ArrayBuffer to Base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Generate SHA-256 hash of the key (to match backend's 256-bit key derivation)
 */
const deriveKey = async (): Promise<CryptoKey> => {
  const keyData = stringToArrayBuffer(ENCRYPT_KEY);
  
  // Hash the key using SHA-256 (same as backend)
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  
  // Import the hashed key for AES-GCM
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
};

/**
 * Encrypt plaintext using AES-GCM
 * Output format: Base64(IV + ciphertext + authTag)
 * @param plainText - The text to encrypt
 * @returns Base64 encoded encrypted string
 */
export const encrypt = async (plainText: string): Promise<string> => {
  try {
    // Generate random IV (12 bytes)
    const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
    
    // Derive the key
    const key = await deriveKey();
    
    // Encrypt the plaintext
    const encodedText = new TextEncoder().encode(plainText);
    const cipherText = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128, // 128 bits auth tag
      },
      key,
      encodedText
    );
    
    // Combine IV + ciphertext (ciphertext includes auth tag in Web Crypto API)
    const combined = new Uint8Array(iv.length + cipherText.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherText), iv.length);
    
    // Return Base64 encoded result
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Encryption failed");
  }
};
