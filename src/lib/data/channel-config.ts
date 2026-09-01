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
