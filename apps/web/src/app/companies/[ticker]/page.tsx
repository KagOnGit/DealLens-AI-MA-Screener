'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Building2, ExternalLink, TrendingUp, Users, DollarSign, BarChart3, Globe, Calendar, AlertTriangle, Shield } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useCompanyDetail, useCompanyTimeseries, useCompanyOwnership, useCompanyNews } from '@/lib/api';
import { CompanyOverviewTab } from '@/components/company/CompanyOverviewTab';
import { CompanyFinancialsTab } from '@/components/company/CompanyFinancialsTab';
import { CompanyValuationTab } from '@/components/company/CompanyValuationTab';
import { CompanyOwnershipTab } from '@/components/company/CompanyOwnershipTab';
import { CompanyNewsTab } from '@/components/company/CompanyNewsTab';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}T`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}B`;
  }
  return `$${value.toFixed(2)}M`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function CompanyDetailContent({ ticker }: { ticker: string }) {
  const { data: companyDetail, isLoading: detailLoading } = useCompanyDetail(ticker);
  const { data: timeseries } = useCompanyTimeseries(ticker);
  const { data: ownership } = useCompanyOwnership(ticker);
  const { data: news } = useCompanyNews(ticker);

  if (detailLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!companyDetail) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
            <p className="text-gray-600">The company "{ticker}" could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Company Header */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{companyDetail.name}</h1>
            <Badge variant="secondary" className="px-2 py-1">
              {companyDetail.ticker}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {companyDetail.sector}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {companyDetail.headquarters}
            </span>
            {companyDetail.website && (
              <a 
                href={companyDetail.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
          </div>

          <p className="text-gray-700 mb-4 max-w-3xl">
            {companyDetail.business_summary || companyDetail.description}
          </p>
        </div>

        {/* Key Metrics Card */}
        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Stock Price</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold">${companyDetail.price}</p>
                  <span className={`text-sm flex items-center gap-1 ${
                    companyDetail.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${companyDetail.change_percent < 0 ? 'rotate-180' : ''}`} />
                    {formatPercent(companyDetail.change_percent)}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Market Cap</p>
                <p className="text-xl font-semibold">{formatCurrency(companyDetail.market_cap)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">P/E Ratio</span>
                <span className="font-medium">{companyDetail.pe_ratio?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">EV/EBITDA</span>
                <span className="font-medium">{companyDetail.ev_ebitda?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="font-medium">{formatCurrency(companyDetail.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employees</span>
                <span className="font-medium">{companyDetail.employees?.toLocaleString()}</span>
              </div>
              {companyDetail.beta && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Beta</span>
                  <span className="font-medium">{companyDetail.beta.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last updated</span>
              <span>{new Date(companyDetail.updated_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CompanyOverviewTab company={companyDetail} />
        </TabsContent>

        <TabsContent value="financials" className="mt-6">
          <CompanyFinancialsTab company={companyDetail} timeseries={timeseries} />
        </TabsContent>

        <TabsContent value="valuation" className="mt-6">
          <CompanyValuationTab company={companyDetail} timeseries={timeseries} />
        </TabsContent>

        <TabsContent value="ownership" className="mt-6">
          <CompanyOwnershipTab company={companyDetail} ownership={ownership} />
        </TabsContent>

        <TabsContent value="news" className="mt-6">
          <CompanyNewsTab company={companyDetail} news={news} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;

  if (!ticker) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Company</h2>
            <p className="text-gray-600">No company ticker specified.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <CompanyDetailContent ticker={ticker.toUpperCase()} />
    </Suspense>
  );
}
