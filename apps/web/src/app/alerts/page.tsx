'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  LayoutGrid,
  List,
  X,
  Check
} from 'lucide-react'

// Mock alerts data
const mockAlerts = [
  {
    id: '1',
    type: 'deal',
    title: 'Major Tech Acquisition Announced',
    message: 'Microsoft announced acquisition of OpenAI-related startup for $2.5B',
    timestamp: '2024-01-16T10:30:00Z',
    severity: 'high',
    category: 'M&A',
    ticker: 'MSFT',
    isRead: false,
    isActive: true
  },
  {
    id: '2',
    type: 'price',
    title: 'Price Alert Triggered',
    message: 'ACME Corp (ACME) up 15% on acquisition rumors',
    timestamp: '2024-01-16T09:15:00Z',
    severity: 'medium',
    category: 'Price',
    ticker: 'ACME',
    isRead: false,
    isActive: true
  },
  {
    id: '3',
    type: 'earnings',
    title: 'Earnings Beat Expectations',
    message: 'Apple reported Q4 earnings 20% above analyst expectations',
    timestamp: '2024-01-15T16:00:00Z',
    severity: 'low',
    category: 'Earnings',
    ticker: 'AAPL',
    isRead: true,
    isActive: true
  },
  {
    id: '4',
    type: 'system',
    title: 'Data Update Complete',
    message: 'Financial metrics updated for 1,247 companies',
    timestamp: '2024-01-15T07:30:00Z',
    severity: 'low',
    category: 'Data',
    ticker: null,
    isRead: true,
    isActive: true
  },
  {
    id: '5',
    type: 'deal',
    title: 'Deal Status Change',
    message: 'Broadcom-VMware deal received final regulatory approval',
    timestamp: '2024-01-14T14:20:00Z',
    severity: 'medium',
    category: 'M&A',
    ticker: 'AVGO',
    isRead: false,
    isActive: true
  },
  {
    id: '6',
    type: 'price',
    title: 'Volume Spike Alert',
    message: 'Tesla trading volume 300% above average',
    timestamp: '2024-01-14T11:45:00Z',
    severity: 'medium',
    category: 'Price',
    ticker: 'TSLA',
    isRead: true,
    isActive: true
  },
  {
    id: '7',
    type: 'earnings',
    title: 'Earnings Warning',
    message: 'Netflix pre-announced Q4 guidance below estimates',
    timestamp: '2024-01-13T20:00:00Z',
    severity: 'high',
    category: 'Earnings',
    ticker: 'NFLX',
    isRead: false,
    isActive: true
  },
  {
    id: '8',
    type: 'deal',
    title: 'Deal Termination',
    message: 'Illumina-GRAIL deal terminated due to regulatory concerns',
    timestamp: '2024-01-12T13:30:00Z',
    severity: 'high',
    category: 'M&A',
    ticker: 'ILMN',
    isRead: true,
    isActive: false
  }
]

const severities = ['All', 'High', 'Medium', 'Low']
const categories = ['All', 'M&A', 'Price', 'Earnings', 'Data']
const statuses = ['All', 'Active', 'Dismissed']

export default function AlertsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter(alert => {
      const matchesSeverity = selectedSeverity === 'All' || alert.severity.toLowerCase() === selectedSeverity.toLowerCase()
      const matchesCategory = selectedCategory === 'All' || alert.category === selectedCategory
      const matchesStatus = selectedStatus === 'All' || 
        (selectedStatus === 'Active' ? alert.isActive : !alert.isActive)
      const matchesReadState = !showUnreadOnly || !alert.isRead

      return matchesSeverity && matchesCategory && matchesStatus && matchesReadState
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [selectedSeverity, selectedCategory, selectedStatus, showUnreadOnly])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-terminal-red bg-terminal-red'
      case 'medium': return 'text-yellow-400 bg-yellow-400'
      case 'low': return 'text-terminal-green bg-terminal-green'
      default: return 'text-gray-400 bg-gray-400'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'deal': return Bell
      case 'price': return TrendingUp
      case 'earnings': return DollarSign
      case 'system': return Info
      default: return Bell
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const alertCounts = {
    total: mockAlerts.length,
    unread: mockAlerts.filter(a => !a.isRead).length,
    high: mockAlerts.filter(a => a.severity === 'high' && a.isActive).length,
    active: mockAlerts.filter(a => a.isActive).length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-primary font-mono">ALERTS</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredAlerts.length} alerts • {alertCounts.unread} unread
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-terminal-primary text-black' 
                  : 'bg-terminal-border text-white hover:bg-terminal-primary hover:text-black'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table' 
                  ? 'bg-terminal-primary text-black' 
                  : 'bg-terminal-border text-white hover:bg-terminal-primary hover:text-black'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-terminal-primary" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Total Alerts</div>
                <div className="text-lg font-mono text-white">{alertCounts.total}</div>
              </div>
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Unread</div>
                <div className="text-lg font-mono text-white">{alertCounts.unread}</div>
              </div>
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-terminal-red" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">High Priority</div>
                <div className="text-lg font-mono text-white">{alertCounts.high}</div>
              </div>
            </div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-terminal-green" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Active</div>
                <div className="text-lg font-mono text-white">{alertCounts.active}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Severity Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              {severities.map(severity => (
                <option key={severity} value={severity}>{severity} Severity</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
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

            {/* Unread Toggle */}
            <label className="flex items-center space-x-2 px-4 py-2 bg-black border border-terminal-border rounded cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-terminal-primary"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
              <span className="text-white text-sm">Unread only</span>
            </label>
          </div>
          
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => {
                setSelectedSeverity('All')
                setSelectedCategory('All')
                setSelectedStatus('All')
                setShowUnreadOnly(false)
              }}
              className="px-4 py-2 bg-terminal-border text-white rounded hover:bg-terminal-primary hover:text-black transition-colors font-mono text-sm"
            >
              CLEAR FILTERS
            </button>
            
            <button className="px-4 py-2 bg-terminal-primary text-black rounded hover:bg-yellow-600 transition-colors font-mono text-sm">
              MARK ALL AS READ
            </button>
          </div>
        </div>

        {/* Alerts Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlerts.length === 0 ? (
              <div className="col-span-full bg-terminal-surface border border-terminal-border rounded-lg p-8 text-center">
                <div className="text-gray-400 font-mono">No alerts found matching current filters</div>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const IconComponent = getIcon(alert.type)
                return (
                  <div 
                    key={alert.id} 
                    className={`bg-terminal-surface border rounded-lg p-4 hover:bg-terminal-border transition-colors ${
                      alert.isRead ? 'border-terminal-border' : 'border-terminal-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`h-4 w-4 ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                        <span className={`px-2 py-1 rounded text-xs font-mono ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.ticker && (
                          <span className="text-terminal-primary text-xs font-mono">{alert.ticker}</span>
                        )}
                        <div className="text-gray-400 text-xs">{formatTimestamp(alert.timestamp)}</div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <h4 className="text-terminal-primary text-sm font-mono mb-1">{alert.title}</h4>
                      <p className="text-white text-xs leading-relaxed">{alert.message}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{alert.category}</span>
                      <div className="flex space-x-2">
                        {!alert.isRead && (
                          <button className="text-terminal-primary hover:text-white text-xs">
                            Mark Read
                          </button>
                        )}
                        <button className="text-terminal-red hover:text-red-400 text-xs">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-terminal-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">TYPE</th>
                    <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">ALERT</th>
                    <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">TICKER</th>
                    <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">SEVERITY</th>
                    <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">TIME</th>
                    <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, index) => {
                    const IconComponent = getIcon(alert.type)
                    return (
                      <tr 
                        key={alert.id}
                        className={`border-t border-terminal-border hover:bg-terminal-border transition-colors ${
                          index % 2 === 0 ? 'bg-black' : 'bg-terminal-surface'
                        } ${!alert.isRead ? 'border-l-4 border-l-terminal-primary' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <IconComponent className={`h-4 w-4 ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                            <span className="text-gray-400 text-xs">{alert.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-terminal-primary text-sm font-mono">{alert.title}</div>
                            <div className="text-gray-400 text-xs">{alert.message}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-terminal-primary font-mono">
                          {alert.ticker || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {formatTimestamp(alert.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            {!alert.isRead && (
                              <button className="text-terminal-primary hover:text-white text-xs">
                                Read
                              </button>
                            )}
                            <button className="text-terminal-red hover:text-red-400 text-xs">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
