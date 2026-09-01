import { prisma } from "@/lib/prisma";
import { pollAndPersistDevice } from "@/lib/polling/persist";
import type { PollingStatus } from "@/generated/prisma/client";

// In-process per-device timer registry. Each device gets its own
// self-rescheduling setTimeout so a slow/unreachable device never delays or
// overlaps polling for any other device. Lives only for the lifetime of this
// server process — re-synced from the DB on every boot via initializePolling.
const timers = new Map<string, ReturnType<typeof setTimeout>>();

// Consecutive failures before a device auto-escalates from "active" to
// "error", so a dead device stops flooding poll history at its normal rate.
const FAILURE_THRESHOLD = 5;

// Retry cadence for devices in "error" state — decoupled from the device's
// configured pollIntervalMs (which is what caused the flood in the first
// place). A success at this slower rate auto-recovers the device to "active".
const ERROR_RETRY_INTERVAL_MS = 5 * 60 * 1000;

function clearTimer(deviceId: string): void {
  const existing = timers.get(deviceId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(deviceId);
  }
}

function scheduleNext(deviceId: string, intervalMs: number): void {
  clearTimer(deviceId);
  timers.set(
    deviceId,
    setTimeout(() => void runCycle(deviceId), intervalMs),
  );
}

async function recordPollOutcome(deviceId: string, succeeded: boolean): Promise<PollingStatus> {
  if (succeeded) {
    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: { consecutiveFailureCount: 0, pollingStatus: "active" },
    });
    return updated.pollingStatus;
  }

  const updated = await prisma.device.update({
    where: { id: deviceId },
    data: { consecutiveFailureCount: { increment: 1 } },
  });

  if (updated.pollingStatus === "active" && updated.consecutiveFailureCount >= FAILURE_THRESHOLD) {
    const escalated = await prisma.device.update({
      where: { id: deviceId },
      data: { pollingStatus: "error" },
    });
    return escalated.pollingStatus;
  }

  return updated.pollingStatus;
}

async function runCycle(deviceId: string): Promise<void> {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device || device.pollingStatus === "stopped") {
    clearTimer(deviceId);
    return;
  }

  let succeeded = false;
  try {
    const poll = await pollAndPersistDevice(device);
    succeeded = poll.isSuccessful;
  } catch (err) {
    console.error(`[polling] cycle failed for device ${deviceId}:`, err);
  }

  await recordPollOutcome(deviceId, succeeded).catch((err) => {
    console.error(`[polling] failed to record outcome for device ${deviceId}:`, err);
  });

  // Re-read after recording the outcome: config may have changed (rate
  // change, stopped, deleted) while this cycle's network call was in flight.
  const current = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!current || current.pollingStatus === "stopped") {
    clearTimer(deviceId);
    return;
  }

  const delay = current.pollingStatus === "error" ? ERROR_RETRY_INTERVAL_MS : current.pollIntervalMs;
  scheduleNext(deviceId, delay);
}

// Call after any create/update that could affect a device's polling (rate
// change, active/stopped toggle, or the device just being created). Resets
// the schedule and polls immediately with the latest settings.
export async function syncDevicePolling(deviceId: string): Promise<void> {
  clearTimer(deviceId);
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device || device.pollingStatus === "stopped") return;
  void runCycle(deviceId);
}

// Call after a device is deleted.
export function stopDevicePolling(deviceId: string): void {
  clearTimer(deviceId);
}

// Call once at server boot.
export async function initializePolling(): Promise<void> {
  const devices = await prisma.device.findMany({ where: { pollingStatus: { not: "stopped" } } });
  for (const device of devices) {
    void runCycle(device.id);
  }
}
