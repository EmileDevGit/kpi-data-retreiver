"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateDeviceConfigAction, deleteDeviceAction, type DeviceConfigFormState } from "@/lib/actions/device";
import type { PollingStatus } from "@/generated/prisma/client";
import { STATUS_STYLES } from "@/lib/styles/status";
import type { Status } from "@/lib/types/status";
import { msToIntervalInput, formatInterval, type IntervalUnit } from "@/lib/utils/poll-interval";

type ChannelConfigInfo = {
  channelNumber: number;
  mode: number;
  signalLogicStatus: number;
  isPaused: boolean;
};

type DeviceCardInfo = {
  id: string;
  ipAddress: string;
  macAddress: string;
  username: string;
  description: string | null;
  pollIntervalMs: number;
  pollingStatus: PollingStatus;
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

const POLLING_STATUS_LABEL: Record<PollingStatus, string> = {
  active: "Active",
  stopped: "Stopped",
  error: "Error",
};

// active: green, stopped: grey, error: red — reuses the same good/neutral/bad
// palette as the device debug panel so status color means the same thing everywhere.
export const POLLING_STATUS_TO_STATUS: Record<PollingStatus, Status> = {
  active: "good",
  stopped: "neutral",
  error: "bad",
};

// "error" is scheduler-managed (set after repeated poll failures) and isn't
// offered as a choice — picking either option here is how a user takes a
// device out of error state.
export function PollingStatusField({ label, name, value, editing }: { label: string; name: string; value: PollingStatus; editing: boolean }) {
  const editDefault: Extract<PollingStatus, "active" | "stopped"> = value === "stopped" ? "stopped" : "active";
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={editing ? name : undefined} className="text-[#8A9184] shrink-0">
        {label}
      </label>
      {editing ? (
        <select
          id={name}
          name={name}
          defaultValue={editDefault}
          className="box-border w-56 rounded-lg border border-[#8A9184]/40 bg-[#F6F2E8] px-2 py-1 text-right leading-5 text-[#1E3A2B] outline-none focus:outline-none focus-visible:outline-none focus:border-[#4C8C5B]"
        >
          <option value="active">Active</option>
          <option value="stopped">Stopped</option>
        </select>
      ) : (
        <span className={`box-border w-56 truncate rounded-lg border border-transparent px-2 py-1 text-right leading-5 font-medium ${STATUS_STYLES[POLLING_STATUS_TO_STATUS[value]].text}`}>
          {POLLING_STATUS_LABEL[value]}
        </span>
      )}
    </div>
  );
}

export function IntervalField({ label, name, valueMs, editing }: { label: string; name: string; valueMs: number; editing: boolean }) {
  const { value, unit } = msToIntervalInput(valueMs);
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={editing ? `${name}Value` : undefined} className="text-[#8A9184] shrink-0">
        {label}
      </label>
      {editing ? (
        <div className="flex w-56 gap-2">
          <input
            id={`${name}Value`}
            name={`${name}Value`}
            type="number"
            min={1}
            step="any"
            defaultValue={value}
            required
            className="box-border w-full rounded-lg border border-[#8A9184]/40 bg-[#F6F2E8] px-2 py-1 text-right leading-5 text-[#1E3A2B] outline-none focus:outline-none focus-visible:outline-none focus:border-[#4C8C5B]"
          />
          <select
            name={`${name}Unit`}
            defaultValue={unit satisfies IntervalUnit}
            className="box-border rounded-lg border border-[#8A9184]/40 bg-[#F6F2E8] px-2 py-1 leading-5 text-[#1E3A2B] outline-none focus:outline-none focus-visible:outline-none focus:border-[#4C8C5B]"
          >
            <option value="seconds">sec</option>
            <option value="minutes">min</option>
          </select>
        </div>
      ) : (
        <span className="box-border w-56 truncate rounded-lg border border-transparent px-2 py-1 text-right leading-5 text-[#1E3A2B]">
          {formatInterval(valueMs)}
        </span>
      )}
    </div>
  );
}

export function ChannelStateTable({ channelConfigs }: { channelConfigs: ChannelConfigInfo[] }) {
  return (
    <div className="space-y-1">
      <p className="text-[#8A9184]">Channels</p>
      {channelConfigs.length === 0 ? (
        <p className="text-[#1E3A2B]">No channels configured yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#8A9184]/40">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#E4DDC9] text-[#1E3A2B]">
                <th className="px-2 py-1 text-left font-medium">Ch</th>
                <th className="px-2 py-1 text-left font-medium">Mode</th>
                <th className="px-2 py-1 text-left font-medium">Signal Logic</th>
                <th className="px-2 py-1 text-left font-medium">Paused</th>
              </tr>
            </thead>
            <tbody>
              {channelConfigs.map((c) => (
                <tr key={c.channelNumber} className="border-t border-[#8A9184]/20 text-[#1E3A2B]">
                  <td className="px-2 py-1">{c.channelNumber}</td>
                  <td className="px-2 py-1">{c.mode}</td>
                  <td className="px-2 py-1">{c.signalLogicStatus}</td>
                  <td className={`px-2 py-1 ${c.isPaused ? STATUS_STYLES.bad.text : ""}`}>{c.isPaused ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  channelConfigs,
  siteId,
  machineId,
}: {
  device: DeviceCardInfo;
  channelConfigs: ChannelConfigInfo[];
  siteId: string;
  machineId: string;
}) {
  const [device, setDevice] = useState(initialDevice);
  const [expanded, setExpanded] = useState(false);
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

  const statusStyle = STATUS_STYLES[POLLING_STATUS_TO_STATUS[device.pollingStatus]];

  return (
    <div className={`rounded-2xl bg-[#EDE7D9] border-l-[6px] ${statusStyle.border} overflow-hidden`}>
      <div className="p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-[#1E3A2B]">{device.ipAddress}</h2>
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            </span>
          </div>
          {device.description && (
            <p className="text-sm text-[#8A9184]">{device.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/sites/${siteId}/${machineId}/${device.id}`} className={BUTTON_CLASS}>
              Debug
            </Link>
            <button
              type="button"
              onClick={() =>
                setExpanded((v) => {
                  if (v) {
                    setEditing(false);
                    setConfirmingDelete(false);
                  }
                  return !v;
                })
              }
              className={BUTTON_CLASS}
            >
              {expanded ? "Hide" : "Config"}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#8A9184]/30 p-6">
          <form action={formAction} className="space-y-3 text-sm">
            <ConfigField label="IP Address" name="ipAddress" value={device.ipAddress} editing={editing} mono required />
            <ConfigField label="MAC Address" name="macAddress" value={device.macAddress} editing={editing} mono required />
            <ConfigField label="Username" name="username" value={device.username} editing={editing} required />
            <DescriptionField value={device.description ?? ""} editing={editing} />
            <IntervalField label="Polling rate" name="pollInterval" valueMs={device.pollIntervalMs} editing={editing} />
            <PollingStatusField label="Polling" name="pollingStatus" value={device.pollingStatus} editing={editing} />
            <ChannelStateTable channelConfigs={channelConfigs} />
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
      )}
    </div>
  );
}
