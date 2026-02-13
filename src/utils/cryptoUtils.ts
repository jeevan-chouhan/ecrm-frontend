/**
 * Crypto utility for AES-GCM encryption
 * Uses node-forge library for cross-environment compatibility (HTTP & HTTPS)
 * Matches backend CryptoUtil implementation exactly
 */

import forge from "node-forge";

const GCM_IV_LENGTH = 12; // 12 bytes = 96 bits (standard for AES-GCM)
const GCM_TAG_LENGTH = 128; // 128 bits (standard for AES-GCM)
const ENCRYPT_KEY = import.meta.env.VITE_PASSWORD_ENCRYPT_KEY;

/**
 * Derive key using SHA-256 hash (to match backend's 256-bit key derivation)
 * This ensures the key is exactly 256 bits (32 bytes)
 */
const deriveKey = (): string => {
  const md = forge.md.sha256.create();
  md.update(ENCRYPT_KEY, "utf8");
  return md.digest().data; // Returns raw binary string (32 bytes)
};

/**
 * Encrypt plaintext using AES-GCM
 * Output format: Base64(IV + ciphertext + authTag)
 * This matches the Java backend CryptoUtil format exactly
 * 
 * @param plainText - The text to encrypt
 * @returns Base64 encoded encrypted string
 */
export const encrypt = async (plainText: string): Promise<string> => {
  try {
    // Try Web Crypto API first (works in HTTPS/secure context)
    if (typeof crypto !== "undefined" && crypto.subtle) {
      return await encryptWithWebCrypto(plainText);
    }
    
    // Fallback to node-forge (works everywhere including HTTP)
    return encryptWithForge(plainText);
  } catch (error) {
    // Fallback to node-forge
    try {
      return encryptWithForge(plainText);
    } catch (fallbackError) {
      throw new Error("Encryption failed");
    }
  }
};

/**
 * Encrypt using Web Crypto API (for HTTPS environments)
 */
const encryptWithWebCrypto = async (plainText: string): Promise<string> => {
  // Generate random IV (12 bytes)
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
  
  // Hash the key using SHA-256
  const keyData = new TextEncoder().encode(ENCRYPT_KEY);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  
  // Import the hashed key for AES-GCM
  const key = await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  // Encrypt the plaintext
  const encodedText = new TextEncoder().encode(plainText);
  const cipherText = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: GCM_TAG_LENGTH,
    },
    key,
    encodedText
  );
  
  // Combine IV + ciphertext (Web Crypto includes auth tag in ciphertext)
  const combined = new Uint8Array(iv.length + cipherText.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherText), iv.length);
  
  // Return Base64 encoded result
  return forge.util.encode64(
    String.fromCharCode.apply(null, Array.from(combined))
  );
};

/**
 * Encrypt using node-forge with AES-GCM (for HTTP environments or fallback)
 * This produces output identical to Web Crypto API AES-GCM
 */
const encryptWithForge = (plainText: string): string => {
  // Generate random IV (12 bytes)
  const iv = forge.random.getBytesSync(GCM_IV_LENGTH);
  
  // Derive key using SHA-256 (32 bytes = 256 bits)
  const key = deriveKey();
  
  // Create AES-GCM cipher
  const cipher = forge.cipher.createCipher("AES-GCM", key);
  
  cipher.start({
    iv: iv,
    tagLength: GCM_TAG_LENGTH, // 128 bits
  });
  
  // Encrypt the plaintext
  cipher.update(forge.util.createBuffer(plainText, "utf8"));
  cipher.finish();
  
  // Get ciphertext and auth tag
  const ciphertext = cipher.output.data;
  const tag = cipher.mode.tag.data;
  
  // Combine: IV + ciphertext + tag (matches Java format)
  const combined = iv + ciphertext + tag;
  
  // Return Base64 encoded result
  return forge.util.encode64(combined);
};

/**
 * Synchronous encrypt function using node-forge only
 * Use this if you need synchronous encryption
 */
export const encryptSync = (plainText: string): string => {
  return encryptWithForge(plainText);
};
