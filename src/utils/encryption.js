import CryptoJS from 'crypto-js';

// Generate a random AES key
export const generateAESKey = () => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};

// Generate a random IV for AES
export const generateIV = () => {
  return CryptoJS.lib.WordArray.random(128/8).toString();
};

// Encrypt data using AES-256-CBC
export const encryptAES = (data, key, iv) => {
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  
  const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return encrypted.toString();
};

// Decrypt data using AES-256-CBC
export const decryptAES = (encryptedData, key, iv) => {
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  
  const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
};

// RSA encryption using Web Crypto API (modern browsers)
export const encryptRSA = async (data, publicKeyPem) => {
  try {
    // Convert PEM to binary
    const binaryDer = str2ab(atob(publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s/g, '')));
    
    // Import the key
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      new TextEncoder().encode(data)
    );
    
    // Convert to base64
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error('Encryption failed');
  }
};

// Helper function to convert string to ArrayBuffer
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Encrypt sensitive form data
export const encryptFormData = async (formData, publicKey) => {
  // Generate AES key and IV
  const aesKey = generateAESKey();
  const iv = generateIV();
  
  // Encrypt sensitive fields with AES
  const encryptedData = {};
  const sensitiveFields = ['password', 'confirmPassword'];
  
  for (const [key, value] of Object.entries(formData)) {
    if (sensitiveFields.includes(key)) {
      encryptedData[key] = {
        data: encryptAES(value, aesKey, iv),
        encrypted: true
      };
    } else {
      encryptedData[key] = value;
    }
  }
  
  // Encrypt AES key with RSA public key
  const encryptedAESKey = await encryptRSA(aesKey, publicKey);
  
  return {
    data: encryptedData,
    key: encryptedAESKey,
    iv: iv
  };
};

// Frontend encryption utilities for secure authentication

class EncryptionManager {
  constructor() {
    this.publicKey = null;
  }

  async loadPublicKey(publicKeyPem) {
    try {
      // Import the RSA public key
      const binaryDerString = window.atob(
        publicKeyPem
          .replace(/-----BEGIN PUBLIC KEY-----/, '')
          .replace(/-----END PUBLIC KEY-----/, '')
          .replace(/\s/g, '')
      );
      
      const binaryDer = new Uint8Array(binaryDerString.length);
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
      }

      this.publicKey = await window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );
    } catch (error) {
      console.error('Failed to load public key:', error);
      throw new Error('Invalid public key format');
    }
  }

  async generateAESKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptWithAES(data, key, iv) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv,
      },
      key,
      encodedData
    );

    return new Uint8Array(encrypted);
  }

  async encryptWithRSA(data) {
    if (!this.publicKey) {
      throw new Error('Public key not loaded');
    }

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      this.publicKey,
      encodedData
    );

    return new Uint8Array(encrypted);
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async encryptFormData(formData, sensitiveFields = ['password']) {
    try {
      if (!this.publicKey) {
        throw new Error('Encryption not available - public key not loaded');
      }

      // Generate AES key and IV
      const aesKey = await this.generateAESKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(16));

      // Export AES key to encrypt it with RSA
      const exportedKey = await window.crypto.subtle.exportKey('raw', aesKey);
      const keyHex = this.arrayBufferToHex(exportedKey);

      // Encrypt the AES key with RSA
      const encryptedAESKey = await this.encryptWithRSA(keyHex);

      // Prepare data for encryption
      const encryptedData = {};
      
      for (const [field, value] of Object.entries(formData)) {
        if (sensitiveFields.includes(field)) {
          // Encrypt sensitive fields
          const encryptedValue = await this.encryptWithAES(value, aesKey, iv);
          encryptedData[field] = {
            data: this.arrayBufferToBase64(encryptedValue),
            encrypted: true
          };
        } else {
          // Keep non-sensitive fields as plain text
          encryptedData[field] = value;
        }
      }

      return {
        data: encryptedData,
        key: this.arrayBufferToBase64(encryptedAESKey),
        iv: this.arrayBufferToHex(iv)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to plain data if encryption fails
      return formData;
    }
  }
}

// Global instance
export const encryptionManager = new EncryptionManager();

// Helper function to encrypt login/signup data
export async function encryptAuthData(formData, publicKeyPem) {
  try {
    await encryptionManager.loadPublicKey(publicKeyPem);
    return await encryptionManager.encryptFormData(formData, ['password']);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt authentication data. Please try again.');
  }
}

export default encryptionManager;