"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateDeviceConfigAction, deleteDeviceAction, type DeviceConfigFormState } from "@/lib/actions/device";

type DeviceCardInfo = {
  id: string;
  ipAddress: string;
  macAddress: string;
  username: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const BUTTON_CLASS =
  "text-sm font-semibold text-[#1E3A2B] border border-[#8A9184]/40 rounded-lg px-3 py-1.5 hover:bg-[#E4DDC9] transition-colors focus:outline-none focus-visible:outline-none";

const DANGER_BUTTON_CLASS =
  "text-sm font-semibold text-[#C0392B] border border-[#C0392B]/40 rounded-lg px-3 py-1.5 hover:bg-[#C0392B]/10 transition-colors focus:outline-none focus-visible:outline-none disabled:opacity-60";

const INITIAL_FORM_STATE: DeviceConfigFormState = { error: null, device: null };

export function ConfigField({
  label,
  name,
  value,
  editing,
  mono,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  editing: boolean;
  mono?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={editing ? name : undefined} className="text-[#8A9184] shrink-0">
        {label}
      </label>
      {editing ? (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          className={`box-border w-56 rounded-lg border border-[#8A9184]/40 bg-[#F6F2E8] px-2 py-1 text-right leading-5 text-[#1E3A2B] outline-none focus:outline-none focus-visible:outline-none focus:border-[#4C8C5B] ${mono ? "font-mono" : ""}`}
        />
      ) : (
        <span
          className={`box-border w-56 truncate rounded-lg border border-transparent px-2 py-1 text-right leading-5 text-[#1E3A2B] ${mono ? "font-mono" : ""}`}
        >
          {value || "—"}
        </span>
      )}
    </div>
  );
}

export function DescriptionField({ value, editing }: { value: string; editing: boolean }) {
  return (
    <div className="space-y-1">
      <label htmlFor={editing ? "description" : undefined} className="text-[#8A9184]">
        Description
      </label>
      {editing ? (
        <textarea
          id="description"
          name="description"
          defaultValue={value}
          rows={3}
          className="box-border min-h-[4.5rem] w-full resize-none rounded-lg border border-[#8A9184]/40 bg-[#F6F2E8] px-2 py-1.5 leading-5 text-[#1E3A2B] outline-none focus:outline-none focus-visible:outline-none focus:border-[#4C8C5B]"
        />
      ) : (
        <p className="box-border min-h-[4.5rem] w-full whitespace-pre-wrap rounded-lg border border-transparent px-2 py-1.5 leading-5 text-[#1E3A2B]">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

export function DeviceCard({
  device: initialDevice,
  siteId,
  machineId,
}: {
  device: DeviceCardInfo;
  siteId: string;
  machineId: string;
}) {
  const [device, setDevice] = useState(initialDevice);
  const [showConfig, setShowConfig] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  const boundAction = updateDeviceConfigAction.bind(null, device.id);
  const [state, formAction, pending] = useActionState(boundAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.device) {
      setDevice((d) => ({ ...d, ...state.device }));
      setEditing(false);
    }
  }, [state.device]);

  useEffect(() => {
    if (!showConfig) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowConfig(false);
        setEditing(false);
        setConfirmingDelete(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfig]);

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteDeviceAction(device.id);
      if (result.error) {
        setDeleteError(result.error);
        setConfirmingDelete(false);
        return;
      }
      setDeleted(true);
      router.refresh();
    });
  }

  if (deleted) return null;

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
          onClick={() => {
            setShowConfig(false);
            setEditing(false);
            setConfirmingDelete(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#F6F2E8] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A2B]">Device Config</h2>
              <button
                type="button"
                onClick={() => {
                  setShowConfig(false);
                  setEditing(false);
                  setConfirmingDelete(false);
                }}
                className="text-[#8A9184] hover:text-[#1E3A2B] focus:outline-none focus-visible:outline-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-3 text-sm">
              <ConfigField label="IP Address" name="ipAddress" value={device.ipAddress} editing={editing} mono required />
              <ConfigField label="MAC Address" name="macAddress" value={device.macAddress} editing={editing} mono required />
              <ConfigField label="Username" name="username" value={device.username} editing={editing} required />
              <DescriptionField value={device.description ?? ""} editing={editing} />
              <ConfigField label="Created" name="createdAt" value={new Date(device.createdAt).toLocaleString()} editing={false} />
              <ConfigField label="Updated" name="updatedAt" value={new Date(device.updatedAt).toLocaleString()} editing={false} />

              {state.error && <p className="text-[#C0392B]">{state.error}</p>}
              {deleteError && <p className="text-[#C0392B]">{deleteError}</p>}

              {confirmingDelete ? (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-[#C0392B]">Delete this device? This can&apos;t be undone.</p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className={BUTTON_CLASS}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className={DANGER_BUTTON_CLASS}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting…" : "Confirm Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-2 pt-2">
                  {!editing && (
                    <button type="button" onClick={() => setConfirmingDelete(true)} className={DANGER_BUTTON_CLASS}>
                      Delete
                    </button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className={BUTTON_CLASS}
                          disabled={pending}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="text-sm font-semibold text-[#F6F2E8] bg-[#1E3A2B] rounded-lg px-3 py-1.5 hover:bg-[#1E3A2B]/90 transition-colors disabled:opacity-60 focus:outline-none focus-visible:outline-none"
                          disabled={pending}
                        >
                          {pending ? "Saving…" : "Save"}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setEditing(true)} className={BUTTON_CLASS}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
