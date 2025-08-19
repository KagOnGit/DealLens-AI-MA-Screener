"use client";
import { useMarketSnapshot } from "@/src/lib/api";

export default function MarketPage() {
  const { data, isLoading, error } = useMarketSnapshot();
  if (isLoading) return <div className="p-6 text-zinc-300">Loading market…</div>;
  if (error) return <div className="p-6 text-red-400">Error loading market data.</div>;
  if (!data) return null;

  return (
    <div className="p-6 grid gap-6">
      <h1 className="text-xl font-semibold text-white">Market Snapshot</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-zinc-300 mb-2">Indices</div>
          <div className="grid gap-2">
            {data.indices.map(i=>(
              <div key={i.name} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">{i.name}</span>
                <span className="text-zinc-100">{i.value.toFixed(2)}</span>
                <span className={i.change>=0 ? "text-emerald-400" : "text-rose-400"}>{i.change>=0 ? "▲" : "▼"} {Math.abs(i.change).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-zinc-300 mb-2">Treasury Yields</div>
          <div className="grid gap-2">
            {data.yields.map(y=>(
              <div key={y.tenor} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">{y.tenor}</span>
                <span className="text-zinc-100">{y.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-zinc-300 mb-2">FX</div>
          <div className="grid gap-2">
            {data.fx.map(f=>(
              <div key={f.pair} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">{f.pair}</span>
                <span className="text-zinc-100">{f.value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-zinc-300 mb-2">Commodities</div>
          <div className="grid gap-2">
            {data.commodities.map(c=>(
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="text-zinc-200">{c.name}</span>
                <span className="text-zinc-100">{c.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-zinc-400">As of {new Date(data.asof).toLocaleString()}</div>
    </div>
  );
}
