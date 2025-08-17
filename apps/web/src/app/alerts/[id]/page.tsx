'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { getAlertDetail, markAlertRead, trackEvent } from '../../../lib/api'
import { AlertDetail, TimelineEntry, CompanySummary, NewsItem } from '../../../types'
import { notFound } from 'next/navigation'

interface AlertDetailPageProps {
  params: {
    id: string
  }
}

function getSeverityIcon(severity: AlertDetail['severity']) {
  switch (severity) {
    case 'critical':
      return <XMarkIcon className="h-5 w-5 text-red-500" />
    case 'high':
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
    case 'medium':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    case 'low':
    default:
      return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
  }
}

function getSeverityColor(severity: AlertDetail['severity']) {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800'
    case 'low':
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800'
  }
}

function TimelineComponent({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timeline.map((entry, idx) => (
          <li key={entry.id}>
            <div className="relative pb-8">
              {idx !== timeline.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                    entry.status === 'completed' ? 'bg-green-500' :
                    entry.status === 'pending' ? 'bg-yellow-400' : 'bg-red-500'
                  }`}>
                    <ClockIcon className="h-4 w-4 text-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{entry.title}</p>
                    {entry.description && (
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{entry.description}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={entry.date}>{format(new Date(entry.date), 'MMM d, yyyy')}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CompanyCard({ company }: { company: CompanySummary }) {
  return (
    <Link href={`/companies/${company.ticker}`} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {company.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {company.ticker} • {company.sector}
            </p>
            {company.market_cap && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Market Cap: ${(company.market_cap / 1000).toFixed(1)}B
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function NewsItem({ item }: { item: NewsItem }) {
  return (
    <a 
      href={item.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-colors"
    >
      <div className="flex items-start space-x-3">
        <NewspaperIcon className="h-5 w-5 text-gray-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {item.headline}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.source}</p>
            <span className="text-xs text-gray-400">•</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
            </p>
          </div>
          {item.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.summary}</p>
          )}
        </div>
      </div>
    </a>
  )
}

export default function AlertDetailPage({ params }: AlertDetailPageProps) {
  const [isRead, setIsRead] = useState(false)

  const { 
    data: alert, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['alert-detail', params.id],
    queryFn: () => getAlertDetail(params.id),
    staleTime: 60_000 // 60 seconds
  })

  const handleMarkRead = async () => {
    if (!alert || alert.read) return
    try {
      await markAlertRead(alert.id)
      setIsRead(true)
      trackEvent('alert_marked_read', { alert_id: alert.id })
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  const handleShare = async () => {
    if (!alert) return
    try {
      await navigator.share({
        title: alert.title,
        text: alert.body,
        url: window.location.href
      })
      trackEvent('alert_shared', { alert_id: alert.id })
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      trackEvent('alert_link_copied', { alert_id: alert.id })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !alert) {
    return notFound()
  }

  const isAlertRead = alert.read || isRead

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/alerts"
            className="inline-flex items-center text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Alerts
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
                Alert Details
              </h1>
              <div className="flex items-center space-x-4 text-sm text-[hsl(var(--muted-foreground))]">
                {alert.source && (
                  <span>Source: {alert.source}</span>
                )}
                <span>{format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}</span>
                <span>({formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })})</span>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center space-x-3">
              {!isAlertRead && (
                <button
                  onClick={handleMarkRead}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-1.5" />
                  Mark Read
                </button>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ShareIcon className="h-4 w-4 mr-1.5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Main Alert Card */}
        <div className="bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {getSeverityIcon(alert.severity)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--card-foreground))] mb-3">
                    {alert.title}
                  </h2>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    
                    {alert.type && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {alert.type.toUpperCase()}
                      </span>
                    )}
                    
                    {alert.ticker && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[hsl(var(--primary-100))] text-[hsl(var(--primary-800))] dark:bg-[hsl(var(--primary-800))] dark:text-[hsl(var(--primary-100))]">
                        {alert.ticker}
                      </span>
                    )}
                  </div>
                </div>
                
                {isAlertRead && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <EyeIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm">Read</span>
                  </div>
                )}
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-[hsl(var(--card-foreground))] whitespace-pre-wrap">
                  {alert.body}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deal Panel */}
          {alert.deal_detail && (
            <div className="bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BanknotesIcon className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">Deal Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Acquirer</p>
                    <p className="text-[hsl(var(--card-foreground))]">{alert.deal_detail.acquirer}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Target</p>
                    <p className="text-[hsl(var(--card-foreground))]">{alert.deal_detail.target}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Value</p>
                    <p className="text-xl font-bold text-[hsl(var(--card-foreground))]">
                      ${alert.deal_detail.value.toLocaleString()}M
                    </p>
                  </div>
                  {alert.deal_detail.premium && (
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Premium</p>
                      <p className="text-xl font-bold text-green-600">
                        +{alert.deal_detail.premium.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
                
                {alert.deal_detail.payment_mix && (
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Payment Mix</p>
                    <div className="flex items-center space-x-4 text-sm">
                      {alert.deal_detail.payment_mix.cash_percent && (
                        <span className="text-[hsl(var(--card-foreground))]">Cash: {alert.deal_detail.payment_mix.cash_percent}%</span>
                      )}
                      {alert.deal_detail.payment_mix.stock_percent && (
                        <span className="text-[hsl(var(--card-foreground))]">Stock: {alert.deal_detail.payment_mix.stock_percent}%</span>
                      )}
                    </div>
                  </div>
                )}
                
                {alert.deal_detail.rationale && (
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Rationale</p>
                    <p className="text-sm text-[hsl(var(--card-foreground))]">{alert.deal_detail.rationale}</p>
                  </div>
                )}
                
                {alert.deal_detail.synergies && (
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Synergies</p>
                    <p className="text-sm text-[hsl(var(--card-foreground))]">{alert.deal_detail.synergies}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {alert.key_metrics && (
            <div className="bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-5 w-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">Key Metrics</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {alert.key_metrics.ev_ebitda && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-2xl font-bold text-[hsl(var(--card-foreground))]">x{alert.key_metrics.ev_ebitda}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">EV/EBITDA</p>
                  </div>
                )}
                {alert.key_metrics.ev_sales && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-2xl font-bold text-[hsl(var(--card-foreground))]">x{alert.key_metrics.ev_sales}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">EV/Sales</p>
                  </div>
                )}
                {alert.key_metrics.pe_delta && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-2xl font-bold text-[hsl(var(--card-foreground))]">+{alert.key_metrics.pe_delta}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">P/E Delta</p>
                  </div>
                )}
                {alert.key_metrics.synergy_estimate && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-2xl font-bold text-[hsl(var(--card-foreground))]">$M{alert.key_metrics.synergy_estimate}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Synergies</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {alert.timeline && alert.timeline.length > 0 && (
            <div className="bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">Timeline</h3>
              </div>
              <TimelineComponent timeline={alert.timeline} />
            </div>
          )}

          {/* Related Companies */}
          {alert.related_companies && alert.related_companies.length > 0 && (
            <div className="bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BuildingOffice2Icon className="h-5 w-5 text-teal-500 mr-2" />
                <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">Related Companies</h3>
              </div>
              <div className="space-y-3">
                {alert.related_companies.map((company) => (
                  <CompanyCard key={company.ticker} company={company} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* News Section */}
        {alert.news_items && alert.news_items.length > 0 && (
          <div className="mt-8 bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6">
            <div className="flex items-center mb-4">
              <NewspaperIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">Related News</h3>
            </div>
            <div className="space-y-1">
              {alert.news_items.map((item) => (
                <NewsItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
