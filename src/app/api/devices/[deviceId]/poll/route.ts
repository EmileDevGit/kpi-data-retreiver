import { NextResponse } from "next/server";
import { getDevice } from "@/lib/data/device/crud";
import { pollDevice } from "@/lib/data/device/poll";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const device = await getDevice(deviceId);
  if (!device) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  const result = await pollDevice(device);
  return NextResponse.json(result);
}
