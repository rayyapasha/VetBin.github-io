import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Hashes a plain-text password using Node's built-in scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies a plain-text password against a stored salted scrypt hash in constant time.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }
  const [, salt, originalHex] = parts;
  if (!salt || !originalHex) {
    return false;
  }

  try {
    const derivedKey = scryptSync(password, salt, 64);
    const originalBuffer = Buffer.from(originalHex, 'hex');
    if (derivedKey.length !== originalBuffer.length) {
      return false;
    }
    return timingSafeEqual(derivedKey, originalBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically strong opaque bearer session token.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
