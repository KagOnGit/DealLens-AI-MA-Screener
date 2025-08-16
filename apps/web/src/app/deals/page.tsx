'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Calendar, Filter, TrendingUp, ArrowRight, Clock, DollarSign, Building } from 'lucide-react'

// Mock data
const mockDeals = [
  {
    id: '1',
    acquirer: { name: 'Microsoft Corporation', ticker: 'MSFT' },
    target: { name: 'Activision Blizzard Inc.', ticker: 'ATVI' },
    value: 68700000000,
    announcedDate: '2022-01-18',
    expectedCloseDate: '2023-06-13',
    status: 'Completed',
    industry: 'Technology',
    dealType: 'Acquisition',
    paymentMethod: 'Cash',
    premium: 45.3,
    synergies: 3000000000
  },
  {
    id: '2',
    acquirer: { name: 'Broadcom Inc.', ticker: 'AVGO' },
    target: { name: 'VMware Inc.', ticker: 'VMW' },
    value: 61000000000,
    announcedDate: '2022-05-26',
    expectedCloseDate: '2023-10-30',
    status: 'Completed',
    industry: 'Technology',
    dealType: 'Acquisition',
    paymentMethod: 'Mixed',
    premium: 49.0,
    synergies: 2000000000
  },
  {
    id: '3',
    acquirer: { name: 'Pfizer Inc.', ticker: 'PFE' },
    target: { name: 'Seagen Inc.', ticker: 'SGEN' },
    value: 43000000000,
    announcedDate: '2023-03-13',
    expectedCloseDate: '2024-01-31',
    status: 'Completed',
    industry: 'Healthcare',
    dealType: 'Acquisition',
    paymentMethod: 'Cash',
    premium: 32.8,
    synergies: 1500000000
  },
  {
    id: '4',
    acquirer: { name: 'Salesforce Inc.', ticker: 'CRM' },
    target: { name: 'Slack Technologies Inc.', ticker: 'WORK' },
    value: 27700000000,
    announcedDate: '2020-12-01',
    expectedCloseDate: '2021-07-21',
    status: 'Completed',
    industry: 'Technology',
    dealType: 'Acquisition',
    paymentMethod: 'Mixed',
    premium: 54.5,
    synergies: 800000000
  },
  {
    id: '5',
    acquirer: { name: 'Amazon.com Inc.', ticker: 'AMZN' },
    target: { name: 'MGM Holdings Inc.', ticker: 'MGM' },
    value: 8450000000,
    announcedDate: '2021-05-26',
    expectedCloseDate: '2022-03-17',
    status: 'Completed',
    industry: 'Media & Entertainment',
    dealType: 'Acquisition',
    paymentMethod: 'Cash',
    premium: 40.2,
    synergies: 500000000
  },
  {
    id: '6',
    acquirer: { name: 'Chevron Corporation', ticker: 'CVX' },
    target: { name: 'PDC Energy Inc.', ticker: 'PDCE' },
    value: 7100000000,
    announcedDate: '2023-05-22',
    expectedCloseDate: '2024-08-31',
    status: 'Pending',
    industry: 'Energy',
    dealType: 'Acquisition',
    paymentMethod: 'Mixed',
    premium: 27.5,
    synergies: 400000000
  },
  {
    id: '7',
    acquirer: { name: 'JPMorgan Chase & Co.', ticker: 'JPM' },
    target: { name: 'First Republic Bank', ticker: 'FRC' },
    value: 10600000000,
    announcedDate: '2023-05-01',
    expectedCloseDate: '2023-05-01',
    status: 'Completed',
    industry: 'Financial Services',
    dealType: 'Acquisition',
    paymentMethod: 'Cash',
    premium: 0,
    synergies: 2000000000
  },
  {
    id: '8',
    acquirer: { name: 'Meta Platforms Inc.', ticker: 'META' },
    target: { name: 'Within Unlimited Inc.', ticker: 'WTIN' },
    value: 400000000,
    announcedDate: '2021-10-25',
    expectedCloseDate: '2024-01-15',
    status: 'Terminated',
    industry: 'Technology',
    dealType: 'Acquisition',
    paymentMethod: 'Cash',
    premium: 67.8,
    synergies: 50000000
  }
]

const industries = ['All', 'Technology', 'Healthcare', 'Financial Services', 'Energy', 'Media & Entertainment']
const statuses = ['All', 'Pending', 'Completed', 'Terminated']
const dealSizes = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Mega Deals (>$10B)', min: 10000000000, max: Infinity },
  { label: 'Large Deals ($1B-$10B)', min: 1000000000, max: 10000000000 },
  { label: 'Mid-size Deals (<$1B)', min: 0, max: 1000000000 }
]

export default function DealsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedSize, setSelectedSize] = useState(0)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const filteredDeals = useMemo(() => {
    return mockDeals.filter(deal => {
      const matchesIndustry = selectedIndustry === 'All' || deal.industry === selectedIndustry
      const matchesStatus = selectedStatus === 'All' || deal.status === selectedStatus
      
      const selectedSizeRange = dealSizes[selectedSize]
      const matchesSize = deal.value >= selectedSizeRange.min && deal.value <= selectedSizeRange.max
      
      const matchesDateRange = !dateRange.start || !dateRange.end || 
        (new Date(deal.announcedDate) >= new Date(dateRange.start) && 
         new Date(deal.announcedDate) <= new Date(dateRange.end))
      
      return matchesIndustry && matchesStatus && matchesSize && matchesDateRange
    }).sort((a, b) => new Date(b.announcedDate).getTime() - new Date(a.announcedDate).getTime())
  }, [selectedIndustry, selectedStatus, selectedSize, dateRange])

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
    return `$${value.toFixed(0)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-terminal-green bg-terminal-green bg-opacity-20'
      case 'Pending': return 'text-yellow-400 bg-yellow-400 bg-opacity-20'
      case 'Terminated': return 'text-terminal-red bg-terminal-red bg-opacity-20'
      default: return 'text-gray-400 bg-gray-400 bg-opacity-20'
    }
  }

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0)
  const avgDealSize = filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-primary font-mono">M&A DEALS</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredDeals.length} deals • Total Value: {formatValue(totalValue)}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-terminal-primary" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Total Value</div>
                <div className="text-lg font-mono text-white">{formatValue(totalValue)}</div>
              </div>
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-terminal-green" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Avg Deal Size</div>
                <div className="text-lg font-mono text-white">{formatValue(avgDealSize)}</div>
              </div>
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-terminal-primary" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Active Deals</div>
                <div className="text-lg font-mono text-white">
                  {filteredDeals.filter(d => d.status === 'Pending').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Completion Rate</div>
                <div className="text-lg font-mono text-white">
                  {((filteredDeals.filter(d => d.status === 'Completed').length / filteredDeals.length) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Industry Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Deal Size Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedSize}
              onChange={(e) => setSelectedSize(Number(e.target.value))}
            >
              {dealSizes.map((size, index) => (
                <option key={index} value={index}>{size.label}</option>
              ))}
            </select>

            {/* Date Range */}
            <input
              type="date"
              placeholder="Start Date"
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />

            <input
              type="date"
              placeholder="End Date"
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedIndustry('All')
                setSelectedStatus('All')
                setSelectedSize(0)
                setDateRange({ start: '', end: '' })
              }}
              className="px-4 py-2 bg-terminal-border text-white rounded hover:bg-terminal-primary hover:text-black transition-colors font-mono text-sm"
            >
              CLEAR FILTERS
            </button>
          </div>
        </div>

        {/* Deals Timeline */}
        <div className="space-y-4">
          {filteredDeals.length === 0 ? (
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-8 text-center">
              <div className="text-gray-400 font-mono">No deals found matching current filters</div>
            </div>
          ) : (
            filteredDeals.map((deal) => (
              <div key={deal.id} className="bg-terminal-surface border border-terminal-border rounded-lg p-6 hover:bg-terminal-border transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-terminal-primary font-bold">{deal.acquirer.ticker}</span>
                        <span className="text-white">{deal.acquirer.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-terminal-primary" />
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-terminal-primary font-bold">{deal.target.ticker}</span>
                        <span className="text-white">{deal.target.name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 font-mono uppercase text-xs">Deal Value</div>
                        <div className="text-white font-mono text-lg">{formatValue(deal.value)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-mono uppercase text-xs">Premium</div>
                        <div className="text-white font-mono">{deal.premium.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-mono uppercase text-xs">Industry</div>
                        <div className="text-white">{deal.industry}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-mono uppercase text-xs">Announced</div>
                        <div className="text-white font-mono">
                          {new Date(deal.announcedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(deal.status)}`}>
                        {deal.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-xs">
                        Payment: {deal.paymentMethod}
                      </span>
                      <span className="text-gray-400 text-xs">
                        Synergies: {formatValue(deal.synergies)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
