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