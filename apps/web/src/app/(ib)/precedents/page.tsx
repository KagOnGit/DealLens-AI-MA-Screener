"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPrecedents, type PrecedentDeal } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, Filter, ExternalLink, Calendar, DollarSign, TrendingUp, Building2 } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/ib/KpiCard";

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}B`;
  }
  return `$${value.toFixed(0)}M`;
}

export default function PrecedentsPage() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["precedents"],
    queryFn: getPrecedents,
    staleTime: 5 * 60 * 1000,
  });

  const toggleExpanded = (dealId: string) => {
    const newExpanded = new Set(expandedDeals);
    if (newExpanded.has(dealId)) {
      newExpanded.delete(dealId);
    } else {
      newExpanded.add(dealId);
    }
    setExpandedDeals(newExpanded);
  };

  const filteredData = data?.filter(deal => {
    const matchesSearch = search === "" || 
      deal.acquirer.toLowerCase().includes(search.toLowerCase()) ||
      deal.target.toLowerCase().includes(search.toLowerCase());
    
    const matchesSector = sectorFilter === "All" || deal.sector === sectorFilter;
    const matchesStatus = statusFilter === "All" || deal.status === statusFilter;
    
    return matchesSearch && matchesSector && matchesStatus;
  }) || [];

  const sectors = Array.from(new Set(data?.map(deal => deal.sector) || []));
  const statuses = Array.from(new Set(data?.map(deal => deal.status) || []));

  // Calculate summary stats
  const totalValue = filteredData.reduce((sum, deal) => sum + deal.value, 0);
  const avgPremium = filteredData.filter(d => d.premium).reduce((sum, deal, _, arr) => sum + (deal.premium || 0), 0) / filteredData.filter(d => d.premium).length;
  const avgEvEbitda = filteredData.filter(d => d.ev_ebitda).reduce((sum, deal, _, arr) => sum + (deal.ev_ebitda || 0), 0) / filteredData.filter(d => d.ev_ebitda).length;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-400 text-lg">Failed to load precedent transactions</p>
            <p className="text-muted-foreground mt-2">
              Please check your connection or try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Precedent Transactions</h1>
          <p className="text-muted-foreground">
            Historical M&A transactions and market precedents for valuation analysis
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {!isLoading && filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Deals"
            value={filteredData.length}
            icon={Building2}
            hint="Matching criteria"
          />
          <KpiCard
            title="Total Value"
            value={totalValue}
            icon={DollarSign}
            hint="Aggregate transaction value"
          />
          <KpiCard
            title="Avg Premium"
            value={`${(avgPremium || 0).toFixed(1)}%`}
            icon={TrendingUp}
            hint="Average premium to market price"
          />
          <KpiCard
            title="Avg EV/EBITDA"
            value={`${(avgEvEbitda || 0).toFixed(1)}x`}
            icon={Calendar}
            hint="Average valuation multiple"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sector</label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sectors</SelectItem>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {!isLoading && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length} transactions
            {sectorFilter !== "All" && ` in ${sectorFilter}`}
            {statusFilter !== "All" && ` with status ${statusFilter}`}
          </p>
        </div>
      )}

      {/* Deals List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No transactions found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((deal) => (
            <Card key={deal.id}>
              <Collapsible 
                open={expandedDeals.has(deal.id)}
                onOpenChange={() => toggleExpanded(deal.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {deal.acquirer} → {deal.target}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <Badge variant="secondary">{deal.sector}</Badge>
                          <Badge variant={deal.status === "Completed" ? "default" : "outline"}>
                            {deal.status}
                          </Badge>
                          <span>Announced {new Date(deal.announced).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(deal.value)}</div>
                          {deal.premium && (
                            <div className="text-sm text-muted-foreground">
                              {deal.premium.toFixed(1)}% premium
                            </div>
                          )}
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform ${
                          expandedDeals.has(deal.id) ? "rotate-180" : ""
                        }`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {deal.value && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Transaction Value</label>
                            <p className="text-lg font-semibold">{formatCurrency(deal.value)}</p>
                          </div>
                        )}
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
                      </div>

                      {deal.rationale && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-muted-foreground">Rationale</label>
                          <p className="mt-1 text-sm">{deal.rationale}</p>
                        </div>
                      )}

                      {deal.terms && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-muted-foreground">Terms</label>
                          <p className="mt-1 text-sm">{deal.terms}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <Link href={`/precedents/${deal.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
