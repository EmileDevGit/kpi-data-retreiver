import { prisma } from "@/lib/prisma";
import type { Prisma, DevicePoll } from "@/generated/prisma/client";

// No update() here: a poll is an immutable record of a single fetch attempt,
// not a mutable entity — see the schema notes on DevicePoll/ChannelLog/MessageLog.

export function createDevicePoll(data: Prisma.DevicePollUncheckedCreateInput): Promise<DevicePoll> {
  return prisma.devicePoll.create({ data });
}

export function getDevicePoll(id: string): Promise<DevicePoll | null> {
  return prisma.devicePoll.findUnique({ where: { id } });
}

export function listDevicePollsByDevice(deviceId: string): Promise<DevicePoll[]> {
  return prisma.devicePoll.findMany({ where: { deviceId }, orderBy: { fetchedAt: "desc" } });
}

export function deleteDevicePoll(id: string): Promise<DevicePoll> {
  return prisma.devicePoll.delete({ where: { id } });
}
