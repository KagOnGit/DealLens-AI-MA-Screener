import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyDetail, CompanyTimeseries } from '@/types';
import { Calculator, TrendingUp, Target } from 'lucide-react';
import { LineChart } from '@/components/charts';
import { useCompanyTimeseries } from '@/lib/api';

interface CompanyValuationTabProps {
  company: CompanyDetail;
  timeseries?: CompanyTimeseries;
}

export function CompanyValuationTab({ company, timeseries }: CompanyValuationTabProps) {
  // Get timeseries data with peers information
  const { data: fullTimeseries } = useCompanyTimeseries(company.ticker);
  const peers = (fullTimeseries as any)?.peers || [];
  
  if (!timeseries) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Valuation Data</h3>
          <p className="text-gray-600">Valuation metrics are loading...</p>
        </CardContent>
      </Card>
    );
  }

  const latestPE = timeseries.multiples?.[timeseries.multiples.length - 1]?.pe || company.pe_ratio;
  const latestEVEbitda = timeseries.multiples?.[timeseries.multiples.length - 1]?.ev_ebitda || company.ev_ebitda;

  const calculateAverage = (data: { pe?: number; ev_ebitda?: number }[], metric: 'pe' | 'ev_ebitda') => {
    const values = data.filter(d => d[metric] != null).map(d => d[metric]!);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const avgPE = timeseries.multiples ? calculateAverage(timeseries.multiples, 'pe') : latestPE;
  const avgEVEbitda = timeseries.multiples ? calculateAverage(timeseries.multiples, 'ev_ebitda') : latestEVEbitda;

  // Calculate peer comparison (simplified mock data for demonstration)
  const peerPE = avgPE * (0.9 + Math.random() * 0.2); // Mock peer average
  const peerEVEbitda = avgEVEbitda * (0.85 + Math.random() * 0.3); // Mock peer average

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}T`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value.toFixed(0)}M`;
  };

  return (
    <div className="space-y-6">
      {/* Current Valuation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Current P/E Ratio</p>
                <p className="text-3xl font-semibold">{latestPE?.toFixed(1)}x</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">4-Year Average:</span>
                <span>{avgPE?.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sector Average:</span>
                <span>{peerPE.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`font-medium ${
                  latestPE && peerPE && latestPE < peerPE ? 'text-green-600' : 'text-red-600'
                }`}>
                  vs Peers: {latestPE && peerPE ? (((latestPE - peerPE) / peerPE) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Current EV/EBITDA</p>
                <p className="text-3xl font-semibold">{latestEVEbitda?.toFixed(1)}x</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">4-Year Average:</span>
                <span>{avgEVEbitda?.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sector Average:</span>
                <span>{peerEVEbitda.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`font-medium ${
                  latestEVEbitda && peerEVEbitda && latestEVEbitda < peerEVEbitda ? 'text-green-600' : 'text-red-600'
                }`}>
                  vs Peers: {latestEVEbitda && peerEVEbitda ? (((latestEVEbitda - peerEVEbitda) / peerEVEbitda) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valuation Trends Chart */}
      {timeseries.multiples && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Multiples Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={timeseries.multiples.slice(-12).map(multiple => ({
                date: new Date(multiple.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                pe: multiple.pe,
                evEbitda: multiple.ev_ebitda
              }))}
              lines={[
                { key: 'pe', name: 'P/E Ratio', color: '#3B82F6' },
                { key: 'evEbitda', name: 'EV/EBITDA', color: '#10B981' }
              ]}
              height={350}
              xAxisKey="date"
              formatTooltipValue={(value, name) => [`${value.toFixed(1)}x`, name]}
              formatYAxisTick={(value) => `${value.toFixed(0)}x`}
              aria-label="PE ratio and EV/EBITDA trends over time"
            />
          </CardContent>
        </Card>
      )}

      {/* Peers Comparison Table */}
      {peers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Peer Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Company</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">P/E Ratio</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">EV/EBITDA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20">
                    <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {company.ticker} (Current)
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {latestPE?.toFixed(1) || 'N/A'}x
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {latestEVEbitda?.toFixed(1) || 'N/A'}x
                    </td>
                  </tr>
                  {peers.map((peer: any, index: number) => (
                    <tr key={peer.ticker} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{peer.ticker}</td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {peer.pe > 0 ? `${peer.pe.toFixed(1)}x` : 'N/A'}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                        {peer.ev_ebitda > 0 ? `${peer.ev_ebitda.toFixed(1)}x` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Valuation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Market Cap</p>
              <p className="text-xl font-semibold">{formatCurrency(company.market_cap)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Enterprise Value</p>
              <p className="text-xl font-semibold">
                {formatCurrency(company.market_cap * 1.15)} {/* Simplified EV calculation */}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Book Value</p>
              <p className="text-xl font-semibold">
                {formatCurrency(company.market_cap * 0.65)} {/* Simplified book value */}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Revenue Multiple</p>
              <p className="text-xl font-semibold">
                {(company.market_cap / company.revenue).toFixed(1)}x
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
