import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/data/site";
import { getMachine } from "@/lib/data/machine";
import { getDevice } from "@/lib/data/device/crud";
import { DeviceDebugPanel } from "@/components/device/device-debug-panel";

export const dynamic = "force-dynamic";

export default async function DeviceDebugPage({
  params,
}: {
  params: Promise<{ siteId: string; machineId: string; deviceId: string }>;
}) {
  const { siteId, machineId, deviceId } = await params;
  const [site, machine, device] = await Promise.all([
    getSite(siteId),
    getMachine(machineId),
    getDevice(deviceId),
  ]);
  if (
    !site ||
    !machine ||
    !device ||
    machine.siteId !== siteId ||
    device.machineId !== machineId
  ) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F6F2E8] p-8 space-y-6">
      <div>
        <Link href={`/sites/${siteId}/${machineId}`} className="text-sm text-[#8A9184] hover:text-[#1E3A2B]">
          ← {machine.name}
        </Link>
        <h1 className="text-2xl font-semibold text-[#1E3A2B] mt-1">{device.ipAddress}</h1>
        <p className="text-sm text-[#8A9184] font-mono">{device.macAddress}</p>
      </div>

      <DeviceDebugPanel deviceId={device.id} deviceLabel={device.description ?? device.ipAddress} />
    </div>
  );
}
