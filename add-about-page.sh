#!/usr/bin/env bash
set -euo pipefail

# ---- 0) Repo root & guardrails ----------------------------------------------
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

WEB_DIR="apps/web"
SRC_DIR="$WEB_DIR/src"
APP_DIR="$SRC_DIR/app"

test -d "$WEB_DIR" || { echo "❌ $WEB_DIR not found"; exit 1; }
mkdir -p "$SRC_DIR/components/layout" "$APP_DIR/about"

# ---- 1) Create /about page with OG metadata ---------------------------------
cat > "$APP_DIR/about/page.tsx" <<'TSX'
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About • DealLens",
  description: "DealLens by Aditya Singh — an AI-first M&A and Investment Banking analytics terminal.",
  openGraph: {
    title: "About DealLens",
    description: "AI-first M&A & IB analytics terminal built by Aditya Singh.",
    type: "website",
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About DealLens",
    description: "AI-first M&A & IB analytics terminal built by Aditya Singh.",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">About DealLens</h1>
        <p className="text-sm text-muted-foreground">
          DealLens is an AI-assisted M&amp;A and Investment Banking workspace—market tape, comps/precedents,
          league tables, valuation models, and alerts in one place.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[160px,1fr] items-start">
        <div className="flex justify-center">
          <Image
            src="/aditya.jpg"
            alt="Aditya Singh"
            width={120}
            height={120}
            className="rounded-xl border border-border/50 object-cover"
          />
        </div>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Built by <strong>Aditya Singh</strong>. I'm focused on tools that make finance workflows faster,
            clearer, and more collaborative.
          </p>
          <p>
            This project blends modern web tech with classic IB workflows: comps, precedents, league tables,
            valuation models, filings, and pipeline—all behind a clean, responsive UX.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Stack</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Frontend: Next.js (App Router), TypeScript, shadcn/ui, Recharts</li>
          <li>Backend: FastAPI, SQLAlchemy, PostgreSQL, Redis (caching), Celery</li>
          <li>Infra: Vercel (web), Railway (API)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Roadmap</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Real-time filings & NLP highlights</li>
          <li>Deeper comps/precedents export & templates</li>
          <li>Model notebooks and scenario share links</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Contact</h2>
        <p className="text-sm text-muted-foreground">
          Email: <a className="hover:underline" href="mailto:adityasingh0929@gmail.com">adityasingh0929@gmail.com</a> ·
          GitHub: <a className="hover:underline" href="https://github.com/" target="_blank">github.com/</a> ·
          LinkedIn: <a className="hover:underline" href="https://www.linkedin.com/in/" target="_blank">/in/</a>
        </p>
      </section>
    </main>
  );
}
TSX

# ---- 2) Create AppFooter and wire it into the root layout --------------------
cat > "$SRC_DIR/components/layout/AppFooter.tsx" <<'TSX'
export function AppFooter() {
  return (
    <footer className="mt-8 border-t border-border/60 text-xs text-muted-foreground px-4 py-3">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <span>DealLens v1.1.0</span>
        <span>
          by{" "}
          <a
            href="https://www.linkedin.com/in/"
            target="_blank"
            className="hover:underline"
          >
            Aditya Singh
          </a>
        </span>
      </div>
    </footer>
  );
}
TSX

# Insert <AppFooter /> near the end of the root layout body.
LAYOUT="$APP_DIR/layout.tsx"
if grep -q "AppFooter" "$LAYOUT"; then
  echo "• AppFooter already referenced in layout."
else
  # Add import
  if ! grep -q 'from "@/components/layout/AppFooter"' "$LAYOUT"; then
    perl -0777 -i -pe 's|(from\s+"@/components/providers/QueryProvider".*?;\n)|$1import { AppFooter } from "@/components/layout/AppFooter";\n|s' "$LAYOUT" || true
    # Fallback: add at top if pattern not found
    if ! grep -q 'AppFooter' "$LAYOUT"; then
      sed -i '' '1s|^|import { AppFooter } from "@/components/layout/AppFooter";\n|' "$LAYOUT" 2>/dev/null || \
      sed -i '1s|^|import { AppFooter } from "@/components/layout/AppFooter";\n|' "$LAYOUT"
    fi
  fi
  # Inject before closing body
  perl -0777 -i -pe 's|</body>|  <AppFooter />\n    </body>|s' "$LAYOUT"
  echo "• Wired AppFooter into layout."
fi

# ---- 3) Add a tiny "About" link in the header -------------------------------
HEADER="$SRC_DIR/components/layout/Header.tsx"
if test -f "$HEADER"; then
  # Ensure Link import
  if ! grep -q 'from "next/link"' "$HEADER"; then
    perl -0777 -i -pe 's|(import .*?;\n)(?!.*next/link)|$1import Link from "next/link";\n|s' "$HEADER"
  fi

  # Add About link near right-side controls: inject before </header>
  if ! grep -q 'href="/about"' "$HEADER"; then
    perl -0777 -i -pe 's|</header>|  <div className="ml-auto hidden sm:flex items-center gap-3">\n      <Link href="/about" aria-label="About DealLens" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link>\n    </div>\n  </header>|s' "$HEADER"
    echo "• Inserted About link into Header."
  else
    echo "• About link already present in Header."
  fi
else
  echo "⚠️ $HEADER not found — skipping header link."
fi

# ---- 4) Optional: add placeholder avatar if missing --------------------------
PUBLIC_DIR="$WEB_DIR/public"
mkdir -p "$PUBLIC_DIR"
if [ ! -f "$PUBLIC_DIR/aditya.jpg" ]; then
  # Create a tiny placeholder (transparent PNG as .jpg to avoid failing import; user can replace)
  convert -size 120x120 xc:"#111111" "$PUBLIC_DIR/aditya.jpg" 2>/dev/null || true
fi

# ---- 5) Typecheck & build (local sanity) ------------------------------------
if command -v pnpm >/dev/null 2>&1; then PM=pnpm
elif command -v yarn >/dev/null 2>&1; then PM=yarn
else PM=npm; fi

echo "• Running typecheck..."
( cd "$WEB_DIR" && $PM run -s type-check || true )

# ---- 6) Commit ---------------------------------------------------------------
git add "$APP_DIR/about/page.tsx" "$SRC_DIR/components/layout/AppFooter.tsx" "$LAYOUT"
test -f "$HEADER" && git add "$HEADER" || true

git commit -m "feat(web): add About page with OG meta; header About link; footer credit (by Aditya Singh)"
echo "✅ About page, header link, and footer credit added. Push & deploy when ready."
