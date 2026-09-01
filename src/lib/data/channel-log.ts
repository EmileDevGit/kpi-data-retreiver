import { prisma } from "@/lib/prisma";
import type { Prisma, ChannelLog } from "@/generated/prisma/client";

// No update() here — see device-poll.ts: log rows are immutable.

export function createChannelLog(data: Prisma.ChannelLogUncheckedCreateInput): Promise<ChannelLog> {
  return prisma.channelLog.create({ data });
}

export function createManyChannelLogs(data: Prisma.ChannelLogUncheckedCreateInput[]): Promise<Prisma.BatchPayload> {
  return prisma.channelLog.createMany({ data });
}

export function getChannelLog(pollId: string, channelNumber: number): Promise<ChannelLog | null> {
  return prisma.channelLog.findUnique({
    where: { pollId_channelNumber: { pollId, channelNumber } },
  });
}

export function listChannelLogsByPoll(pollId: string): Promise<ChannelLog[]> {
  return prisma.channelLog.findMany({ where: { pollId }, orderBy: { channelNumber: "asc" } });
}

export function deleteChannelLog(pollId: string, channelNumber: number): Promise<ChannelLog> {
  return prisma.channelLog.delete({
    where: { pollId_channelNumber: { pollId, channelNumber } },
  });
}
