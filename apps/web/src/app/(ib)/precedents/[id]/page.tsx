"use client";

import { useQuery } from "@tanstack/react-query";
import { getPrecedentById, type PrecedentDeal } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Building2, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/ib/KpiCard";

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}B`;
  }
  return `$${value.toFixed(0)}M`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function PrecedentDetailPage({ params }: PageProps) {
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ["precedent-detail", params.id],
    queryFn: () => getPrecedentById(params.id),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-400 text-lg">
              {error ? "Failed to load transaction details" : "Transaction not found"}
            </p>
            <p className="text-muted-foreground mt-2 mb-4">
              The requested precedent transaction could not be loaded.
            </p>
            <Link href="/precedents">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Precedents
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <Link href="/precedents">
          <Button variant="ghost" size="sm" className="gap-2 self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to Precedents
          </Button>
        </Link>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {deal.acquirer} → {deal.target}
            </h1>
            <Badge variant={deal.status === "Completed" ? "default" : "outline"}>
              {deal.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Badge variant="secondary">{deal.sector}</Badge>
            <span>Announced {formatDate(deal.announced)}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Transaction Value"
          value={formatCurrency(deal.value)}
          icon={DollarSign}
          hint="Total consideration"
        />
        {deal.premium && (
          <KpiCard
            title="Premium"
            value={`${deal.premium.toFixed(1)}%`}
            icon={TrendingUp}
            hint="Premium to market price"
            change={deal.premium > 30 ? 15 : deal.premium > 0 ? 5 : -5}
          />
        )}
        {deal.ev_ebitda && (
          <KpiCard
            title="EV/EBITDA"
            value={`${deal.ev_ebitda.toFixed(1)}x`}
            icon={Building2}
            hint="Valuation multiple"
          />
        )}
        <KpiCard
          title="Announced"
          value={formatDate(deal.announced)}
          icon={Calendar}
          hint="Transaction announcement"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deal Overview */}
        <div className="space-y-6">
          {deal.rationale && (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{deal.rationale}</p>
              </CardContent>
            </Card>
          )}

          {deal.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{deal.terms}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Value</label>
                  <p className="text-lg font-semibold">{formatCurrency(deal.value)}</p>
                </div>
                {deal.ev_ebitda && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">EV/EBITDA</label>
                    <p className="text-lg font-semibold">{deal.ev_ebitda.toFixed(1)}x</p>
                  </div>
                )}
                {deal.premium && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Premium</label>
                    <p className="text-lg font-semibold">{deal.premium.toFixed(1)}%</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-lg font-semibold">{deal.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {deal.timeline && deal.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Transaction Timeline
                </CardTitle>
                <CardDescription>
                  Key milestones and dates in the transaction process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deal.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(event.date)}
                          </Badge>
                        </div>
                        {event.note && (
                          <p className="text-sm text-muted-foreground">{event.note}</p>
                        )}
                        {event.tag && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {event.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Acquirer</label>
                <p className="text-base font-medium">{deal.acquirer}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Target</label>
                <p className="text-base font-medium">{deal.target}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sector</label>
                <Badge variant="secondary">{deal.sector}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
