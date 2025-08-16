'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BarChart3, TrendingUp, TrendingDown, PieChart, Activity, DollarSign, Target, Calendar } from 'lucide-react'

// Mock data
const sectorData = [
  { sector: 'Technology', deals: 45, value: 245000000000, percentage: 35 },
  { sector: 'Healthcare', deals: 28, value: 156000000000, percentage: 22 },
  { sector: 'Financial Services', deals: 22, value: 98000000000, percentage: 17 },
  { sector: 'Energy', deals: 18, value: 87000000000, percentage: 14 },
  { sector: 'Consumer Discretionary', deals: 15, value: 65000000000, percentage: 12 }
]

const monthlyData = [
  { month: 'Jan', deals: 12, value: 45.2 },
  { month: 'Feb', deals: 18, value: 67.8 },
  { month: 'Mar', deals: 15, value: 34.5 },
  { month: 'Apr', deals: 22, value: 89.1 },
  { month: 'May', deals: 28, value: 102.3 },
  { month: 'Jun', deals: 25, value: 78.9 },
  { month: 'Jul', deals: 30, value: 125.7 },
  { month: 'Aug', deals: 33, value: 156.4 },
  { month: 'Sep', deals: 27, value: 98.2 },
  { month: 'Oct', deals: 35, value: 178.9 },
  { month: 'Nov', deals: 29, value: 134.6 },
  { month: 'Dec', deals: 31, value: 167.3 }
]

const marketCapDistribution = [
  { range: 'Small Cap (<$2B)', count: 1250, percentage: 42 },
  { range: 'Mid Cap ($2B-$10B)', count: 890, percentage: 30 },
  { range: 'Large Cap ($10B-$200B)', count: 675, percentage: 23 },
  { range: 'Mega Cap (>$200B)', count: 145, percentage: 5 }
]

const performanceData = [
  { metric: 'Avg Deal Size', current: 3.2, previous: 2.8, change: 14.3 },
  { metric: 'Time to Close', current: 8.5, previous: 9.2, change: -7.6 },
  { metric: 'Success Rate', current: 87.3, previous: 82.1, change: 6.3 },
  { metric: 'Premium Paid', current: 28.4, previous: 32.1, change: -11.5 }
]

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('12M')

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
    return `$${value.toFixed(0)}`
  }

  const totalDeals = sectorData.reduce((sum, item) => sum + item.deals, 0)
  const totalValue = sectorData.reduce((sum, item) => sum + item.value, 0)
  const avgDealSize = totalValue / totalDeals
  const maxMonthlyValue = Math.max(...monthlyData.map(d => d.value))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-primary font-mono">ANALYTICS</h1>
            <p className="text-gray-400 text-sm mt-1">
              Market analysis and trends
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {['1M', '3M', '6M', '12M', '5Y'].map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  selectedTimeRange === range 
                    ? 'bg-terminal-primary text-black' 
                    : 'bg-terminal-border text-white hover:bg-terminal-primary hover:text-black'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Total Deal Value</div>
                <div className="text-xl font-mono text-white">{formatValue(totalValue)}</div>
                <div className="text-xs text-terminal-green mt-1">+12.5% YoY</div>
              </div>
              <DollarSign className="h-8 w-8 text-terminal-primary" />
            </div>
          </div>

          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Total Deals</div>
                <div className="text-xl font-mono text-white">{totalDeals}</div>
                <div className="text-xs text-terminal-green mt-1">+8.3% YoY</div>
              </div>
              <Target className="h-8 w-8 text-terminal-primary" />
            </div>
          </div>

          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Avg Deal Size</div>
                <div className="text-xl font-mono text-white">{formatValue(avgDealSize)}</div>
                <div className="text-xs text-terminal-green mt-1">+3.7% YoY</div>
              </div>
              <Activity className="h-8 w-8 text-terminal-primary" />
            </div>
          </div>

          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Success Rate</div>
                <div className="text-xl font-mono text-white">87.3%</div>
                <div className="text-xs text-terminal-green mt-1">+5.2% YoY</div>
              </div>
              <TrendingUp className="h-8 w-8 text-terminal-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Performance */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-terminal-primary">SECTOR PERFORMANCE</h3>
              <PieChart className="h-5 w-5 text-terminal-primary" />
            </div>
            
            <div className="space-y-4">
              {sectorData.map((item, index) => (
                <div key={item.sector} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">{item.sector}</span>
                    <div className="text-right">
                      <div className="text-white font-mono">{formatValue(item.value)}</div>
                      <div className="text-gray-400 text-xs">{item.deals} deals</div>
                    </div>
                  </div>
                  <div className="w-full bg-terminal-border rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Deal Volume */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-terminal-primary">MONTHLY DEAL VOLUME</h3>
              <BarChart3 className="h-5 w-5 text-terminal-primary" />
            </div>
            
            <div className="space-y-2">
              {monthlyData.map((item) => (
                <div key={item.month} className="flex items-center space-x-4">
                  <div className="w-8 text-xs text-gray-400 font-mono">{item.month}</div>
                  <div className="flex-1 flex items-center space-x-2">
                    <div className="flex-1 bg-terminal-border rounded h-4 relative overflow-hidden">
                      <div
                        className="h-full bg-terminal-primary transition-all duration-500"
                        style={{ width: `${(item.value / maxMonthlyValue) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <div className="text-xs text-white font-mono">{item.value}B</div>
                      <div className="text-xs text-gray-400">{item.deals}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Cap Distribution */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-terminal-primary">MARKET CAP DISTRIBUTION</h3>
              <Activity className="h-5 w-5 text-terminal-primary" />
            </div>
            
            <div className="space-y-4">
              {marketCapDistribution.map((item, index) => (
                <div key={item.range} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: `hsl(${(index * 90) % 360}, 70%, 50%)` }}
                    />
                    <span className="text-white text-sm">{item.range}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono text-sm">{item.count.toLocaleString()}</div>
                    <div className="text-gray-400 text-xs">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-terminal-border rounded">
              <div className="text-xs text-gray-400 mb-2">Total Companies Tracked</div>
              <div className="text-lg font-mono text-white">
                {marketCapDistribution.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-terminal-primary">PERFORMANCE METRICS</h3>
              <Calendar className="h-5 w-5 text-terminal-primary" />
            </div>
            
            <div className="space-y-4">
              {performanceData.map((item) => (
                <div key={item.metric} className="p-3 bg-terminal-border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">{item.metric}</span>
                    <div className="flex items-center space-x-2">
                      {item.change >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-terminal-green" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-terminal-red" />
                      )}
                      <span className={`text-xs font-mono ${
                        item.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                      }`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end space-x-4">
                    <div className="text-lg font-mono text-white">
                      {item.metric.includes('Size') ? formatValue(item.current * 1e9) : 
                       item.metric.includes('Time') ? `${item.current}mo` :
                       `${item.current.toFixed(1)}${item.metric.includes('Rate') || item.metric.includes('Premium') ? '%' : ''}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      vs {item.metric.includes('Size') ? formatValue(item.previous * 1e9) : 
                          item.metric.includes('Time') ? `${item.previous}mo` :
                          `${item.previous.toFixed(1)}${item.metric.includes('Rate') || item.metric.includes('Premium') ? '%' : ''}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
          <h3 className="text-lg font-mono text-terminal-primary mb-4">KEY INSIGHTS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-terminal-border rounded">
              <div className="text-terminal-green text-sm font-mono mb-2">⬆ TRENDING UP</div>
              <div className="text-white text-sm mb-1">Technology M&A Activity</div>
              <div className="text-gray-400 text-xs">35% of total deal value in Q4, driven by AI acquisitions</div>
            </div>
            <div className="p-4 bg-terminal-border rounded">
              <div className="text-terminal-primary text-sm font-mono mb-2">→ STABLE</div>
              <div className="text-white text-sm mb-1">Average Deal Premiums</div>
              <div className="text-gray-400 text-xs">Premiums stabilizing around 28-30% across sectors</div>
            </div>
            <div className="p-4 bg-terminal-border rounded">
              <div className="text-terminal-red text-sm font-mono mb-2">⬇ DECLINING</div>
              <div className="text-white text-sm mb-1">Time to Close</div>
              <div className="text-gray-400 text-xs">Regulatory approvals faster, avg 8.5 months vs 9.2</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
