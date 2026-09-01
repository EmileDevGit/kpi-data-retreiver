"use server";

import { Prisma, type PollingStatus } from "@/generated/prisma/client";
import { createDevice, updateDevice, deleteDevice } from "@/lib/data/device/crud";
import { encryptDevicePassword } from "@/lib/security/device-credential";
import { syncDevicePolling, stopDevicePolling } from "@/lib/polling/scheduler";
import { intervalInputToMs, type IntervalUnit } from "@/lib/utils/poll-interval";
import { listChannelConfigsByDevice, updateChannelConfig } from "@/lib/data/channel-config";
import type { ChannelConfig } from "@/generated/prisma/client";

const MIN_POLL_INTERVAL_MS = 1000;

// "error" is scheduler-managed only — not a state a user can pick from the form.
const USER_SETTABLE_STATUSES: PollingStatus[] = ["active", "stopped"];

export type ChannelConfigInfo = {
  channelNumber: number;
  mode: number;
  signalLogicStatus: number;
  isPaused: boolean;
};

export type DeviceConfigFormState = {
  error: string | null;
  device: {
    ipAddress: string;
    macAddress: string;
    username: string;
    description: string | null;
    pollIntervalMs: number;
    pollingStatus: PollingStatus;
  } | null;
  channelConfigs: ChannelConfigInfo[] | null;
};

export async function updateDeviceConfigAction(
  deviceId: string,
  _prevState: DeviceConfigFormState,
  formData: FormData,
): Promise<DeviceConfigFormState> {
  const ipAddress = String(formData.get("ipAddress") ?? "").trim();
  const macAddress = String(formData.get("macAddress") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw === "" ? null : descriptionRaw;
  const pollIntervalValue = Number(formData.get("pollIntervalValue") ?? 0);
  const pollIntervalUnit = String(formData.get("pollIntervalUnit") ?? "seconds") as IntervalUnit;
  const pollingStatusRaw = String(formData.get("pollingStatus") ?? "stopped");

  if (!ipAddress || !macAddress || !username) {
    return { error: "IP address, MAC address, and username are required.", device: null, channelConfigs: null };
  }

  if (!USER_SETTABLE_STATUSES.includes(pollingStatusRaw as PollingStatus)) {
    return { error: "Invalid polling status.", device: null, channelConfigs: null };
  }
  const pollingStatus = pollingStatusRaw as PollingStatus;

  if (!Number.isFinite(pollIntervalValue) || pollIntervalValue <= 0) {
    return { error: "Polling rate must be a positive number.", device: null, channelConfigs: null };
  }
  const pollIntervalMs = intervalInputToMs(pollIntervalValue, pollIntervalUnit);
  if (pollIntervalMs < MIN_POLL_INTERVAL_MS) {
    return { error: `Polling rate must be at least ${MIN_POLL_INTERVAL_MS}ms.`, device: null, channelConfigs: null };
  }

  // Channel pause toggles ride along in the same form/save as the device
  // fields — resolve what each channel's isPaused WOULD be after this save
  // (not the stale pre-save DB value) so activating polling and unpausing a
  // channel in the same click works, instead of rejecting on stale state.
  const existingChannels = await listChannelConfigsByDevice(deviceId);
  const resolvedChannels = existingChannels.map((c) => {
    const submitted = formData.get(`channelPaused_${c.channelNumber}`);
    return { channelNumber: c.channelNumber, isPaused: submitted === null ? c.isPaused : submitted === "paused" };
  });

  if (pollingStatus === "active" && resolvedChannels.length > 0 && resolvedChannels.every((c) => c.isPaused)) {
    return { error: "Can't activate polling — every configured channel is paused. Unpause at least one first.", device: null, channelConfigs: null };
  }

  try {
    // Any manual save is a deliberate human touchpoint — give the device a
    // fresh failure budget rather than carrying over a count from before.
    const updated = await updateDevice(deviceId, {
      ipAddress,
      macAddress,
      username,
      description,
      pollIntervalMs,
      pollingStatus,
      consecutiveFailureCount: 0,
    });

    const updatedChannels: ChannelConfig[] = await Promise.all(
      resolvedChannels.map((c) => updateChannelConfig(deviceId, c.channelNumber, { isPaused: c.isPaused })),
    );

    await syncDevicePolling(deviceId);
    return {
      error: null,
      device: {
        ipAddress: updated.ipAddress,
        macAddress: updated.macAddress,
        username: updated.username,
        description: updated.description,
        pollIntervalMs: updated.pollIntervalMs,
        pollingStatus: updated.pollingStatus,
      },
      channelConfigs: updatedChannels
        .map((c) => ({ channelNumber: c.channelNumber, mode: c.mode, signalLogicStatus: c.signalLogicStatus, isPaused: c.isPaused }))
        .sort((a, b) => a.channelNumber - b.channelNumber),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "That IP address or MAC address is already used by another device.", device: null, channelConfigs: null };
    }
    return { error: "Failed to update device.", device: null, channelConfigs: null };
  }
}

export type CreateDeviceFormState = {
  error: string | null;
  device: { id: string } | null;
};

export async function createDeviceAction(
  machineId: string,
  _prevState: CreateDeviceFormState,
  formData: FormData,
): Promise<CreateDeviceFormState> {
  const ipAddress = String(formData.get("ipAddress") ?? "").trim();
  const macAddress = String(formData.get("macAddress") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw === "" ? null : descriptionRaw;

  if (!ipAddress || !macAddress || !username || !password) {
    return { error: "IP address, MAC address, username, and password are required.", device: null };
  }

  try {
    const created = await createDevice({
      machineId,
      ipAddress,
      macAddress,
      username,
      description,
      passwordEncrypted: encryptDevicePassword(password),
    });
    await syncDevicePolling(created.id);
    return { error: null, device: { id: created.id } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "That IP address or MAC address is already used by another device.", device: null };
    }
    return { error: "Failed to create device.", device: null };
  }
}

export async function deleteDeviceAction(deviceId: string): Promise<{ error: string | null }> {
  try {
    await deleteDevice(deviceId);
    stopDevicePolling(deviceId);
    return { error: null };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return { error: "Can't delete this device — it still has related records (e.g. poll history) linked to it." };
    }
    return { error: "Failed to delete device." };
  }
}
