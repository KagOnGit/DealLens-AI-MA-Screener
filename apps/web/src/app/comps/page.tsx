"use client";

import { DataSourceChip } from "@/components/common/DataSourceChip";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getComps, type CompRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Download, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type SortField = keyof CompRow;
type SortDirection = "asc" | "desc";

function formatNumber(value: number, suffix?: string): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${suffix || ""}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${suffix || ""}`;
  }
  return `${value.toFixed(1)}${suffix || ""}`;
}

function formatCurrency(value: number): string {
  return `$${formatNumber(value)}`;
}

function formatRatio(value: number): string {
  return `${value.toFixed(1)}x`;
}

function exportToCSV(data: CompRow[], filename: string = "comps.csv") {
  const headers = [
    "Ticker", "Company", "Sector", "Region", "Price", "Market Cap ($M)", 
    "Revenue ($M)", "EBITDA ($M)", "P/E", "EV/EBITDA", "EV/Sales"
  ];
  
  const csvContent = [
    headers.join(","),
    ...data.map(row => [
      row.ticker,
      `"${row.name}"`,
      `"${row.sector}"`,
      row.region,
      row.price.toFixed(2),
      (row.market_cap / 1000).toFixed(0),
      (row.revenue / 1000).toFixed(0),
      (row.ebitda / 1000).toFixed(0),
      row.pe.toFixed(1),
      row.ev_ebitda.toFixed(1),
      row.ev_sales.toFixed(1)
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function CompsPage() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("market_cap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading, error } = useQuery({
    queryKey: ["comps", { sector: sectorFilter, region: regionFilter }],
    queryFn: () => getComps({ 
      sector: sectorFilter !== "All" ? sectorFilter : undefined,
      region: regionFilter !== "All" ? regionFilter : undefined 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];
    
    let filtered = data.filter(comp => {
      const matchesSearch = search === "" || 
        comp.name.toLowerCase().includes(search.toLowerCase()) ||
        comp.ticker.toLowerCase().includes(search.toLowerCase());
      
      return matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        const comparison = aVal - bVal;
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      return 0;
    });

    return filtered;
  }, [data, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sectors = useMemo(() => {
    if (!data) return [];
    const uniqueSectors = Array.from(new Set(data.map(comp => comp.sector)));
    return uniqueSectors.sort();
  }, [data]);

  const regions = useMemo(() => {
    if (!data) return [];
    const uniqueRegions = Array.from(new Set(data.map(comp => comp.region)));
    return uniqueRegions.sort();
  }, [data]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-400 text-lg">Failed to load comparables data</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Comparable Companies</h1>
          <div className="mt-2"><DataSourceChip /></div>
          <p className="text-muted-foreground">
            Analyze and compare public companies across sectors and regions
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => filteredAndSortedData.length > 0 && exportToCSV(filteredAndSortedData)}
            disabled={isLoading || filteredAndSortedData.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

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
              <label className="text-sm font-medium">Region</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
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
            Showing {filteredAndSortedData.length} companies
            {sectorFilter !== "All" && ` in ${sectorFilter}`}
            {regionFilter !== "All" && ` from ${regionFilter}`}
          </p>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer select-none p-4"
                    onClick={() => handleSort("ticker")}
                  >
                    <div className="flex items-center gap-2">
                      Ticker
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Company
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("sector")}
                  >
                    <div className="flex items-center gap-2">
                      Sector
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Region</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Price
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("market_cap")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Market Cap
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("pe")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      P/E
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("ev_ebitda")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      EV/EBITDA
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("ev_sales")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      EV/Sales
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j} className="p-4">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No companies found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((comp) => (
                    <TableRow key={comp.ticker} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-semibold p-4">
                        {comp.ticker}
                      </TableCell>
                      <TableCell className="font-medium">
                        {comp.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {comp.sector}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {comp.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${comp.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(comp.market_cap / 1000)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRatio(comp.pe)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRatio(comp.ev_ebitda)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRatio(comp.ev_sales)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
