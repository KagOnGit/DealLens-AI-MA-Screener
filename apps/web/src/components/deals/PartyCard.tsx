import { Building2 } from 'lucide-react';

interface PartyCardProps {
  title?: string;
  name: string;
  ticker?: string;
  role: string;
  industry: string;
  country: string;
}

export function PartyCard({ title, name, ticker, role, industry, country }: PartyCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white/65" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-white/92 text-lg truncate">
              {name}
            </h3>
            {ticker && (
              <span className="px-2 py-1 bg-white/5 text-white/75 rounded text-sm font-medium tabular-nums">
                {ticker}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-white/45 font-medium mb-1">Role</p>
              <p className="text-white/75">{role}</p>
            </div>
            <div>
              <p className="text-white/45 font-medium mb-1">Industry</p>
              <p className="text-white/75">{industry}</p>
            </div>
            <div>
              <p className="text-white/45 font-medium mb-1">Country</p>
              <p className="text-white/75">{country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
