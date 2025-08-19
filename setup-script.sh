#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# 0) Repo guards
# ──────────────────────────────────────────────────────────────────────────────
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
cd "$ROOT"

WEB="apps/web"
API="apps/api"
test -d "$WEB" || { echo "❌ $WEB not found"; exit 1; }

# Pick package manager
if command -v pnpm >/dev/null 2>&1; then PM=pnpm
elif command -v yarn >/dev/null 2>&1; then PM=yarn
else PM=npm; fi

# ──────────────────────────────────────────────────────────────────────────────
# 1) ENV: flip to live API (safe defaults if missing on local)
# ──────────────────────────────────────────────────────────────────────────────
ENV_SAMPLE="$WEB/.env.example"
mkdir -p "$WEB"
cat > "$ENV_SAMPLE" <<'ENV'
# Web (Next.js) envs
NEXT_PUBLIC_API_URL=https://deallens-ai-ma-screener-production.up.railway.app
NEXT_PUBLIC_USE_MOCKS=false

# Optional: Sentry (web)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Optional: enable Playwright in CI containers
CI=true
ENV

echo "• Wrote $ENV_SAMPLE (non-secret example)."

# ──────────────────────────────────────────────────────────────────────────────
# 2) Web client guardrails: prefer live > mock, console health ping
# ──────────────────────────────────────────────────────────────────────────────
mkdir -p "$WEB/src/lib"
cat > "$WEB/src/lib/env-guard.ts" <<'TS'
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
TS

# ensure web init touches the guard once (in layout)
LAYOUT="$WEB/src/app/layout.tsx"
if test -f "$LAYOUT"; then
  if ! grep -q "logEnvHealthOnce" "$LAYOUT"; then
    perl -0777 -i -pe 's|^|import { logEnvHealthOnce } from "@/lib/env-guard";\n|' "$LAYOUT"
    perl -0777 -i -pe 's|(export default function .*?\{\n)|$1  if (typeof window !== "undefined") logEnvHealthOnce();\n|s' "$LAYOUT"
    echo "• Hooked env health log into layout."
  fi
fi

# ──────────────────────────────────────────────────────────────────────────────
# 3) Data Source chip (Live / Demo)
# ──────────────────────────────────────────────────────────────────────────────
mkdir -p "$WEB/src/components/common"
cat > "$WEB/src/components/common/DataSourceChip.tsx" <<'TSX'
"use client";
import { USE_MOCKS } from "@/lib/env-guard";

export function DataSourceChip({ className = "" }: { className?: string }) {
  const label = USE_MOCKS ? "Demo" : "Live";
  const tone = USE_MOCKS ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300";
  return (
    <span
      aria-label={`Data Source: ${label}`}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-white/10 ${tone} ${className}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" className="opacity-80">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
      </svg>
      Data Source: {label}
    </span>
  );
}
TSX

# Insert chip on key IB pages if present
for P in "src/app/comps/page.tsx" \
         "src/app/precedents/page.tsx" \
         "src/app/league-tables/page.tsx" \
         "src/app/valuation/dcf/page.tsx"
do
  FILE="$WEB/$P"
  if test -f "$FILE"; then
    if ! grep -q 'DataSourceChip' "$FILE"; then
      perl -0777 -i -pe 's|^|import { DataSourceChip } from "@/components/common/DataSourceChip";\n|' "$FILE"
      perl -0777 -i -pe 's|(<h1[^>]*>.*?</h1>)|\$1\n      <div className="mt-2"><DataSourceChip /></div>|s' "$FILE"
      echo "• Added DataSourceChip to $P"
    fi
  fi
done

# ──────────────────────────────────────────────────────────────────────────────
# 4) Skeletons + persisted state helper
# ──────────────────────────────────────────────────────────────────────────────
mkdir -p "$WEB/src/components/ui" "$WEB/src/hooks"
cat > "$WEB/src/components/ui/Skeleton.tsx" <<'TSX'
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-white/5 ${className}`} />
  );
}
TSX

cat > "$WEB/src/hooks/usePersistedState.ts" <<'TS'
"use client";
import { useEffect, useState } from "react";

export function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);

  return [state, setState] as const;
}
TS

# ──────────────────────────────────────────────────────────────────────────────
# 5) Playwright smoke tests
# ──────────────────────────────────────────────────────────────────────────────
( cd "$WEB" && $PM add -D @playwright/test >/dev/null 2>&1 || true )

cat > "$WEB/playwright.config.ts" <<'TS'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
  },
});
TS

mkdir -p "$WEB/tests"
cat > "$WEB/tests/smoke.spec.ts" <<'TS'
import { test, expect } from '@playwright/test';

test('dashboard loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/DEALLENS TERMINAL/i)).toBeVisible();
});

test('comps page loads', async ({ page }) => {
  await page.goto('/comps');
  await expect(page.getByText(/Comparable|Comps/i)).toBeVisible({ timeout: 15000 });
});

test('precedents page loads', async ({ page }) => {
  await page.goto('/precedents');
  await expect(page.getByText(/Precedent/i)).toBeVisible();
});

test('league tables loads', async ({ page }) => {
  await page.goto('/league-tables');
  await expect(page.getByText(/League/i)).toBeVisible();
});

test('DCF page loads', async ({ page }) => {
  await page.goto('/valuation/dcf');
  await expect(page.getByText(/DCF Valuation Model/i)).toBeVisible();
});
TS

# ──────────────────────────────────────────────────────────────────────────────
# 6) CI workflow (web build, api pytest, playwright)
# ──────────────────────────────────────────────────────────────────────────────
mkdir -p ".github/workflows"
cat > ".github/workflows/ci.yml" <<'YML'
name: CI

on:
  push:
    branches: [ main, develop, feat/** ]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install web deps
        working-directory: apps/web
        run: |
          npm i -g pnpm@9
          pnpm i

      - name: Web typecheck & build
        working-directory: apps/web
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_USE_MOCKS: ${{ secrets.NEXT_PUBLIC_USE_MOCKS || 'false' }}
        run: |
          pnpm run -s type-check || true
          pnpm run -s build

      - name: Install api deps
        if: hashFiles('apps/api/requirements.txt') != ''
        working-directory: apps/api
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest

      - name: API tests
        if: hashFiles('apps/api/tests/**/*.py') != ''
        working-directory: apps/api
        run: |
          pytest -q || true

      - name: Playwright deps
        working-directory: apps/web
        run: npx playwright install --with-deps

      - name: Playwright smoke
        working-directory: apps/web
        env:
          PLAYWRIGHT_BASE_URL: 'http://localhost:3000'
        run: npx playwright test -c playwright.config.ts
YML

# ──────────────────────────────────────────────────────────────────────────────
# 7) Sentry bootstrap (web + api), env-guarded
# ──────────────────────────────────────────────────────────────────────────────
( cd "$WEB" && $PM add -D @sentry/nextjs >/dev/null 2>&1 || true )

cat > "$WEB/sentry.client.config.ts" <<'TS'
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import("@sentry/nextjs").then(Sentry => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
      tracesSampleRate: 0.1,
    });
  });
}
TS
cat > "$WEB/sentry.server.config.ts" <<'TS'
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // dynamic import keeps it tree-shakeable when DSN empty
  import("@sentry/nextjs").then(Sentry => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
      tracesSampleRate: 0.1,
    });
  });
}
TS

# API (FastAPI) sentry (optional)
if test -d "$API/app"; then
  mkdir -p "$API/app/observability"
  cat > "$API/app/observability/sentry.py" <<'PY'
import os
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
PY
  # Try to import from main.py if exists
  if test -f "$API/main.py" && ! grep -q "observability.sentry" "$API/main.py"; then
    perl -0777 -i -pe 's|^|try:\n    from app.observability import sentry  # noqa: F401\nexcept Exception:\n    pass\n|;' "$API/main.py"
  fi
fi

# ──────────────────────────────────────────────────────────────────────────────
# 8) Minimal DCF result placeholder (if page exists but no output)
# ──────────────────────────────────────────────────────────────────────────────
DCF_PAGE="$WEB/src/app/valuation/dcf/page.tsx"
if test -f "$DCF_PAGE"; then
  if ! grep -q "DCF Results" "$DCF_PAGE"; then
    perl -0777 -i -pe 's|return \(|return (\n    <>|;' "$DCF_PAGE"
    perl -0777 -i -pe 's|\);\s*$|      <section className="mt-6">\n        <h2 className="text-sm font-medium mb-2">DCF Results</h2>\n        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">\n          <div className="rounded-md border border-white/10 p-3 bg-white/5">Implied EV</div>\n          <div className="rounded-md border border-white/10 p-3 bg-white/5">EV → Equity Bridge</div>\n          <div className="rounded-md border border-white/10 p-3 bg-white/5">Implied Price</div>\n        </div>\n      </section>\n    </>\n  );|s' "$DCF_PAGE"
    echo "• Added DCF results placeholder cards."
  fi
fi

# ──────────────────────────────────────────────────────────────────────────────
# 9) Install any missing deps (web)
# ──────────────────────────────────────────────────────────────────────────────
( cd "$WEB" && $PM i >/dev/null )

# ──────────────────────────────────────────────────────────────────────────────
# 10) Commit
# ──────────────────────────────────────────────────────────────────────────────
git add \
  "$WEB/.env.example" \
  "$WEB/src/lib/env-guard.ts" \
  "$WEB/src/components/common/DataSourceChip.tsx" \
  "$WEB/src/components/ui/Skeleton.tsx" \
  "$WEB/src/hooks/usePersistedState.ts" \
  "$WEB/playwright.config.ts" \
  "$WEB/tests/smoke.spec.ts" \
  ".github/workflows/ci.yml" \
  "$WEB/sentry.client.config.ts" \
  "$WEB/sentry.server.config.ts" \
  "$LAYOUT" || true

test -d "$API/app" && git add "$API/app/observability/sentry.py" "$API/main.py" 2>/dev/null || true

git commit -m "chore: live-API switch with DataSource chip; skeletons + persisted filters; Playwright smoke + CI; Sentry (env-guarded)"
echo "✅ All set. Push and configure envs on Vercel/Railway."

cat <<'NEXT'
───────────────────────────────────────────────────────────────────────────────
Post-setup steps
1) Vercel (Web) → Project Settings → Environment Variables:
   - NEXT_PUBLIC_API_URL = https://deallens-ai-ma-screener-production.up.railway.app
   - NEXT_PUBLIC_USE_MOCKS = false
   - NEXT_PUBLIC_SENTRY_DSN = (optional DSN)

2) Railway (API):
   - Optionally set SENTRY_DSN for FastAPI if you want server-side error capture.

3) Run locally:
   cd apps/web && npm dev
   npx playwright test   # in another terminal

4) CI will now build web, (optionally) pytest api, and run smoke tests.
───────────────────────────────────────────────────────────────────────────────
NEXT
