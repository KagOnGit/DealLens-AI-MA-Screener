import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompanyDetail, CompanyOwnership } from '@/types';
import { PieChart as PieChartIcon, Users, TrendingUp, TrendingDown, Building2, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';

interface CompanyOwnershipTabProps {
  company: CompanyDetail;
  ownership?: CompanyOwnership;
}

export function CompanyOwnershipTab({ company, ownership }: CompanyOwnershipTabProps) {
  if (!ownership) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <PieChartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Ownership Data</h3>
          <p className="text-gray-600">Ownership information is loading...</p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const downloadCSV = () => {
    const headers = ['Holder Name', 'Shares', 'Percentage', 'Market Value'];
    const rows = ownership.top_holders.map(holder => [
      holder.name,
      holder.shares.toString(),
      `${holder.percentage.toFixed(2)}%`,
      formatCurrency(holder.shares * company.price)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${company.ticker}_ownership.csv`;
    link.click();
  };


  return (
    <div className="space-y-6">
      {/* Ownership Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Ownership Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Pie Chart */}
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ownership.slices}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={20}
                  >
                    {ownership.slices.map((slice, index) => (
                      <Cell key={`cell-${index}`} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatTooltipValue={(value, name) => [`${value.toFixed(1)}%`, name]} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {ownership.slices.map((slice, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{slice.label}</span>
                      <span className="text-gray-600">{slice.value.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Shareholders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Shareholders
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Holder</th>
                  <th className="text-right py-2">Shares</th>
                  <th className="text-right py-2">Percentage</th>
                  <th className="text-right py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {ownership.top_holders.map((holder, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{holder.name}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 font-mono">
                      {formatNumber(holder.shares)}
                    </td>
                    <td className="text-right py-3">
                      {holder.percentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 font-mono">
                      {formatCurrency(holder.shares * company.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insider Trading Activity */}
      {ownership.insider_activity && ownership.insider_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Insider Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ownership.insider_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {activity.type === 'buy' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.person}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={activity.type === 'buy' ? 'default' : 'destructive'} className="mb-1">
                      {activity.type.toUpperCase()}
                    </Badge>
                    <p className="text-sm font-mono">
                      {formatNumber(activity.shares)} shares
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(activity.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
