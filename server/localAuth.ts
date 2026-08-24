import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt-v1";
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function derivePasswordKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(Buffer.from(derivedKey));
    });
  });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return `${HASH_PREFIX}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [prefix, saltEncoded, keyEncoded] = storedHash.split("$");
  if (prefix !== HASH_PREFIX || !saltEncoded || !keyEncoded) return false;

  try {
    const salt = Buffer.from(saltEncoded, "base64url");
    const expected = Buffer.from(keyEncoded, "base64url");
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
    const derived = await derivePasswordKey(password, salt);
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

type Attempt = { count: number; startedAt: number };
const attempts = new Map<string, Attempt>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.startedAt >= ATTEMPT_WINDOW_MS) {
    const fresh = { count: 0, startedAt: now };
    attempts.set(key, fresh);
    return fresh;
  }
  return current;
}

export function canAttemptAuthentication(key: string) {
  return getAttempt(key).count < MAX_ATTEMPTS;
}

export function recordAuthenticationFailure(key: string) {
  const attempt = getAttempt(key);
  attempt.count += 1;
}

export function clearAuthenticationAttempts(key: string) {
  attempts.delete(key);
}
