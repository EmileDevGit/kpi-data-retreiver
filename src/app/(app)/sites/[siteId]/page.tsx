import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/data/site";
import { listMachinesBySiteWithDeviceCount } from "@/lib/data/machine";

export const dynamic = "force-dynamic";

export default async function SiteMachinesPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = await getSite(siteId);
  if (!site) notFound();

  const machines = await listMachinesBySiteWithDeviceCount(siteId);

  return (
    <div className="min-h-screen bg-[#F6F2E8] p-8 space-y-6">
      <div>
        <Link href="/sites" className="text-sm text-[#8A9184] hover:text-[#1E3A2B]">
          ← Sites
        </Link>
        <h1 className="text-2xl font-semibold text-[#1E3A2B] mt-1">{site.name}</h1>
        <p className="text-sm text-[#8A9184]">
          {machines.length} machine{machines.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-3">
        {machines.map((machine) => (
          <Link
            key={machine.id}
            href={`/sites/${siteId}/${machine.id}`}
            className="rounded-2xl bg-[#EDE7D9] border-l-[6px] border-[#4C8C5B] p-6 flex items-center justify-between transition-colors hover:bg-[#E4DDC9]"
          >
            <h2 className="font-medium text-[#1E3A2B]">{machine.name}</h2>
            <span className="text-sm text-[#8A9184]">
              {machine._count.devices} device{machine._count.devices === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
