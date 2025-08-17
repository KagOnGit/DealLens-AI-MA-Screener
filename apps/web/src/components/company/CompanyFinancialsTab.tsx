import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyDetail, CompanyTimeseries } from '@/types';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, LineChart, formatCurrency } from '@/components/charts';

interface CompanyFinancialsTabProps {
  company: CompanyDetail;
  timeseries?: CompanyTimeseries;
}

export function CompanyFinancialsTab({ company, timeseries }: CompanyFinancialsTabProps) {
  if (!timeseries) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Financial Data</h3>
          <p className="text-gray-600">Financial timeseries data is loading...</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrencyLocal = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value.toFixed(0)}M`;
  };

  const calculateGrowth = (data: { value: number }[]) => {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1].value;
    const yearAgo = data[data.length - 5] || data[0]; // 4 quarters ago
    return ((latest - yearAgo.value) / yearAgo.value) * 100;
  };

  const revenueGrowth = calculateGrowth(timeseries.revenue);
  const ebitdaGrowth = calculateGrowth(timeseries.ebitda);
  const fcfGrowth = calculateGrowth(timeseries.fcf);

  const latestRevenue = timeseries.revenue[timeseries.revenue.length - 1]?.value || 0;
  const latestEbitda = timeseries.ebitda[timeseries.ebitda.length - 1]?.value || 0;
  const latestFcf = timeseries.fcf[timeseries.fcf.length - 1]?.value || 0;

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest Revenue (Quarterly)</p>
                <p className="text-2xl font-semibold">{formatCurrencyLocal(latestRevenue)}</p>
                <p className={`text-sm flex items-center gap-1 ${
                  revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${revenueGrowth < 0 ? 'rotate-180' : ''}`} />
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% YoY
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest EBITDA (Quarterly)</p>
                <p className="text-2xl font-semibold">{formatCurrencyLocal(latestEbitda)}</p>
                <p className={`text-sm flex items-center gap-1 ${
                  ebitdaGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${ebitdaGrowth < 0 ? 'rotate-180' : ''}`} />
                  {ebitdaGrowth >= 0 ? '+' : ''}{ebitdaGrowth.toFixed(1)}% YoY
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest FCF (Quarterly)</p>
                <p className="text-2xl font-semibold">{formatCurrencyLocal(latestFcf)}</p>
                <p className={`text-sm flex items-center gap-1 ${
                  fcfGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${fcfGrowth < 0 ? 'rotate-180' : ''}`} />
                  {fcfGrowth >= 0 ? '+' : ''}{fcfGrowth.toFixed(1)}% YoY
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Trends - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & EBITDA Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & EBITDA (Quarterly)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={timeseries.revenue.slice(-8).map((rev, index) => ({
                date: new Date(rev.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                revenue: rev.value,
                ebitda: timeseries.ebitda[timeseries.ebitda.length - 8 + index]?.value || 0
              }))}
              bars={[
                { key: 'revenue', name: 'Revenue', color: '#3B82F6' },
                { key: 'ebitda', name: 'EBITDA', color: '#10B981' }
              ]}
              height={350}
              xAxisKey="date"
              formatTooltipValue={(value, name) => [formatCurrency(value), name]}
              formatYAxisTick={(value) => formatCurrency(value)}
              aria-label="Revenue and EBITDA quarterly trends"
            />
          </CardContent>
        </Card>

        {/* Margins Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Margin Trends (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={timeseries.margins.slice(-8).map(margin => ({
                date: new Date(margin.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                gross: margin.gross,
                ebitda: margin.ebitda,
                net: margin.net
              }))}
              lines={[
                { key: 'gross', name: 'Gross Margin', color: '#3B82F6' },
                { key: 'ebitda', name: 'EBITDA Margin', color: '#10B981' },
                { key: 'net', name: 'Net Margin', color: '#8B5CF6' }
              ]}
              height={350}
              xAxisKey="date"
              formatTooltipValue={(value, name) => [`${value.toFixed(1)}%`, name]}
              formatYAxisTick={(value) => `${value.toFixed(0)}%`}
              yAxisDomain={[0, 'auto']}
              aria-label="Profit margin trends over time"
            />
          </CardContent>
        </Card>
      </div>

      {/* Margin Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Margin Analysis (Latest Quarter)</CardTitle>
        </CardHeader>
        <CardContent>
          {timeseries.margins && timeseries.margins.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Gross Margin</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {timeseries.margins[timeseries.margins.length - 1].gross.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">EBITDA Margin</p>
                <p className="text-2xl font-semibold text-green-600">
                  {timeseries.margins[timeseries.margins.length - 1].ebitda.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Margin</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {timeseries.margins[timeseries.margins.length - 1].net.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
