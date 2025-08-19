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
import { DealDetailLayout } from '@/components/deals/DealDetailLayout';
import { MetricCard } from '@/components/deals/MetricCard';
import { TimelineItem } from '@/components/deals/TimelineItem';
import { PartyCard } from '@/components/deals/PartyCard';
import { Section } from '@/components/deals/Section';

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
    <DealDetailLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/deals" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
      </div>

      {/* Deal Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">
            {dealDetail.title}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            dealDetail.status.toLowerCase() === 'completed' ? 'bg-green-500/20 text-green-300' :
            dealDetail.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
            dealDetail.status.toLowerCase() === 'terminated' ? 'bg-red-500/20 text-red-300' :
            'bg-blue-500/20 text-blue-300'
          }`}>
            {dealDetail.status}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
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

        <p className="text-white/80 mb-4 max-w-3xl leading-relaxed">
          {dealDetail.overview}
        </p>

        {dealDetail.rationale && dealDetail.rationale.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-white mb-3">Strategic Rationale</h3>
            <ul className="space-y-2">
              {dealDetail.rationale.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      {dealDetail.kpis && dealDetail.kpis.length > 0 && (
        <Section id="metrics" title="Key Metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dealDetail.kpis.map((kpi, index) => {
              const hasChange = kpi.deltaPct !== undefined;
              const isPositive = kpi.deltaPct && kpi.deltaPct > 0;
              
              return (
                <MetricCard
                  key={index}
                  label={kpi.label}
                  value={kpi.value}
                  hint={kpi.hint}
                  trend={hasChange ? (isPositive ? 'up' : 'down') : undefined}
                  change={hasChange ? Math.abs(kpi.deltaPct!).toFixed(1) + '%' : undefined}
                />
              );
            })}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        {dealDetail.timeline && dealDetail.timeline.length > 0 && (
          <Section id="timeline" title="Deal Timeline">
            <div className="space-y-4">
              {dealDetail.timeline.map((entry, index) => {
                const getTagColor = (type: string) => {
                  switch (type.toLowerCase()) {
                    case 'announcement': return 'blue';
                    case 'regulatory': return 'orange';
                    case 'shareholder': return 'purple';
                    case 'closing': return 'green';
                    default: return 'gray';
                  }
                };
                
                return (
                  <TimelineItem
                    key={index}
                    date={new Date(entry.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    title={entry.title}
                    description={entry.description}
                    tag={entry.type}
                    tagColor={getTagColor(entry.type)}
                    isLast={index === dealDetail.timeline!.length - 1}
                  />
                );
              })}
            </div>
          </Section>
        )}

        {/* Deal Parties */}
        {dealDetail.parties && dealDetail.parties.length > 0 && (
          <Section id="parties" title="Deal Parties">
            <div className="space-y-4">
              {dealDetail.parties.map((party, index) => (
                <PartyCard
                  key={index}
                  title={party.role}
                  name={party.name}
                  ticker={party.ticker}
                  industry={party.industry}
                  country={party.country}
                  role={party.role}
                />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Recent News */}
      {dealDetail.news && dealDetail.news.length > 0 && (
        <Section id="news" title="Recent News">
          <div className="space-y-4">
            {dealDetail.news.map((newsItem) => {
              const getSentimentColor = (sentiment: string) => {
                switch (sentiment.toLowerCase()) {
                  case 'positive': return 'text-green-400';
                  case 'negative': return 'text-red-400';
                  default: return 'text-white/60';
                }
              };
              
              return (
                <article key={newsItem.id} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        <a href={newsItem.url} target="_blank" rel="noopener noreferrer" 
                           className="hover:text-emerald-400 transition-colors">
                          {newsItem.title}
                        </a>
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="font-medium">{newsItem.source}</span>
                        <time>
                          {new Date(newsItem.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </time>
                        {newsItem.relevance && (
                          <span className="text-emerald-400 font-medium">
                            {Math.round(newsItem.relevance * 100)}% relevance
                          </span>
                        )}
                      </div>
                    </div>
                    {newsItem.sentiment && (
                      <span className={`text-sm font-medium ${getSentimentColor(newsItem.sentiment)}`}>
                        {newsItem.sentiment}
                      </span>
                    )}
                  </div>
                  {newsItem.summary && (
                    <p className="text-white/80 leading-relaxed">{newsItem.summary}</p>
                  )}
                </article>
              );
            })}
          </div>
        </Section>
      )}

      {/* Sidebar */}
      <aside className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Deal Terms</h3>
        <div className="space-y-4">
          <MetricCard
            label="Transaction Value"
            value={formatCurrency(dealDetail.value_usd)}
          />
          <MetricCard
            label="Premium"
            value={`${dealDetail.premium_pct > 0 ? '+' : ''}${dealDetail.premium_pct.toFixed(1)}%`}
            trend={dealDetail.premium_pct > 0 ? 'up' : 'down'}
          />
          <MetricCard
            label="EV/EBITDA Multiple"
            value={`${dealDetail.multiple_ev_ebitda.toFixed(1)}x`}
          />
        </div>
        
        {dealDetail.parties && dealDetail.parties.length >= 2 && (
          <div className="mt-6">
            <h4 className="font-medium text-white mb-3">Key Parties</h4>
            <div className="space-y-2 text-sm">
              <div className="text-white/80">
                <span className="text-white/60">Acquirer:</span> {dealDetail.parties.find(p => p.role === 'Acquirer')?.name}
              </div>
              <div className="text-white/80">
                <span className="text-white/60">Target:</span> {dealDetail.parties.find(p => p.role === 'Target')?.name}
              </div>
            </div>
          </div>
        )}
      </aside>
    </DealDetailLayout>
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
