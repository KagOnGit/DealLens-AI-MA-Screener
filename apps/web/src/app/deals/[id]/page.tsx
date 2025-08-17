'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Building2, DollarSign, Calendar, FileText, TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle, Clock, ExternalLink, Newspaper, ChartBar } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDealDetailPage } from '@/lib/api';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}T`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value.toFixed(0)}M`;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'announced': return 'bg-blue-100 text-blue-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'terminated': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getTimelineIcon(type: string, status: 'completed' | 'pending' | 'cancelled') {
  const baseClasses = 'h-5 w-5';
  
  if (status === 'completed') {
    return <CheckCircle className={`${baseClasses} text-green-600`} />;
  }
  if (status === 'cancelled') {
    return <AlertCircle className={`${baseClasses} text-red-600`} />;
  }
  
  switch (type) {
    case 'announcement': return <Building2 className={`${baseClasses} text-blue-600`} />;
    case 'filing': return <FileText className={`${baseClasses} text-purple-600`} />;
    case 'approval': return <CheckCircle className={`${baseClasses} text-green-600`} />;
    case 'close': return <Calendar className={`${baseClasses} text-orange-600`} />;
    default: return <Clock className={`${baseClasses} text-gray-600`} />;
  }
}

function DealDetailContent({ dealId }: { dealId: string }) {
  const { data: dealDetail, isLoading, error } = useDealDetailPage(dealId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/deals" className="flex items-center gap-2 text-sm hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Deals
          </Link>
        </div>
        
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dealDetail) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/deals" className="flex items-center gap-2 text-sm hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Deals
          </Link>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
            <p className="text-gray-600">The deal with ID "{dealId}" could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/deals" className="flex items-center gap-2 text-sm hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
      </div>

      {/* Deal Header */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {dealDetail.title}
            </h1>
            <Badge className={getStatusColor(dealDetail.status)}>
              {dealDetail.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Announced {new Date(dealDetail.announced_at).toLocaleDateString()}
            </span>
            {dealDetail.closed_at && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Closed {new Date(dealDetail.closed_at).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ChartBar className="h-4 w-4" />
              ${dealDetail.value_usd.toLocaleString()}M
            </span>
          </div>

          <p className="text-gray-700 mb-4 max-w-3xl">
            {dealDetail.overview}
          </p>

          {dealDetail.rationale && dealDetail.rationale.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Strategic Rationale</h3>
              <ul className="space-y-2">
                {dealDetail.rationale.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Deal Metrics Card */}
        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Deal Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Transaction Value</p>
              <p className="text-2xl font-semibold">{formatCurrency(dealDetail.value_usd)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Premium</p>
                <p className="text-lg font-semibold">
                  {dealDetail.premium_pct > 0 ? '+' : ''}{dealDetail.premium_pct.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">EV/EBITDA</p>
                <p className="text-lg font-semibold">{dealDetail.multiple_ev_ebitda.toFixed(1)}x</p>
              </div>
            </div>

            {dealDetail.parties && dealDetail.parties.length >= 2 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-2">Deal Parties</p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Acquirer:</span> {dealDetail.parties.find(p => p.role === 'Acquirer')?.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Target:</span> {dealDetail.parties.find(p => p.role === 'Target')?.name}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Grid */}
      {dealDetail.kpis && dealDetail.kpis.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {dealDetail.kpis.map((kpi, index) => {
              const hasChange = kpi.deltaPct !== undefined;
              const isPositive = kpi.deltaPct && kpi.deltaPct > 0;
              
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                        {kpi.hint && (
                          <p className="text-xs text-gray-500 mt-1">{kpi.hint}</p>
                        )}
                      </div>
                      {hasChange && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                          isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(kpi.deltaPct!).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        {dealDetail.timeline && dealDetail.timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Deal Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dealDetail.timeline.map((entry, index) => {
                  const typeColors = {
                    'Announcement': 'bg-blue-100 border-blue-200 text-blue-800',
                    'Regulatory': 'bg-orange-100 border-orange-200 text-orange-800',
                    'Shareholder': 'bg-purple-100 border-purple-200 text-purple-800',
                    'Closing': 'bg-green-100 border-green-200 text-green-800',
                    'Other': 'bg-gray-100 border-gray-200 text-gray-800'
                  };
                  const typeColor = typeColors[entry.type as keyof typeof typeColors] || typeColors['Other'];
                  
                  return (
                    <div key={index} className="relative">
                      {index < dealDetail.timeline!.length - 1 && (
                        <div className="absolute left-6 top-12 w-px h-full bg-gray-200" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${typeColor}`}>
                              {entry.type}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{entry.description}</p>
                          <time className="text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deal Parties */}
        {dealDetail.parties && dealDetail.parties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Deal Parties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealDetail.parties.map((party, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{party.name}</h3>
                          {party.ticker && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                              {party.ticker}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Role:</span> {party.role}</p>
                          <p><span className="font-medium">Industry:</span> {party.industry}</p>
                          <p><span className="font-medium">Country:</span> {party.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent News */}
      {dealDetail.news && dealDetail.news.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Recent News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dealDetail.news.map((newsItem) => {
                const sentimentColors = {
                  'positive': 'text-green-600',
                  'negative': 'text-red-600',
                  'neutral': 'text-gray-600'
                };
                
                return (
                  <article key={newsItem.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <a href={newsItem.url} target="_blank" rel="noopener noreferrer" 
                             className="hover:text-blue-600 transition-colors">
                            {newsItem.title}
                          </a>
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="font-medium">{newsItem.source}</span>
                          <time>
                            {new Date(newsItem.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>
                          {newsItem.relevance && (
                            <span className="text-blue-600 font-medium">
                              {Math.round(newsItem.relevance * 100)}% relevance
                            </span>
                          )}
                        </div>
                      </div>
                      {newsItem.sentiment && (
                        <span className={`text-sm font-medium ${sentimentColors[newsItem.sentiment as keyof typeof sentimentColors]}`}>
                          {newsItem.sentiment}
                        </span>
                      )}
                    </div>
                    {newsItem.summary && (
                      <p className="text-gray-700 leading-relaxed">{newsItem.summary}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;

  if (!dealId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Deal</h2>
            <p className="text-gray-600">No deal ID specified.</p>
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
      <DealDetailContent dealId={dealId} />
    </Suspense>
  );
}
