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
