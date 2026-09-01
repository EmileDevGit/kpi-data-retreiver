import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Device passwords must be recoverable in plaintext to authenticate to the
// physical device over HTTP Basic Auth (see lib/data/device/poll.ts), so this
// is reversible AES-256-GCM encryption, not a one-way hash.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.DEVICE_CREDENTIAL_KEY;
  if (!key) {
    throw new Error("DEVICE_CREDENTIAL_KEY environment variable is not set");
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("DEVICE_CREDENTIAL_KEY must decode to exactly 32 bytes (base64-encoded)");
  }
  return buf;
}

export function encryptDevicePassword(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64")).join(".");
}

export function decryptDevicePassword(stored: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted device credential");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}
