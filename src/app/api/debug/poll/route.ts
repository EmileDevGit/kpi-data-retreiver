import { NextResponse } from "next/server";
import { pollDevice } from "@/lib/data/device/poll";

export async function GET() {
  const result = await pollDevice();
  return NextResponse.json(result);
}
