import { DevicePollResult } from "../../types/device";

// TEMPORARY, for single device only
const DEVICE_IP = "192.168.1.1";
const DEVICE_USER = "root";
const DEVICE_PASSWORD = "12345";
const TIMEOUT_MS = 3000;

function basicAuthHeader(): string {
  const encoded = Buffer.from(`${DEVICE_USER}:${DEVICE_PASSWORD}`).toString("base64");
  return `Basic ${encoded}`;
}

async function fetchJson(path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`http://${DEVICE_IP}${path}`, {
      headers: {
        Authorization: basicAuthHeader(),
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

export async function pollDevice(): Promise<DevicePollResult> {
  const start = Date.now();
  const fetchedAt = new Date().toISOString();

  try {
    const di = await fetchJson("/di_value/slot_0");
    const log = await fetchJson("/log_message");

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
