/** Runs once when the Next.js server process starts (Node runtime only). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getServices } = await import("./app/lib/services");
    const { getScheduler } = await import("./app/lib/scheduler");
    getScheduler(getServices());
  }
}
