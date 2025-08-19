'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Calendar, Filter, TrendingUp, ArrowRight, Clock, DollarSign, Building, Search, BarChart3, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeals, useDealsStatsNew } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Filter options
const industries = ['All', 'Technology', 'Healthcare', 'Financial Services', 'Energy', 'Consumer Discretionary', 'Materials', 'Industrials']
const statuses = ['All', 'Pending', 'Closed', 'Terminated']
const sizeBuckets = ['All', '<$500M', '$500M–$1B', '$1B–$10B', '$10B–$50B', '$50B+']

// Chart colors
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

function DealsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [selectedIndustry, setSelectedIndustry] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedSize, setSelectedSize] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showCharts, setShowCharts] = useState(false)
  
  // API data fetching
  const dealParams = {
    industry: selectedIndustry !== 'All' ? selectedIndustry : undefined,
    status: selectedStatus !== 'All' ? selectedStatus : undefined,
    size: selectedSize !== 'All' ? selectedSize : undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
    q: searchQuery || undefined
  }
  
  const { data: deals = [], isLoading: dealsLoading, error: dealsError } = useDeals(dealParams)
  const { data: stats, isLoading: statsLoading } = useDealsStatsNew({
    industry: selectedIndustry !== 'All' ? selectedIndustry : undefined,
    status: selectedStatus !== 'All' ? selectedStatus : undefined,
    size: selectedSize !== 'All' ? selectedSize : undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined
  })
  
  // Initialize state from URL parameters
  useEffect(() => {
    if (searchParams) {
      const industry = searchParams.get('industry')
      const status = searchParams.get('status')
      const size = searchParams.get('size')
      const search = searchParams.get('q')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      if (industry && industries.includes(industry)) setSelectedIndustry(industry)
      if (status && statuses.includes(status)) setSelectedStatus(status)
      if (size && sizeBuckets.includes(size)) setSelectedSize(size)
      if (search) setSearchQuery(search)
      if (startDate || endDate) {
        setDateRange({
          start: startDate || '',
          end: endDate || ''
        })
      }
    }
  }, [searchParams])
  
  // Update URL when filters change
  const updateUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams?.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === 'All' || value === 0) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl)
  }

  // Calculate summary stats
  const totalValue = useMemo(() => {
  return deals.reduce((sum, deal) => sum + (deal.value_usd || 0), 0)
  }, [deals])
  
  const avgDealSize = useMemo(() => {
    return deals.length > 0 ? totalValue / deals.length : 0
  }, [totalValue, deals.length])

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
    return `$${value.toFixed(0)}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'closed': return 'text-terminal-green bg-terminal-green bg-opacity-20'
      case 'pending': return 'text-yellow-400 bg-yellow-400 bg-opacity-20'
      case 'terminated': return 'text-terminal-red bg-terminal-red bg-opacity-20'
      default: return 'text-gray-400 bg-gray-400 bg-opacity-20'
    }
  }
  
  // Filter change handlers
  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value)
    updateUrl({ industry: value })
  }
  
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    updateUrl({ status: value })
  }
  
  const handleSizeChange = (value: string) => {
    setSelectedSize(value)
    updateUrl({ size: value })
  }
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateUrl({ q: value })
  }
  
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [type]: value }
    setDateRange(newDateRange)
    updateUrl({ startDate: newDateRange.start, endDate: newDateRange.end })
  }
  
  const handleClearFilters = () => {
    setSelectedIndustry('All')
    setSelectedStatus('All')
    setSelectedSize('All')
    setSearchQuery('')
    setDateRange({ start: '', end: '' })
    router.replace(pathname)
  }

  if (dealsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-terminal-primary font-mono">M&A DEALS</h1>
              <p className="text-gray-400 text-sm mt-1">Loading deals...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-terminal-surface border border-terminal-border rounded-lg p-4 animate-pulse">
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-primary font-mono">M&A DEALS</h1>
            <p className="text-gray-400 text-sm mt-1">
              {deals.length} deals • Total Value: {formatValue(totalValue)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowCharts(!showCharts)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showCharts ? 'Hide' : 'Show'} Charts
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-terminal-surface border-terminal-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-terminal-primary" />
                <div>
                  <div className="text-xs text-gray-400 uppercase font-mono">Total Value</div>
                  <div className="text-lg font-mono text-white">{formatValue(totalValue)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-terminal-surface border-terminal-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-terminal-green" />
                <div>
                  <div className="text-xs text-gray-400 uppercase font-mono">Avg Deal Size</div>
                  <div className="text-lg font-mono text-white">{formatValue(avgDealSize)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-terminal-surface border-terminal-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-terminal-primary" />
                <div>
                  <div className="text-xs text-gray-400 uppercase font-mono">Active Deals</div>
                  <div className="text-lg font-mono text-white">
                    {deals.filter(d => d.status === 'Pending').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-terminal-surface border-terminal-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="text-xs text-gray-400 uppercase font-mono">Completion Rate</div>
                  <div className="text-lg font-mono text-white">
                    {deals.length > 0 ? ((deals.filter(d => d.status === 'Closed').length / deals.length) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {showCharts && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Activity Chart */}
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-white font-mono">Monthly Deal Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Industry Distribution */}
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-white font-mono">Industry Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byIndustry}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="industry"
                    >
                      {stats.byIndustry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Size Distribution */}
            <Card className="bg-terminal-surface border-terminal-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white font-mono">Deal Size Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.bySize}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="bucket" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-black border-terminal-border text-white"
                />
              </div>

              {/* Industry Filter */}
              <select
                className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
                value={selectedIndustry}
                onChange={(e) => handleIndustryChange(e.target.value)}
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              {/* Deal Size Filter */}
              <select
                className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
                value={selectedSize}
                onChange={(e) => handleSizeChange(e.target.value)}
              >
                {sizeBuckets.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>

              {/* Date Range */}
              <input
                type="date"
                placeholder="Start Date"
                className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />

              <input
                type="date"
                placeholder="End Date"
                className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
            
            <div className="mt-4">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="font-mono text-sm"
              >
                CLEAR FILTERS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deals List */}
        <div className="space-y-4">
          {deals.length === 0 ? (
            <Card className="bg-terminal-surface border-terminal-border">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 font-mono">No deals found matching current filters</div>
              </CardContent>
            </Card>
          ) : (
            deals.map((deal) => (
              <Card key={deal.id} className="bg-terminal-surface border-terminal-border hover:bg-terminal-border transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-terminal-primary font-bold">{deal.acquirer}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-terminal-primary" />
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-terminal-primary font-bold">{deal.target}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-3">{deal.title}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-gray-400 font-mono uppercase text-xs">Deal Value</div>
                          <div className="text-white font-mono text-lg">{formatValue((deal.value_usd || 0) * 1000000)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-mono uppercase text-xs">Industry</div>
                          <div className="text-white">{deal.industry}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-mono uppercase text-xs">Size</div>
                          <div className="text-white">{deal.sizeBucket}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-mono uppercase text-xs">Announced</div>
                          <div className="text-white font-mono">
                            {new Date(deal.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(deal.status)}>
                            {deal.status.toUpperCase()}
                          </Badge>
                        </div>
                        <Link href={`/deals/${deal.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DealsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-terminal-primary font-mono">M&A DEALS</h1>
              <p className="text-gray-400 text-sm mt-1">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <DealsPageContent />
    </Suspense>
  )
}
