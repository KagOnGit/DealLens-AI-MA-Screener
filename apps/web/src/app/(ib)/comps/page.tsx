"use client";
import { useComps } from "@/src/lib/api";

export default function CompsPage() {
  const { data, isLoading, error } = useComps({ sector: "All", region: "All", page: 1, page_size: 50 });
  if (isLoading) return <div className="p-6 text-zinc-300">Loading comps…</div>;
  if (error) return <div className="p-6 text-red-400">Error loading comps.</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-white mb-4">Comparable Companies</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left">Ticker</th>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left">Sector</th>
              <th className="px-3 py-2 text-right">Mkt Cap ($B)</th>
              <th className="px-3 py-2 text-right">Revenue ($B)</th>
              <th className="px-3 py-2 text-right">EBITDA ($B)</th>
              <th className="px-3 py-2 text-right">P/E</th>
              <th className="px-3 py-2 text-right">EV/EBITDA</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map(row => (
              <tr key={row.ticker} className="odd:bg-white/[0.02] hover:bg-white/[0.04] transition">
                <td className="px-3 py-2 text-zinc-200">{row.ticker}</td>
                <td className="px-3 py-2 text-zinc-100">{row.name}</td>
                <td className="px-3 py-2 text-zinc-300">{row.sector}</td>
                <td className="px-3 py-2 text-zinc-100 text-right">{(row.market_cap/1000).toFixed(1)}</td>
                <td className="px-3 py-2 text-zinc-100 text-right">{(row.revenue/1000).toFixed(1)}</td>
                <td className="px-3 py-2 text-zinc-100 text-right">{(row.ebitda/1000).toFixed(1)}</td>
                <td className="px-3 py-2 text-zinc-100 text-right">{row.pe.toFixed(1)}</td>
                <td className="px-3 py-2 text-zinc-100 text-right">{row.ev_ebitda.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
