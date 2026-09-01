import { DevicePollResult } from "../../types/device";

const TIMEOUT_MS = 3000;

function basicAuthHeader(username: string, password: string): string {
  const encoded = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${encoded}`;
}

async function fetchJson(ipAddress: string, username: string, password: string, path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`http://${ipAddress}${path}`, {
      headers: {
        Authorization: basicAuthHeader(username, password),
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

export async function pollDevice(device: { ipAddress: string; username: string; password: string }): Promise<DevicePollResult> {
  const start = Date.now();
  const fetchedAt = new Date().toISOString();

  try {
    const di = await fetchJson(device.ipAddress, device.username, device.password, "/di_value/slot_0");
    const log = await fetchJson(device.ipAddress, device.username, device.password, "/log_message");

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
