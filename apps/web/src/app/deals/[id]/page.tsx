'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Building2, DollarSign, Calendar, FileText, TrendingUp, Users, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDealDetail } from '@/lib/api';

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
  const { data: dealDetail, isLoading } = useDealDetail(dealId);

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

  if (!dealDetail) {
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
              {dealDetail.acquirer} acquires {dealDetail.target}
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
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {dealDetail.sector}
            </span>
          </div>

          <p className="text-gray-700 mb-4 max-w-3xl">
            {dealDetail.rationale}
          </p>
        </div>

        {/* Deal Metrics Card */}
        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Deal Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Transaction Value</p>
              <p className="text-2xl font-semibold">{formatCurrency(dealDetail.terms.ev)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Premium</p>
                <p className="text-lg font-semibold">{dealDetail.terms.premium.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deal Value</p>
                <p className="text-lg font-semibold">{formatCurrency(dealDetail.value)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-600 mb-2">Payment Structure</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cash</span>
                  <span>{dealDetail.terms.payment_mix.cash_percent}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Stock</span>
                  <span>{dealDetail.terms.payment_mix.stock_percent}%</span>
                </div>
              </div>
            </div>

            {dealDetail.price_impact && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-2">Price Impact</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Acquirer</span>
                      <span className={dealDetail.price_impact.acquirer_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {dealDetail.price_impact.acquirer_change >= 0 ? '+' : ''}{dealDetail.price_impact.acquirer_change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target</span>
                      <span className={dealDetail.price_impact.target_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {dealDetail.price_impact.target_change >= 0 ? '+' : ''}{dealDetail.price_impact.target_change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deal Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dealDetail.timeline.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {index < dealDetail.timeline.length - 1 && (
                    <div className="absolute left-2.5 top-6 h-full w-0.5 bg-gray-200" />
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getTimelineIcon(entry.type, entry.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{entry.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            entry.status === 'completed' ? 'text-green-700 border-green-300' :
                            entry.status === 'cancelled' ? 'text-red-700 border-red-300' :
                            'text-gray-700 border-gray-300'
                          }`}
                        >
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                      {entry.description && (
                        <p className="text-sm text-gray-700">{entry.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Parties & Advisors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Deal Parties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Companies */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Acquirer</h4>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">{dealDetail.parties.acquirer.name}</p>
                      <p className="text-sm text-gray-600">{dealDetail.parties.acquirer.ticker}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${dealDetail.parties.acquirer.price}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(dealDetail.parties.acquirer.market_cap || 0)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Target</h4>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{dealDetail.parties.target.name}</p>
                      <p className="text-sm text-gray-600">{dealDetail.parties.target.ticker}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${dealDetail.parties.target.price}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(dealDetail.parties.target.market_cap || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advisors */}
              {dealDetail.parties.advisors && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-3">Advisors</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Financial</p>
                      <div className="flex flex-wrap gap-2">
                        {dealDetail.parties.advisors.financial.map((advisor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {advisor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Legal</p>
                      <div className="flex flex-wrap gap-2">
                        {dealDetail.parties.advisors.legal.map((advisor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {advisor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News & Filings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent News */}
        <Card>
          <CardHeader>
            <CardTitle>Recent News</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dealDetail.news.slice(0, 5).map((article) => (
                <div key={article.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <h4 className="font-medium leading-tight mb-1">
                    {article.headline}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                  {article.summary && (
                    <p className="text-sm text-gray-700 mb-2">{article.summary}</p>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Read More
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filings & Documents */}
        {dealDetail.filings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Filings & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dealDetail.filings.map((filing, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{filing.type}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(filing.date).toLocaleDateString()}
                      </p>
                      {filing.description && (
                        <p className="text-sm text-gray-700 mt-1">{filing.description}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={filing.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
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
