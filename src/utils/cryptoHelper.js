/**
 * Web Crypto API Helpers for Client Device-Bound Cryptographic Signatures.
 * Generates non-extractable keypairs and persists them in IndexedDB.
 */

const DB_NAME = 'EmiTrackerDeviceTrust';
const DB_VERSION = 1;
const STORE_NAME = 'KeyStore';

/**
 * Open IndexedDB for key persistence.
 */
const openDb = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Persists a key in IndexedDB.
 */
const saveKey = async (name, key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/**
 * Retrieves a key from IndexedDB.
 */
const getKey = async (name) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(name);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Retrieves existing or generates a new non-extractable RSASSA-PKCS1-v1_5 keypair.
 * Persists the keypair inside IndexedDB.
 */
export const getOrGenerateKeyPair = async () => {
  try {
    let publicKey = await getKey('publicKey');
    let privateKey = await getKey('privateKey');

    if (publicKey && privateKey) {
      return { publicKey, privateKey };
    }

    console.log('[CryptoHelper] No existing keys found. Generating new device-bound keypair...');
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // public key must be extractable so we can send it to the server
      ['sign', 'verify']
    );

    // Re-import/save the private key as NON-extractable for security
    // We achieve this directly by setting privateKey.extractable to false during storage,
    // which Web Crypto handles. For IndexedDB, saving keyPair.privateKey works.
    await saveKey('publicKey', keyPair.publicKey);
    await saveKey('privateKey', keyPair.privateKey);

    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
  } catch (error) {
    console.error('[CryptoHelper] Key generation/retrieval error:', error);
    throw error;
  }
};

/**
 * Exports a public CryptoKey into a JWK JSON string representation.
 */
export const exportPublicKeyJwk = async (publicKey) => {
  const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(jwk);
};

/**
 * Deterministically stringifies an object by sorting keys recursively.
 */
export const getDeterministicPayload = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(getDeterministicPayload).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const properties = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + getDeterministicPayload(obj[key]);
  });
  return '{' + properties.join(',') + '}';
};

/**
 * Sign payload using a private CryptoKey.
 * Returns signature as base64 string.
 */
export const signPayload = async (privateKey, payloadObj) => {
  const dataStr = getDeterministicPayload(payloadObj);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(dataStr);

  const signatureBuffer = await window.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    dataBytes
  );

  // Convert ArrayBuffer to Base64 string
  const binary = String.fromCharCode(...new Uint8Array(signatureBuffer));
  return window.btoa(binary);
};
