"use server";

import { Prisma } from "@/generated/prisma/client";
import { createDevice, updateDevice, deleteDevice } from "@/lib/data/device/crud";
import { encryptDevicePassword } from "@/lib/security/device-credential";

export type DeviceConfigFormState = {
  error: string | null;
  device: {
    ipAddress: string;
    macAddress: string;
    username: string;
    description: string | null;
  } | null;
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

  if (!ipAddress || !macAddress || !username) {
    return { error: "IP address, MAC address, and username are required.", device: null };
  }

  try {
    const updated = await updateDevice(deviceId, { ipAddress, macAddress, username, description });
    return {
      error: null,
      device: {
        ipAddress: updated.ipAddress,
        macAddress: updated.macAddress,
        username: updated.username,
        description: updated.description,
      },
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "That IP address or MAC address is already used by another device.", device: null };
    }
    return { error: "Failed to update device.", device: null };
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
    return { error: null };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return { error: "Can't delete this device — it still has related records (e.g. poll history) linked to it." };
    }
    return { error: "Failed to delete device." };
  }
}
