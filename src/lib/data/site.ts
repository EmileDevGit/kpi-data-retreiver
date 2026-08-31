import { prisma } from "@/lib/prisma";
import type { Prisma, Site } from "@/generated/prisma/client";

export function createSite(data: Prisma.SiteCreateInput): Promise<Site> {
  return prisma.site.create({ data });
}

export function getSite(id: string): Promise<Site | null> {
  return prisma.site.findUnique({ where: { id } });
}

export function listSites(): Promise<Site[]> {
  return prisma.site.findMany({ orderBy: { name: "asc" } });
}

// Return type left inferred: it's a Site shaped by this specific `include`,
// not the plain Site — annotating it by hand would just duplicate what
// Prisma already infers from the query itself.
export function listSitesWithMachineCount() {
  return prisma.site.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { machines: true } } },
  });
}

export function updateSite(id: string, data: Prisma.SiteUpdateInput): Promise<Site> {
  return prisma.site.update({ where: { id }, data });
}

export function deleteSite(id: string): Promise<Site> {
  return prisma.site.delete({ where: { id } });
}
