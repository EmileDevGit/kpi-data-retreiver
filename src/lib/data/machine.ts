import { prisma } from "@/lib/prisma";
import type { Prisma, Machine } from "@/generated/prisma/client";

export function createMachine(data: Prisma.MachineUncheckedCreateInput): Promise<Machine> {
  return prisma.machine.create({ data });
}

export function getMachine(id: string): Promise<Machine | null> {
  return prisma.machine.findUnique({ where: { id } });
}

export function listMachinesBySite(siteId: string): Promise<Machine[]> {
  return prisma.machine.findMany({ where: { siteId }, orderBy: { name: "asc" } });
}

export function listMachinesBySiteWithDeviceCount(siteId: string) {
  return prisma.machine.findMany({
    where: { siteId },
    orderBy: { name: "asc" },
    include: { _count: { select: { devices: true } } },
  });
}

export function updateMachine(id: string, data: Prisma.MachineUncheckedUpdateInput): Promise<Machine> {
  return prisma.machine.update({ where: { id }, data });
}

export function deleteMachine(id: string): Promise<Machine> {
  return prisma.machine.delete({ where: { id } });
}
