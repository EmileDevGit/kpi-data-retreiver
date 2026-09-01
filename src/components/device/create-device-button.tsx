"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createDeviceAction, type CreateDeviceFormState } from "@/lib/actions/device";
import { BUTTON_CLASS, ConfigField, DescriptionField } from "./device-card";

const INITIAL_STATE: CreateDeviceFormState = { error: null, device: null };

export function CreateDeviceButton({ machineId }: { machineId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const boundAction = createDeviceAction.bind(null, machineId);
  const [state, formAction, pending] = useActionState(boundAction, INITIAL_STATE);

  useEffect(() => {
    if (state.device) {
      setOpen(false);
      router.refresh();
    }
  }, [state.device, router]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={BUTTON_CLASS}>
        + New Device
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#F6F2E8] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A2B]">New Device</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#8A9184] hover:text-[#1E3A2B] focus:outline-none focus-visible:outline-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-3 text-sm">
              <ConfigField label="IP Address" name="ipAddress" value="" editing mono required />
              <ConfigField label="MAC Address" name="macAddress" value="" editing mono required />
              <ConfigField label="Username" name="username" value="" editing required />
              <ConfigField label="Password" name="password" value="" editing required type="password" />
              <DescriptionField value="" editing />

              {state.error && <p className="text-[#C0392B]">{state.error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className={BUTTON_CLASS} disabled={pending}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-sm font-semibold text-[#F6F2E8] bg-[#1E3A2B] rounded-lg px-3 py-1.5 hover:bg-[#1E3A2B]/90 transition-colors disabled:opacity-60 focus:outline-none focus-visible:outline-none"
                  disabled={pending}
                >
                  {pending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
