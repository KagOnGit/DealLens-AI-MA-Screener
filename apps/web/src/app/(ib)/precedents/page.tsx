"use client";
import { usePrecedents } from "@/lib/api";

export default function PrecedentsPage() {
  const { data, isLoading, error } = usePrecedents({ page:1, page_size:50 });
  if (isLoading) return <div className="p-6 text-zinc-300">Loading precedents…</div>;
  if (error) return <div className="p-6 text-red-400">Error loading precedents.</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-white mb-4">Precedent Transactions</h1>
      <div className="grid gap-3">
        {data?.items.map(d => (
          <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-zinc-200 font-medium">{d.acquirer} → {d.target}</div>
            <div className="text-zinc-400 text-sm">{d.industry} • {d.status} • Announced {new Date(d.announced).toLocaleDateString()}</div>
            <div className="text-zinc-100 text-sm mt-1">$ {(d.value/1000).toFixed(1)}B • EV/EBITDA {d.ev_ebitda ?? "–"} • Premium {d.premium ?? "–"}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
