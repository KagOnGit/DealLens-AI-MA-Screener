'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Building2,
  Users,
  Calendar,
  Globe,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Download,
  Eye,
  BookOpen,
  Brain,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

// Mock data - replace with API calls
const getCompanyData = (ticker: string) => {
  const companies = {
    'AAPL': {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 3200000000000,
      currentPrice: 195.50,
      priceChange: 2.75,
      priceChangePercent: 1.43,
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company serves consumers, and small and mid-sized businesses; and the education, enterprise, and government markets.',
      employees: 164000,
      founded: 1976,
      headquarters: 'Cupertino, CA',
      website: 'https://www.apple.com',
      ceo: 'Tim Cook',
      revenue: 394328000000,
      netIncome: 99803000000,
      pe: 32.4,
      pb: 49.8,
      roe: 175.1,
      debtToEquity: 195.3,
      currentRatio: 1.04,
      grossMargin: 44.1,
      operatingMargin: 30.1,
      netMargin: 25.3,
      beta: 1.24,
      fiftyTwoWeekHigh: 199.62,
      fiftyTwoWeekLow: 164.08,
      avgVolume: 45672000,
      sharesOutstanding: 15634000000
    },
    'MSFT': {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software',
      marketCap: 2900000000000,
      currentPrice: 420.15,
      priceChange: -3.25,
      priceChangePercent: -0.77,
      description: 'Microsoft Corporation develops and supports software, services, devices and solutions worldwide. The company operates in three segments: Productivity and Business Processes, More Personal Computing, and Intelligent Cloud.',
      employees: 221000,
      founded: 1975,
      headquarters: 'Redmond, WA',
      website: 'https://www.microsoft.com',
      ceo: 'Satya Nadella',
      revenue: 211915000000,
      netIncome: 72361000000,
      pe: 35.2,
      pb: 13.8,
      roe: 41.6,
      debtToEquity: 47.0,
      currentRatio: 1.25,
      grossMargin: 68.4,
      operatingMargin: 41.6,
      netMargin: 34.1,
      beta: 0.89,
      fiftyTwoWeekHigh: 425.50,
      fiftyTwoWeekLow: 309.45,
      avgVolume: 32145000,
      sharesOutstanding: 7430000000
    }
  }
  
  return companies[ticker as keyof typeof companies] || companies['AAPL']
}

const getMockMAActivity = (ticker: string) => [
  {
    id: '1',
    type: 'acquirer',
    date: '2024-01-15',
    target: 'AI Startup Inc.',
    value: 2500000000,
    status: 'completed',
    description: `${ticker} acquired AI Startup Inc. for $2.5B to strengthen AI capabilities`
  },
  {
    id: '2',
    type: 'target_rumor',
    date: '2023-11-20',
    acquirer: 'Private Equity Firm',
    value: null,
    status: 'rumored',
    description: `Rumors of potential acquisition by Private Equity at premium valuation`
  },
  {
    id: '3',
    type: 'strategic_investment',
    date: '2023-08-10',
    partner: 'Tech Innovation Fund',
    value: 500000000,
    status: 'completed',
    description: `Strategic partnership and investment in emerging technologies`
  }
]

const getMockStockData = () => [
  { date: '2024-01-16', price: 195.50, volume: 45672000 },
  { date: '2024-01-15', price: 192.75, volume: 52143000 },
  { date: '2024-01-12', price: 191.20, volume: 41256000 },
  { date: '2024-01-11', price: 189.85, volume: 48932000 },
  { date: '2024-01-10', price: 188.40, volume: 55673000 },
  { date: '2024-01-09', price: 186.95, volume: 42189000 },
  { date: '2024-01-08', price: 185.30, volume: 47821000 }
]

const getMockAIInsights = (ticker: string) => ({
  summary: `${ticker} demonstrates strong fundamentals with consistent revenue growth and market leadership. The company maintains a robust balance sheet with strong cash position, making it attractive for both growth investments and potential acquisition scenarios.`,
  strengths: [
    'Market-leading position in core segments',
    'Strong brand recognition and customer loyalty',
    'Robust financial performance and cash generation',
    'Innovation pipeline and R&D investments'
  ],
  risks: [
    'Regulatory scrutiny and antitrust concerns',
    'Market saturation in core products',
    'Increasing competition from emerging players',
    'Economic sensitivity and cyclical demand'
  ],
  investmentOutlook: 'BUY',
  confidenceScore: 82,
  lastUpdated: '2024-01-16T10:30:00Z'
})

export default function CompanyDetailPage() {
  const params = useParams()
  const ticker = (params.ticker as string)?.toUpperCase()
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAIInsights, setShowAIInsights] = useState(true)
  
  const company = getCompanyData(ticker)
  const maActivity = getMockMAActivity(ticker)
  const stockData = getMockStockData()
  const aiInsights = getMockAIInsights(ticker)

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${value.toLocaleString()}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
    return value.toLocaleString()
  }

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: Building2 },
    { id: 'financials', label: 'FINANCIALS', icon: BarChart3 },
    { id: 'ma-activity', label: 'M&A ACTIVITY', icon: Activity },
    { id: 'charts', label: 'CHARTS', icon: TrendingUp }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/companies"
              className="p-2 bg-terminal-surface border border-terminal-border rounded hover:bg-terminal-border transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-terminal-primary font-mono">
                  {company.ticker}
                </h1>
                <button
                  onClick={() => setIsWatchlisted(!isWatchlisted)}
                  className={`p-2 rounded transition-colors ${
                    isWatchlisted 
                      ? 'bg-terminal-primary text-black' 
                      : 'bg-terminal-surface border border-terminal-border text-white hover:bg-terminal-border'
                  }`}
                >
                  <Star className={`h-4 w-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              <p className="text-white text-lg">{company.name}</p>
              <p className="text-gray-400 text-sm">{company.sector} • {company.industry}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-mono text-white">
              ${company.currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center space-x-1 ${
              company.priceChange >= 0 ? 'text-terminal-green' : 'text-terminal-red'
            }`}>
              {company.priceChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-mono">
                {company.priceChange >= 0 ? '+' : ''}{company.priceChange.toFixed(2)} 
                ({company.priceChangePercent >= 0 ? '+' : ''}{company.priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        {showAIInsights && (
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="font-mono text-purple-400">AI INSIGHTS</span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded font-mono">
                  {aiInsights.confidenceScore}% CONFIDENCE
                </span>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-200 leading-relaxed">{aiInsights.summary}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-terminal-green font-mono text-sm mb-2">STRENGTHS</h4>
                  <ul className="space-y-1">
                    {aiInsights.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 text-terminal-green mt-1 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-terminal-red font-mono text-sm mb-2">RISKS</h4>
                  <ul className="space-y-1">
                    {aiInsights.risks.map((risk, index) => (
                      <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                        <AlertTriangle className="h-3 w-3 text-terminal-red mt-1 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 text-sm">Investment Outlook:</span>
                  <span className={`px-3 py-1 rounded font-mono text-sm ${
                    aiInsights.investmentOutlook === 'BUY' ? 'bg-terminal-green text-black' :
                    aiInsights.investmentOutlook === 'SELL' ? 'bg-terminal-red text-white' :
                    'bg-yellow-600 text-black'
                  }`}>
                    {aiInsights.investmentOutlook}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  Updated: {new Date(aiInsights.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase font-mono mb-1">Market Cap</div>
            <div className="text-lg font-mono text-white">{formatCurrency(company.marketCap)}</div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase font-mono mb-1">P/E Ratio</div>
            <div className="text-lg font-mono text-white">{company.pe}</div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase font-mono mb-1">Revenue TTM</div>
            <div className="text-lg font-mono text-white">{formatCurrency(company.revenue)}</div>
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase font-mono mb-1">Beta</div>
            <div className="text-lg font-mono text-white">{company.beta}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-terminal-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-mono text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-terminal-primary text-terminal-primary'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Profile */}
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-mono text-terminal-primary mb-4">COMPANY PROFILE</h3>
                <div className="space-y-4">
                  <p className="text-gray-300 leading-relaxed text-sm">{company.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-terminal-border">
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">CEO</div>
                      <div className="text-white">{company.ceo}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Employees</div>
                      <div className="text-white">{formatNumber(company.employees)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Founded</div>
                      <div className="text-white">{company.founded}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">HQ</div>
                      <div className="text-white">{company.headquarters}</div>
                    </div>
                  </div>
                  
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-terminal-primary hover:text-yellow-400 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Visit Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Key Ratios */}
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-mono text-terminal-primary mb-4">KEY RATIOS</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">ROE</div>
                      <div className="text-white font-mono">{company.roe}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Debt/Equity</div>
                      <div className="text-white font-mono">{company.debtToEquity}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Current Ratio</div>
                      <div className="text-white font-mono">{company.currentRatio}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">P/B Ratio</div>
                      <div className="text-white font-mono">{company.pb}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Gross Margin</div>
                      <div className="text-white font-mono">{company.grossMargin}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Operating Margin</div>
                      <div className="text-white font-mono">{company.operatingMargin}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">Net Margin</div>
                      <div className="text-white font-mono">{company.netMargin}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-mono">52W High</div>
                      <div className="text-white font-mono">${company.fiftyTwoWeekHigh}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ma-activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-mono text-terminal-primary">M&A ACTIVITY</h3>
                <span className="text-gray-400 text-sm">{maActivity.length} transactions</span>
              </div>
              
              {maActivity.map((activity) => (
                <div key={activity.id} className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                          activity.type === 'acquirer' ? 'bg-terminal-green text-black' :
                          activity.type === 'target_rumor' ? 'bg-yellow-600 text-black' :
                          'bg-blue-600 text-white'
                        }`}>
                          {activity.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                          activity.status === 'completed' ? 'bg-terminal-green text-black' :
                          activity.status === 'rumored' ? 'bg-yellow-600 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {activity.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <h4 className="text-white font-mono mb-2">
                        {activity.target && `Target: ${activity.target}`}
                        {activity.acquirer && `Acquirer: ${activity.acquirer}`}
                        {activity.partner && `Partner: ${activity.partner}`}
                      </h4>
                      
                      <p className="text-gray-300 text-sm mb-3">{activity.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                        {activity.value && (
                          <span>{formatCurrency(activity.value)}</span>
                        )}
                      </div>
                    </div>
                    
                    <button className="ml-4 p-2 bg-terminal-border rounded hover:bg-terminal-primary hover:text-black transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional tab content would go here */}
          {activeTab === 'financials' && (
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <h3 className="text-lg font-mono text-terminal-primary mb-4">FINANCIAL STATEMENTS</h3>
              <p className="text-gray-400">Financial data integration coming soon...</p>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <h3 className="text-lg font-mono text-terminal-primary mb-4">PRICE CHARTS</h3>
              <p className="text-gray-400">Interactive charts integration coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
