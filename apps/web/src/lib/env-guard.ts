export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const USE_MOCKS =
  (process.env.NEXT_PUBLIC_USE_MOCKS ?? "false").toLowerCase() === "true";

export function logEnvHealthOnce() {
  if (typeof window === "undefined") return;
  if ((window as any).__envHealthLogged) return;
  (window as any).__envHealthLogged = true;

  const api = API_URL;
  if (!api) {
    // eslint-disable-next-line no-console
    console.warn("⚠️ NEXT_PUBLIC_API_URL missing — using localhost:8000");
  }
  setTimeout(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    fetch(api.replace(/\/$/, "") + "/status", { signal: ctrl.signal })
      .then(r => r.ok ? "ok" : `${r.status} ${r.statusText}`)
      .then(msg => console.log("✅ API health:", api, msg))
      .catch(e => console.error("❌ API health failed:", api, e))
      .finally(() => clearTimeout(t));
  }, 1000);
}
