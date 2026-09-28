/**
 * High-performance lightweight payload obfuscation / encoding wrapper
 * Hides raw plain-text responses from browser Network Tab inspection
 */

const SECRET_SALT = 0x5a;

export function encodePayload(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    // 1. Convert string to UTF-8 byte array
    const utf8Bytes = typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(jsonStr)
      : Buffer.from(jsonStr, 'utf-8');
    
    // 2. XOR mask each byte with salt for basic cipher scrambling
    const masked = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      masked[i] = utf8Bytes[i] ^ (SECRET_SALT + (i % 7));
    }

    // 3. Convert to base64
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(masked).toString('base64');
    } else {
      let binary = '';
      const len = masked.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(masked[i]);
      }
      return btoa(binary);
    }
  } catch (err) {
    return '';
  }
}

export function decodePayload<T = any>(encodedStr: string): T | null {
  try {
    if (!encodedStr) return null;

    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(encodedStr, 'base64');
      bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } else {
      const binary = atob(encodedStr);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    }

    // Unmask XOR
    const unmasked = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      unmasked[i] = bytes[i] ^ (SECRET_SALT + (i % 7));
    }

    const decodedStr = typeof TextDecoder !== 'undefined'
      ? new TextDecoder().decode(unmasked)
      : Buffer.from(unmasked).toString('utf-8');

    return JSON.parse(decodedStr);
  } catch (err) {
    return null;
  }
}
