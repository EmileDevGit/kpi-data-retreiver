import { DevicePollResult } from "../../types/device";

// TEMPORARY: only `passwordHash` is persisted (correctly, since it's a hash),
// but the device's HTTP API needs the plaintext password for Basic Auth.
// There's no real credential store yet, so every device is polled with this
// single placeholder password until one exists.
const DEVICE_PASSWORD = "12345";
const TIMEOUT_MS = 3000;

function basicAuthHeader(username: string): string {
  const encoded = Buffer.from(`${username}:${DEVICE_PASSWORD}`).toString("base64");
  return `Basic ${encoded}`;
}

async function fetchJson(ipAddress: string, username: string, path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`http://${ipAddress}${path}`, {
      headers: {
        Authorization: basicAuthHeader(username),
        Connection: "close",
        Accept: "*/*"
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function pollDevice(device: { ipAddress: string; username: string }): Promise<DevicePollResult> {
  const start = Date.now();
  const fetchedAt = new Date().toISOString();

  try {
    const di = await fetchJson(device.ipAddress, device.username, "/di_value/slot_0");
    const log = await fetchJson(device.ipAddress, device.username, "/log_message");

    return {
      connected: true,
      latencyMs: Date.now() - start,
      error: null,
      diValue: di.DIVal ?? null,
      logMessages: log.LogMsg ?? null,
      fetchedAt,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : "Unknown error",
      diValue: null,
      logMessages: null,
      fetchedAt,
    };
  }
}
