import "server-only";
import crypto from "node:crypto";

/**
 * Per-user password hashing for the users table.
 *
 * Uses scrypt — a deliberately slow, memory-hard hash — so a leaked database
 * can't be brute-forced cheaply. This is NOT the same as the cookie-signing
 * HMAC in session.ts: that signs a value we control, this protects secrets a
 * human chose. Never store plaintext.
 *
 * Stored format: "<saltHex>:<hashHex>". The salt is random per password, so the
 * same password hashes differently for every user.
 *
 * Keep these parameters in sync with scripts/create-user.mjs, which produces
 * the same format when seeding accounts.
 */

const N = 16384; // CPU/memory cost
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = crypto.scryptSync(plain, salt, KEYLEN, { N, r: R, p: P });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = crypto.scryptSync(plain, salt, expected.length, {
    N,
    r: R,
    p: P,
  });

  // Constant-time compare to avoid leaking how much of the hash matched.
  return crypto.timingSafeEqual(derived, expected);
}
