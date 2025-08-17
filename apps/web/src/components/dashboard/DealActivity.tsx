'use client'

import Link from 'next/link'
import { LineChart } from '../charts'
import { useDealsStatsNew, useDeals } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function DealActivity() {
  // Fetch deals statistics and recent deals
  const { data: dealsStats, isLoading: statsLoading } = useDealsStatsNew()
  const { data: recentDeals = [], isLoading: dealsLoading } = useDeals({ page: 1, limit: 5 })
  
  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-terminal-primary font-bold text-lg">RECENT DEAL ACTIVITY</h2>
        <div className="text-xs text-gray-400">Last 7 Days</div>
      </div>
      
      <div className="space-y-3">
        {Array.isArray(recentDeals) && recentDeals.length > 0 ? (
          recentDeals.slice(0, 3).map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`}>
              <div className="border border-terminal-border rounded p-3 hover:bg-terminal-border transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-terminal-primary text-sm font-mono">
                      {deal.acquirer} → {deal.target}
                    </div>
                    <div className="text-white text-lg font-bold">{formatValue(deal.value_usd * 1000000)}</div>
                    <div className="text-gray-400 text-sm truncate">{deal.title}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono px-2 py-1 rounded ${
                      deal.status.toLowerCase() === 'pending' ? 'bg-yellow-600 text-white' :
                      deal.status.toLowerCase() === 'closed' ? 'bg-terminal-green text-white' :
                      deal.status.toLowerCase() === 'terminated' ? 'bg-red-600 text-white' :
                      'bg-terminal-primary text-black'
                    }`}>
                      {deal.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(deal.date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-gray-400 py-4">
            {recentDeals === undefined ? 'Loading deals...' : 'No recent deals available'}
          </div>
        )}
      </div>
      
      {/* Deals Per Month Chart */}
      {dealsStats && dealsStats.byMonth && Array.isArray(dealsStats.byMonth) && (
        <div className="mt-4 pt-4 border-t border-terminal-border">
          <h3 className="text-terminal-primary font-mono text-sm mb-3">DEALS PER MONTH (12M)</h3>
          <div className="h-24">
            <LineChart
              data={dealsStats.byMonth.slice(-12).map(item => ({
                month: item.month.split(' ')[0], // Extract month name
                count: item.count
              }))}
              lines={[{ key: 'count', name: 'Deals', color: '#FFD700' }]}
              height={96}
              xAxisKey="month"
              showGrid={false}
              showLegend={false}
              showTooltip={true}
              formatTooltipValue={(value, name) => [`${value} deals`, name]}
              margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
              strokeWidth={2}
              aria-label="Monthly deal activity trend over last 12 months"
            />
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-terminal-border">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <div>
              <div className="text-terminal-primary text-xl font-mono">{Array.isArray(recentDeals) ? recentDeals.length : 0}</div>
              <div className="text-xs text-gray-400">Recent</div>
            </div>
            <div>
              <div className="text-terminal-green text-xl font-mono">
                {formatValue(Array.isArray(recentDeals) ? recentDeals.reduce((sum, deal) => sum + (deal.value_usd * 1000000), 0) : 0)}
              </div>
              <div className="text-xs text-gray-400">Total Value</div>
            </div>
            <div>
              <div className="text-terminal-primary text-xl font-mono">
                {Array.isArray(recentDeals) ? recentDeals.filter(d => d.status.toLowerCase() === 'closed').length : 0}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>
          <Link 
            href="/deals"
            className="ml-6 px-4 py-2 bg-terminal-primary text-black rounded hover:bg-yellow-600 transition-colors font-mono text-xs font-bold whitespace-nowrap"
          >
            VIEW ALL DEALS
          </Link>
        </div>
      </div>
    </div>
  )
}
