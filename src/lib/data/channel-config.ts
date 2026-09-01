import { prisma } from "@/lib/prisma";
import type { Prisma, ChannelConfig } from "@/generated/prisma/client";

export function createChannelConfig(data: Prisma.ChannelConfigUncheckedCreateInput): Promise<ChannelConfig> {
  return prisma.channelConfig.create({ data });
}

export function getChannelConfig(deviceId: string, channelNumber: number): Promise<ChannelConfig | null> {
  return prisma.channelConfig.findUnique({
    where: { deviceId_channelNumber: { deviceId, channelNumber } },
  });
}

export function listChannelConfigsByDevice(deviceId: string): Promise<ChannelConfig[]> {
  return prisma.channelConfig.findMany({ where: { deviceId }, orderBy: { channelNumber: "asc" } });
}

// Syncs mode/signalLogicStatus from a live device read. Deliberately never
// touches isPaused — that field is app/user-managed, not device-reported.
export function syncChannelConfigReading(
  deviceId: string,
  channelNumber: number,
  mode: number,
  signalLogicStatus: number,
): Promise<ChannelConfig> {
  return prisma.channelConfig.upsert({
    where: { deviceId_channelNumber: { deviceId, channelNumber } },
    update: { mode, signalLogicStatus },
    create: { deviceId, channelNumber, mode, signalLogicStatus },
  });
}

// True only when the device has at least one configured channel and every
// one of them is paused. A device with zero configured channels (not yet
// discovered by a first successful poll) must NOT count as "all paused" —
// that would permanently block the very poll that discovers its channels.
export async function deviceHasOnlyPausedChannels(deviceId: string): Promise<boolean> {
  const configs = await prisma.channelConfig.findMany({ where: { deviceId }, select: { isPaused: true } });
  return configs.length > 0 && configs.every((c) => c.isPaused);
}

export function updateChannelConfig(
  deviceId: string,
  channelNumber: number,
  data: Prisma.ChannelConfigUncheckedUpdateInput,
): Promise<ChannelConfig> {
  return prisma.channelConfig.update({
    where: { deviceId_channelNumber: { deviceId, channelNumber } },
    data,
  });
}

export function deleteChannelConfig(deviceId: string, channelNumber: number): Promise<ChannelConfig> {
  return prisma.channelConfig.delete({
    where: { deviceId_channelNumber: { deviceId, channelNumber } },
  });
}
