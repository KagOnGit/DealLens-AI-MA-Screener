'use client'

import Link from 'next/link'
import { LineChart } from '../charts'
import { getDealsStats } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function DealActivity() {
  // Fetch deals statistics
  const { data: dealsStats } = useQuery({
    queryKey: ['deals-stats'],
    queryFn: () => getDealsStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const recentDeals = [
    {
      id: '1',
      acquirer: 'TechCorp Inc.',
      target: 'AI Innovations Ltd.',
      value: '$2.5B',
      status: 'announced',
      date: '2024-01-16'
    },
    {
      id: '2',
      acquirer: 'MegaBank',
      target: 'FinTech Solutions',
      value: '$1.2B',
      status: 'pending',
      date: '2024-01-15'
    },
    {
      id: '3',
      acquirer: 'Global Energy',
      target: 'Clean Power Co.',
      value: '$850M',
      status: 'completed',
      date: '2024-01-14'
    }
  ]

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-terminal-primary font-bold text-lg">RECENT DEAL ACTIVITY</h2>
        <div className="text-xs text-gray-400">Last 7 Days</div>
      </div>
      
      <div className="space-y-3">
        {recentDeals.map((deal) => (
          <div key={deal.id} className="border border-terminal-border rounded p-3 hover:bg-terminal-border transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-terminal-primary text-sm font-mono">
                  {deal.acquirer} → {deal.target}
                </div>
                <div className="text-white text-lg font-bold">{deal.value}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-mono px-2 py-1 rounded ${
                  deal.status === 'announced' ? 'bg-terminal-primary text-black' :
                  deal.status === 'pending' ? 'bg-yellow-600 text-white' :
                  'bg-terminal-green text-white'
                }`}>
                  {deal.status.toUpperCase()}
                </div>
                <div className="text-xs text-gray-400 mt-1">{deal.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Deals Per Month Chart */}
      {dealsStats && (
        <div className="mt-4 pt-4 border-t border-terminal-border">
          <h3 className="text-terminal-primary font-mono text-sm mb-3">DEALS PER MONTH (12M)</h3>
          <div className="h-24">
            <LineChart
              data={dealsStats.deals_by_month.slice(-12).map(item => ({
                month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
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
              <div className="text-terminal-primary text-xl font-mono">12</div>
              <div className="text-xs text-gray-400">This Week</div>
            </div>
            <div>
              <div className="text-terminal-green text-xl font-mono">$45.2B</div>
              <div className="text-xs text-gray-400">Total Value</div>
            </div>
            <div>
              <div className="text-terminal-primary text-xl font-mono">8</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
          </div>
          <Link 
            href="/deals?industry=All&status=All&size=0"
            className="ml-6 px-4 py-2 bg-terminal-primary text-black rounded hover:bg-yellow-600 transition-colors font-mono text-xs font-bold whitespace-nowrap"
          >
            VIEW ALL DEALS
          </Link>
        </div>
      </div>
    </div>
  )
}
