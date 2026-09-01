import { prisma } from "@/lib/prisma";
import type { Prisma, MessageLog } from "@/generated/prisma/client";

// No update() here — see device-poll.ts: log rows are immutable.

export function createMessageLog(data: Prisma.MessageLogUncheckedCreateInput): Promise<MessageLog> {
  return prisma.messageLog.create({ data });
}

export function createManyMessageLogs(data: Prisma.MessageLogUncheckedCreateInput[]): Promise<Prisma.BatchPayload> {
  return prisma.messageLog.createMany({ data });
}

// Dedup watermark: the device replays its whole log buffer on every fetch, so
// only records newer than the latest one already stored for this device are new.
export async function getLatestMessageLogOccurredAt(deviceId: string): Promise<Date | null> {
  const latest = await prisma.messageLog.findFirst({
    where: { deviceId },
    orderBy: { occurredAt: "desc" },
    select: { occurredAt: true },
  });
  return latest?.occurredAt ?? null;
}

export function getMessageLog(id: string): Promise<MessageLog | null> {
  return prisma.messageLog.findUnique({ where: { id } });
}

export function listMessageLogsByPoll(pollId: string): Promise<MessageLog[]> {
  return prisma.messageLog.findMany({ where: { pollId }, orderBy: { id: "asc" } });
}

export function deleteMessageLog(id: string): Promise<MessageLog> {
  return prisma.messageLog.delete({ where: { id } });
}
