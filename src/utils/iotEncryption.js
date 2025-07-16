/**
 * Device-side encryption utilities for IoT sensor data transmission
 * Implements efficient field-level encryption for WebSocket communications
 */

import CryptoJS from 'crypto-js';

class IoTEncryptionManager {
  constructor() {
    this.deviceKey = null;
    this.encryptionEnabled = false;
  }

  /**
   * Initialize encryption with device key received from backend
   */
  initializeEncryption(encryptionKey, enabled = true) {
    this.deviceKey = encryptionKey;
    this.encryptionEnabled = enabled;
  }

  /**
   * Encrypt sensitive sensor values while preserving JSON structure
   */
  encryptSensorData(data) {
    if (!this.encryptionEnabled || !this.deviceKey) {
      return data; // Return original data if encryption disabled
    }

    try {
      // Define sensitive sensor types that should be encrypted
      const sensitiveSensorTypes = [
        'location', 'gps', 'camera', 'microphone', 'biometric',
        'personal', 'sensitive', 'private', 'coordinates'
      ];

      // Clone data to avoid modifying original
      const encryptedData = JSON.parse(JSON.stringify(data));

      if (encryptedData.readings && Array.isArray(encryptedData.readings)) {
        // Bulk readings format
        encryptedData.readings.forEach(reading => {
          const sensorType = (reading.sensor_type || '').toLowerCase();
          
          // Check if this sensor type should be encrypted
          const shouldEncrypt = sensitiveSensorTypes.some(sensitive => 
            sensorType.includes(sensitive)
          );

          if (shouldEncrypt) {
            const originalValue = String(reading.value);
            reading.value = this._encryptField(originalValue);
            reading.encrypted = true;
          }
        });
      } else if (encryptedData.sensor_type) {
        // Single reading format
        const sensorType = encryptedData.sensor_type.toLowerCase();
        const shouldEncrypt = sensitiveSensorTypes.some(sensitive => 
          sensorType.includes(sensitive)
        );

        if (shouldEncrypt) {
          const originalValue = String(encryptedData.value);
          encryptedData.value = this._encryptField(originalValue);
          encryptedData.encrypted = true;
        }
      }

      return encryptedData;

    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Return original data on encryption failure
    }
  }

  /**
   * Decrypt received sensor data (for dashboard/frontend use)
   */
  decryptSensorData(data) {
    if (!this.encryptionEnabled || !this.deviceKey) {
      return data;
    }

    try {
      const decryptedData = JSON.parse(JSON.stringify(data));

      if (decryptedData.readings && Array.isArray(decryptedData.readings)) {
        decryptedData.readings.forEach(reading => {
          if (reading.encrypted) {
            reading.value = this._decryptField(reading.value);
            delete reading.encrypted;
          }
        });
      } else if (decryptedData.encrypted) {
        decryptedData.value = this._decryptField(decryptedData.value);
        delete decryptedData.encrypted;
      }

      return decryptedData;

    } catch (error) {
      console.error('Decryption failed:', error);
      return data;
    }
  }

  /**
   * Encrypt a single field value using AES-256-CBC
   */
  _encryptField(plaintext) {
    try {
      // Generate random IV for each encryption
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Convert device key from base64
      const key = CryptoJS.enc.Base64.parse(this.deviceKey);
      
      // Encrypt using AES-256-CBC
      const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Combine IV + ciphertext
      const combined = iv.concat(encrypted.ciphertext);
      
      // Return as base64
      return CryptoJS.enc.Base64.stringify(combined);

    } catch (error) {
      console.error('Field encryption failed:', error);
      return plaintext; // Return original on failure
    }
  }

  /**
   * Decrypt a single field value
   */
  _decryptField(encryptedData) {
    try {
      // Parse the combined IV + ciphertext
      const combined = CryptoJS.enc.Base64.parse(encryptedData);
      
      // Extract IV (first 16 bytes) and ciphertext
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
      
      // Convert device key from base64
      const key = CryptoJS.enc.Base64.parse(this.deviceKey);
      
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext },
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);

    } catch (error) {
      console.error('Field decryption failed:', error);
      return encryptedData; // Return encrypted data on failure
    }
  }

  /**
   * Get encryption status
   */
  isEncryptionEnabled() {
    return this.encryptionEnabled && this.deviceKey !== null;
  }
}

export default IoTEncryptionManager;
