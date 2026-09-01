export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.POLLING_ENABLED === "true") {
    const { initializePolling } = await import("@/lib/polling/scheduler");
    await initializePolling();
  }
}
