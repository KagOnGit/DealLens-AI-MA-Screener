'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketData {
  timestamp: string;
  indices: Array<{
    symbol: string;
    ticker: string;
    value: number;
    change: number;
    change_percent: number;
  }>;
  treasuries: Array<{
    maturity: string;
    yield: number;
    change: number;
  }>;
  currencies: Array<{
    pair: string;
    rate: number;
    change: number;
    change_percent: number;
  }>;
  commodities: Array<{
    name: string;
    symbol: string;
    price: number;
    change: number;
    change_percent: number;
  }>;
  last_updated: string;
}

async function fetchMarketSnapshot(): Promise<MarketData> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/market/snapshot`);
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  return response.json();
}

export default function MarketPage() {
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['market-snapshot'],
    queryFn: fetchMarketSnapshot,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-red-500">Error loading market data: {(error as Error).message}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!marketData) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">No market data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Market Snapshot</h1>
            <p className="text-muted-foreground">
              Real-time market data and key financial indicators
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(marketData.last_updated).toLocaleTimeString()}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Market Indices */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Market Indices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {marketData.indices.map((index) => (
              <Card key={index.ticker}>
                <CardHeader className="pb-2">
                  <CardDescription>{index.symbol}</CardDescription>
                  <CardTitle className="text-lg">{formatCurrency(index.value)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={index.change_percent >= 0 ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {index.change_percent >= 0 ? 
                        <TrendingUp className="w-3 h-3" /> : 
                        <TrendingDown className="w-3 h-3" />
                      }
                      {formatPercent(index.change_percent)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {index.change >= 0 ? '+' : ''}{formatCurrency(index.change)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Treasury Yields */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Treasury Yields</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.treasuries.map((treasury) => (
              <Card key={treasury.maturity}>
                <CardHeader className="pb-2">
                  <CardDescription>{treasury.maturity} Treasury</CardDescription>
                  <CardTitle className="text-lg">{treasury.yield.toFixed(2)}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={treasury.change >= 0 ? 'default' : 'destructive'}
                  >
                    {treasury.change >= 0 ? '+' : ''}{treasury.change.toFixed(2)} bps
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currencies */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Major Currencies</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {marketData.currencies.map((currency) => (
                    <div key={currency.pair} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{currency.pair}</p>
                        <p className="text-lg font-bold">{currency.rate.toFixed(4)}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={currency.change_percent >= 0 ? 'default' : 'destructive'}
                          className="mb-1"
                        >
                          {formatPercent(currency.change_percent)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {currency.change >= 0 ? '+' : ''}{currency.change.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commodities */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Commodities</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {marketData.commodities.map((commodity) => (
                    <div key={commodity.symbol} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{commodity.name}</p>
                        <p className="text-lg font-bold">${commodity.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={commodity.change_percent >= 0 ? 'default' : 'destructive'}
                          className="mb-1"
                        >
                          {formatPercent(commodity.change_percent)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {commodity.change >= 0 ? '+' : ''}${commodity.change.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
