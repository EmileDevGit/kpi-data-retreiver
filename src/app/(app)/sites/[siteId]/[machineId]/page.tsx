import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/data/site";
import { getMachine } from "@/lib/data/machine";
import { listDevicesByMachine } from "@/lib/data/device/crud";
import { DeviceCard } from "@/components/device/device-card";
import { CreateDeviceButton } from "@/components/device/create-device-button";

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
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/sites/${siteId}`} className="text-sm text-[#8A9184] hover:text-[#1E3A2B]">
            ← {site.name}
          </Link>
          <h1 className="text-2xl font-semibold text-[#1E3A2B] mt-1">{machine.name}</h1>
          <p className="text-sm text-[#8A9184]">
            {devices.length} device{devices.length === 1 ? "" : "s"}
          </p>
        </div>
        <CreateDeviceButton machineId={machineId} />
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            siteId={siteId}
            machineId={machineId}
            device={{
              id: device.id,
              ipAddress: device.ipAddress,
              macAddress: device.macAddress,
              username: device.username,
              description: device.description,
              createdAt: device.createdAt,
              updatedAt: device.updatedAt,
            }}
          />
        ))}
      </div>
    </div>
  );
}
