import { prisma } from "@/lib/prisma";
import type { Prisma, Device } from "@/generated/prisma/client";

export function createDevice(data: Prisma.DeviceUncheckedCreateInput): Promise<Device> {
  return prisma.device.create({ data });
}

export function getDevice(id: string): Promise<Device | null> {
  return prisma.device.findUnique({ where: { id } });
}

export function listDevicesByMachine(machineId: string): Promise<Device[]> {
  return prisma.device.findMany({ where: { machineId }, orderBy: { macAddress: "asc" } });
}

export function updateDevice(id: string, data: Prisma.DeviceUncheckedUpdateInput): Promise<Device> {
  return prisma.device.update({ where: { id }, data });
}

export function deleteDevice(id: string): Promise<Device> {
  return prisma.device.delete({ where: { id } });
}
