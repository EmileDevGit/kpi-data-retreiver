"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_STYLES } from "@/lib/styles/status";
import type { Status } from "@/lib/types/status";
import type { DevicePollResult } from "@/lib/types/device.ts";

const POLL_INTERVAL_MS = 3000;
const HISTORY_LIMIT = 20;

export default function DebugPage() {
  const [latest, setLatest] = useState<DevicePollResult | null>(null);
  const [history, setHistory] = useState<DevicePollResult[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/debug/poll", { cache: "no-store" });
        const data: DevicePollResult = await res.json();
        if (cancelled) return;
        setLatest(data);
        setPollCount((c) => c + 1);
        setHistory((prev) => [data, ...prev].slice(0, HISTORY_LIMIT));
      } catch {
        if (cancelled) return;
        setLatest({
          connected: false,
          latencyMs: null,
          error: "Failed to reach polling route",
          diValue: null,
          logMessages: null,
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // No poll resolved yet -> neutral. Otherwise good/bad from connected flag.
  const status: Status = latest === null ? "neutral" : latest.connected ? "good" : "bad";
  const styles = STATUS_STYLES[status];

  return (
    <div className="min-h-screen bg-[#F6F2E8] p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A2B]">Device Debug</h1>
        <p className="text-sm text-[#8A9184]">
          Polling WISE-4050 every {POLL_INTERVAL_MS / 1000}s — {pollCount} polls so far
        </p>
      </div>

      <div className={`rounded-2xl bg-[#EDE7D9] border-l-[6px] ${styles.border} p-6 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
          <span className={`font-medium ${styles.text}`}>{styles.label}</span>
        </div>
        <div className="text-sm text-[#8A9184] flex gap-4">
          <span>Latency: {latest?.latencyMs != null ? `${latest.latencyMs}ms` : "—"}</span>
          <span>Last poll: {latest ? new Date(latest.fetchedAt).toLocaleTimeString() : "—"}</span>
        </div>
      </div>

      {latest?.error && (
        <div className={`rounded-2xl bg-[#EDE7D9] border-l-[6px] ${STATUS_STYLES.bad.border} p-6`}>
          <p className={`${STATUS_STYLES.bad.text} font-medium`}>Error</p>
          <p className="text-sm text-[#1E3A2B] mt-1">{latest.error}</p>
        </div>
      )}

      <div className={`rounded-2xl bg-[#EDE7D9] border-l-[6px] ${STATUS_STYLES.neutral.border} p-6`}>
        <h2 className="font-medium text-[#1E3A2B] mb-3">Raw: /di_value/slot_0</h2>
        <pre className="text-xs bg-[#F6F2E8] rounded-lg p-4 overflow-x-auto text-[#1E3A2B]">
          {JSON.stringify(latest?.diValue ?? null, null, 2)}
        </pre>
      </div>

      <div className={`rounded-2xl bg-[#EDE7D9] border-l-[6px] ${STATUS_STYLES.neutral.border} p-6`}>
        <h2 className="font-medium text-[#1E3A2B] mb-3">Raw: /log_message</h2>
        <pre className="text-xs bg-[#F6F2E8] rounded-lg p-4 overflow-x-auto text-[#1E3A2B] max-h-96 overflow-y-auto">
          {JSON.stringify(latest?.logMessages ?? null, null, 2)}
        </pre>
      </div>

      <div className={`rounded-2xl bg-[#EDE7D9] border-l-[6px] ${STATUS_STYLES.neutral.border} p-6`}>
        <h2 className="font-medium text-[#1E3A2B] mb-3">Poll history (last {HISTORY_LIMIT})</h2>
        <div className="space-y-1 text-xs font-mono">
          {history.map((h, i) => (
            <div key={i} className="flex gap-4 text-[#1E3A2B]">
              <span className="text-[#8A9184]">{new Date(h.fetchedAt).toLocaleTimeString()}</span>
              <span className={h.connected ? STATUS_STYLES.good.text : STATUS_STYLES.bad.text}>
                {h.connected ? "OK" : "FAIL"}
              </span>
              <span>{h.latencyMs != null ? `${h.latencyMs}ms` : "—"}</span>
              <span>{h.error ?? ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
