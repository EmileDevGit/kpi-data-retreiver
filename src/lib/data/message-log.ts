import { prisma } from "@/lib/prisma";
import type { Prisma, MessageLog } from "@/generated/prisma/client";

// No update() here — see device-poll.ts: log rows are immutable.

export function createMessageLog(data: Prisma.MessageLogUncheckedCreateInput): Promise<MessageLog> {
  return prisma.messageLog.create({ data });
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
