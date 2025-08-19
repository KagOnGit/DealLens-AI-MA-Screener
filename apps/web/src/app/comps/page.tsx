'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Download, Filter, Save } from 'lucide-react';

interface CompsData {
  summary: {
    count: number;
    sector: string;
    avg_market_cap: number;
    median_pe: number;
    median_ev_ebitda: number;
  };
  peers: Array<{
    ticker: string;
    name: string;
    market_cap: number;
    pe_ratio: number;
    ev_ebitda: number;
    ev_revenue: number;
    price: number;
    change_percent: number;
  }>;
  quartiles: {
    pe_ratio: { q1: number; median: number; q3: number };
    ev_ebitda: { q1: number; median: number; q3: number };
    ev_revenue: { q1: number; median: number; q3: number };
  };
}

async function fetchComps(params: any): Promise<CompsData> {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/comps?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch comps data');
  }
  return response.json();
}

export default function CompsPage() {
  const [filters, setFilters] = useState({
    sector: '',
    region: '',
    ticker: '',
    size_min: '',
    size_max: ''
  });

  const { data: compsData, isLoading, error } = useQuery({
    queryKey: ['comps', filters],
    queryFn: () => fetchComps(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCsv = () => {
    if (!compsData?.peers) return;
    
    const headers = ['Ticker', 'Name', 'Market Cap ($B)', 'P/E Ratio', 'EV/EBITDA', 'EV/Revenue', 'Price', 'Change %'];
    const rows = compsData.peers.map(peer => [
      peer.ticker,
      peer.name,
      peer.market_cap.toFixed(1),
      peer.pe_ratio?.toFixed(1) || 'N/A',
      peer.ev_ebitda?.toFixed(1) || 'N/A', 
      peer.ev_revenue?.toFixed(1) || 'N/A',
      peer.price?.toFixed(2) || 'N/A',
      peer.change_percent?.toFixed(2) || 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comps_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { accessorKey: 'ticker', header: 'Ticker' },
    { accessorKey: 'name', header: 'Company' },
    { 
      accessorKey: 'market_cap', 
      header: 'Market Cap ($B)',
      cell: ({ row }: any) => `$${row.getValue('market_cap').toFixed(1)}B`
    },
    { 
      accessorKey: 'pe_ratio', 
      header: 'P/E',
      cell: ({ row }: any) => row.getValue('pe_ratio')?.toFixed(1) || 'N/A'
    },
    { 
      accessorKey: 'ev_ebitda', 
      header: 'EV/EBITDA',
      cell: ({ row }: any) => row.getValue('ev_ebitda')?.toFixed(1) || 'N/A'
    },
    { 
      accessorKey: 'ev_revenue', 
      header: 'EV/Revenue',
      cell: ({ row }: any) => row.getValue('ev_revenue')?.toFixed(1) || 'N/A'
    },
    { 
      accessorKey: 'change_percent', 
      header: 'Change %',
      cell: ({ row }: any) => {
        const change = row.getValue('change_percent') as number;
        return (
          <Badge variant={change >= 0 ? 'default' : 'destructive'}>
            {change >= 0 ? '+' : ''}{change?.toFixed(2)}%
          </Badge>
        );
      }
    }
  ];

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
          <p className="text-red-500">Error loading comps data: {(error as Error).message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comparable Companies</h1>
            <p className="text-muted-foreground">
              Analyze valuation multiples and trading metrics across peer companies
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Filter
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Ticker</label>
                <Input
                  placeholder="e.g. AAPL"
                  value={filters.ticker}
                  onChange={(e) => handleFilterChange('ticker', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sector</label>
                <Select onValueChange={(value) => handleFilterChange('sector', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sectors</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Financials">Financials</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Region</label>
                <Select onValueChange={(value) => handleFilterChange('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All regions</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Asia">Asia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Min Market Cap ($B)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.size_min}
                  onChange={(e) => handleFilterChange('size_min', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Market Cap ($B)</label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={filters.size_max}
                  onChange={(e) => handleFilterChange('size_max', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {compsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Companies</CardDescription>
                <CardTitle className="text-2xl">{compsData.summary.count}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Market Cap</CardDescription>
                <CardTitle className="text-2xl">${compsData.summary.avg_market_cap.toFixed(1)}B</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Median P/E</CardDescription>
                <CardTitle className="text-2xl">{compsData.summary.median_pe.toFixed(1)}x</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Median EV/EBITDA</CardDescription>
                <CardTitle className="text-2xl">{compsData.summary.median_ev_ebitda.toFixed(1)}x</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Data Table */}
        {compsData && (
          <Card>
            <CardHeader>
              <CardTitle>Peer Analysis</CardTitle>
              <CardDescription>
                Comparative analysis of {compsData.summary.sector} companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={compsData.peers} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
