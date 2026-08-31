import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/data/site";
import { getMachine } from "@/lib/data/machine";
import { listDevicesByMachine } from "@/lib/data/device/crud";

export const dynamic = "force-dynamic";

export default async function MachineDevicesPage({
  params,
}: {
  params: Promise<{ siteId: string; machineId: string }>;
}) {
  const { siteId, machineId } = await params;
  const [site, machine] = await Promise.all([getSite(siteId), getMachine(machineId)]);
  if (!site || !machine || machine.siteId !== siteId) notFound();

  const devices = await listDevicesByMachine(machineId);

  return (
    <div className="min-h-screen bg-[#F6F2E8] p-8 space-y-6">
      <div>
        <Link href={`/sites/${siteId}`} className="text-sm text-[#8A9184] hover:text-[#1E3A2B]">
          ← {site.name}
        </Link>
        <h1 className="text-2xl font-semibold text-[#1E3A2B] mt-1">{machine.name}</h1>
        <p className="text-sm text-[#8A9184]">
          {devices.length} device{devices.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="rounded-2xl bg-[#EDE7D9] border-l-[6px] border-[#4C8C5B] p-6 flex items-center justify-between"
          >
            <div>
              <h2 className="font-medium text-[#1E3A2B]">{device.ipAddress}</h2>
              {device.description && (
                <p className="text-sm text-[#8A9184]">{device.description}</p>
              )}
            </div>
            <span className="text-sm text-[#8A9184] font-mono">{device.macAddress}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
