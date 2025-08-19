"use client";

import { DataSourceChip } from "@/components/common/DataSourceChip";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeagueTables, type LeagueRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Building2, DollarSign, TrendingUp, Award, Filter } from "lucide-react";
import { KpiCard } from "@/components/ib/KpiCard";

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}B`;
  }
  return `$${value.toFixed(0)}M`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function getRankBadgeVariant(rank: number) {
  if (rank === 1) return "default";
  if (rank <= 3) return "secondary";
  return "outline";
}

function getRankIcon(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function LeagueTablesPage() {
  const [periodFilter, setPeriodFilter] = useState<string>("YTD");
  const [sectorFilter, setSectorFilter] = useState<string>("All");

  const { data, isLoading, error } = useQuery({
    queryKey: ["league-tables", { period: periodFilter, sector: sectorFilter }],
    queryFn: () => getLeagueTables({ 
      period: periodFilter !== "YTD" ? periodFilter : undefined,
      sector: sectorFilter !== "All" ? sectorFilter : undefined 
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate summary statistics
  const totalDeals = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, advisor) => sum + advisor.deals, 0);
  }, [data]);

  const totalValue = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, advisor) => sum + advisor.total_value, 0);
  }, [data]);

  const topAdvisor = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data[0];
  }, [data]);

  const avgDealSize = useMemo(() => {
    if (!data || totalDeals === 0) return 0;
    return totalValue / totalDeals;
  }, [data, totalDeals, totalValue]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-400 text-lg">Failed to load league tables</p>
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
          <h1 className="text-3xl font-bold tracking-tight">League Tables</h1>
          <div className="mt-2"><DataSourceChip /></div>
          <p className="text-muted-foreground">
            Investment bank rankings by M&A advisory activity and market share
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {!isLoading && data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Deals"
            value={totalDeals}
            icon={Building2}
            hint={`${periodFilter} period`}
          />
          <KpiCard
            title="Total Value"
            value={totalValue}
            icon={DollarSign}
            hint="Aggregate transaction value"
          />
          <KpiCard
            title="Top Advisor"
            value={topAdvisor?.advisor || "N/A"}
            icon={Trophy}
            hint={topAdvisor ? `${topAdvisor.deals} deals` : "No data"}
          />
          <KpiCard
            title="Avg Deal Size"
            value={formatCurrency(avgDealSize)}
            icon={TrendingUp}
            hint="Average transaction size"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YTD">Year to Date</SelectItem>
                  <SelectItem value="1Y">1 Year</SelectItem>
                  <SelectItem value="3Y">3 Years</SelectItem>
                  <SelectItem value="5Y">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sector</label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sectors</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Industrials">Industrials</SelectItem>
                  <SelectItem value="Consumer">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {!isLoading && data && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {data.length} advisors for {periodFilter}
            {sectorFilter !== "All" && ` in ${sectorFilter}`}
          </p>
        </div>
      )}

      {/* League Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            M&A Advisory Rankings
          </CardTitle>
          <CardDescription>
            Ranked by total transaction value for {periodFilter}
            {sectorFilter !== "All" && ` in ${sectorFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 text-center">Rank</TableHead>
                  <TableHead>Advisory Firm</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Avg Deal Size</TableHead>
                  <TableHead className="text-right">Market Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j} className="p-4">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No data available</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((advisor, index) => (
                    <TableRow key={advisor.advisor} className="hover:bg-muted/50">
                      <TableCell className="text-center p-4">
                        <div className="flex items-center justify-center">
                          {advisor.rank <= 3 ? (
                            <span className="text-lg">{getRankIcon(advisor.rank)}</span>
                          ) : (
                            <Badge variant={getRankBadgeVariant(advisor.rank)}>
                              #{advisor.rank}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold">{advisor.advisor}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(advisor.deals)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(advisor.total_value)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(advisor.avg_size)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, (advisor.total_value / (totalValue || 1)) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-12">
                            {totalValue > 0 ? ((advisor.total_value / totalValue) * 100).toFixed(1) : "0.0"}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Spotlight */}
      {!isLoading && data && data.length >= 3 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Top 3 Advisors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.slice(0, 3).map((advisor, index) => (
              <Card key={advisor.advisor} className={index === 0 ? "ring-2 ring-primary" : ""}>
                <CardHeader className="text-center">
                  <div className="mx-auto text-3xl mb-2">
                    {getRankIcon(advisor.rank)}
                  </div>
                  <CardTitle className="text-lg">{advisor.advisor}</CardTitle>
                  <CardDescription>
                    Rank #{advisor.rank}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(advisor.total_value)}</p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="font-semibold">{formatNumber(advisor.deals)}</p>
                      <p className="text-xs text-muted-foreground">Deals</p>
                    </div>
                    <div>
                      <p className="font-semibold">{formatCurrency(advisor.avg_size)}</p>
                      <p className="text-xs text-muted-foreground">Avg Size</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
