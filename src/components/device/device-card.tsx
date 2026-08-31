"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DeviceCardInfo = {
  id: string;
  ipAddress: string;
  macAddress: string;
  username: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const BUTTON_CLASS =
  "text-sm font-semibold text-[#1E3A2B] border border-[#8A9184]/40 rounded-lg px-3 py-1.5 hover:bg-[#E4DDC9] transition-colors";

export function DeviceCard({
  device,
  siteId,
  machineId,
}: {
  device: DeviceCardInfo;
  siteId: string;
  machineId: string;
}) {
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (!showConfig) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowConfig(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfig]);

  return (
    <>
      <div className="rounded-2xl bg-[#EDE7D9] border-l-[6px] border-[#4C8C5B] p-6 flex items-center justify-between">
        <div>
          <h2 className="font-medium text-[#1E3A2B]">{device.ipAddress}</h2>
          {device.description && (
            <p className="text-sm text-[#8A9184]">{device.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8A9184] font-mono">{device.macAddress}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowConfig(true)} className={BUTTON_CLASS}>
              Config
            </button>
            <Link href={`/sites/${siteId}/${machineId}/${device.id}`} className={BUTTON_CLASS}>
              Debug
            </Link>
          </div>
        </div>
      </div>

      {showConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowConfig(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#F6F2E8] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A2B]">Device Config</h2>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-[#8A9184] hover:text-[#1E3A2B]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#8A9184]">IP Address</dt>
                <dd className="font-mono text-[#1E3A2B]">{device.ipAddress}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8A9184]">MAC Address</dt>
                <dd className="font-mono text-[#1E3A2B]">{device.macAddress}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8A9184]">Username</dt>
                <dd className="text-[#1E3A2B]">{device.username}</dd>
              </div>
              {device.description && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8A9184]">Description</dt>
                  <dd className="text-[#1E3A2B] text-right">{device.description}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-[#8A9184]">Created</dt>
                <dd className="text-[#1E3A2B]">{new Date(device.createdAt).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8A9184]">Updated</dt>
                <dd className="text-[#1E3A2B]">{new Date(device.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
