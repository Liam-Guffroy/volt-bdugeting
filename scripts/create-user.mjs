import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";

/**
 * Create (or reset the password of) an account. There is no public signup —
 * this is how every user gets in.
 *
 *   npm run user:create -- "Liam" "a-strong-password"
 *
 * Login is by password only, so each account's password must be unique — the
 * script refuses a password already used by another account. Re-running with an
 * existing name updates that account's password (a password reset).
 *
 * The scrypt parameters and "<saltHex>:<hashHex>" format must match
 * src/lib/password.ts so the app can verify what this writes.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

function hashPassword(plain) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = crypto.scryptSync(plain, salt, KEYLEN, { N, r: R, p: P });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(plain, stored) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = crypto.scryptSync(plain, salt, expected.length, {
    N,
    r: R,
    p: P,
  });
  return crypto.timingSafeEqual(derived, expected);
}

const [, , nameArg, passwordArg] = process.argv;
if (!nameArg || !passwordArg) {
  console.error('Usage: npm run user:create -- "<name>" "<password>"');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (check your .env).");
  process.exit(1);
}

const name = nameArg.trim();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  // Reject a password already in use by a *different* account — otherwise two
  // people could log in to the wrong budget.
  const { rows: existing } = await pool.query(
    "select id, name, password_hash from users",
  );
  const clash = existing.find(
    (u) => u.name !== name && verifyPassword(passwordArg, u.password_hash),
  );
  if (clash) {
    console.error(
      `That password is already used by "${clash.name}". Pick a different one.`,
    );
    process.exit(1);
  }

  const { rows } = await pool.query(
    `insert into users (name, password_hash)
     values ($1, $2)
     on conflict (name) do update set password_hash = excluded.password_hash
     returning id, name`,
    [name, hashPassword(passwordArg)],
  );
  console.log(`User ready: #${rows[0].id} ${rows[0].name}`);
} catch (err) {
  console.error("Failed to create user:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
