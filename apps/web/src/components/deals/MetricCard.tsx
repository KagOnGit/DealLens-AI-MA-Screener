import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down';
  change?: string;
}

export function MetricCard({ label, value, hint, trend, change }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-white/65 mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums text-white/92">
            {value}
          </p>
          {hint && (
            <p className="text-xs text-white/45 mt-1">
              {hint}
            </p>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
            trend === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {change || 'Trend'}
          </div>
        )}
      </div>
    </div>
  );
}
