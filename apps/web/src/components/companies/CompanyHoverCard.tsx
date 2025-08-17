'use client'

import { ReactNode } from 'react'
import * as HoverCard from '@radix-ui/react-hover-card'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { BuildingOffice2Icon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { getCompany } from '../../lib/api'
import { Company } from '../../types'

interface CompanyHoverCardProps {
  ticker: string
  children: ReactNode
  prefetch?: boolean
}

function CompanyPreview({ company }: { company: Company }) {
  return (
    <div className="w-80 p-4">
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <BuildingOffice2Icon className="h-10 w-10 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[hsl(var(--popover-foreground))] truncate">
            {company.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {company.ticker}
            </span>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              • {company.sector}
            </span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {company.industry}
          </p>
        </div>
      </div>

      {company.description && (
        <p className="text-sm text-[hsl(var(--popover-foreground))] mb-4 line-clamp-3">
          {company.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Market Cap
          </p>
          <p className="text-lg font-bold text-[hsl(var(--popover-foreground))]">
            ${company.market_cap ? (company.market_cap / 1000).toFixed(1) : '0.0'}B
          </p>
        </div>
        <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Price
          </p>
          <div className="flex items-center space-x-1">
            <p className="text-lg font-bold text-[hsl(var(--popover-foreground))]">
              ${company.price ? company.price.toFixed(2) : '0.00'}
            </p>
            <span className={`text-sm font-medium ${
              (company.change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ({(company.change ?? 0) >= 0 ? '+' : ''}{company.change_percent ? company.change_percent.toFixed(2) : '0.00'}%)
            </span>
          </div>
        </div>
      </div>

      {(company.pe_ratio || company.ev_ebitda || company.revenue) && (
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          {company.pe_ratio && (
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--popover-foreground))]">
                {company.pe_ratio.toFixed(1)}x
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">P/E</p>
            </div>
          )}
          {company.ev_ebitda && (
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--popover-foreground))]">
                {company.ev_ebitda.toFixed(1)}x
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">EV/EBITDA</p>
            </div>
          )}
          {company.revenue && (
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--popover-foreground))]">
                ${(company.revenue / 1000).toFixed(1)}B
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Revenue</p>
            </div>
          )}
        </div>
      )}

      <Link 
        href={`/companies/${company.ticker}`}
        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        View Company
        <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
      </Link>
    </div>
  )
}

function CompanyPreviewSkeleton() {
  return (
    <div className="w-80 p-4 animate-pulse">
      <div className="flex items-start space-x-3 mb-4">
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
      <div className="h-12 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-16 bg-gray-200 rounded-lg" />
        <div className="h-16 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  )
}

export function CompanyHoverCard({ ticker, children, prefetch = true }: CompanyHoverCardProps) {
  const { data: company, isLoading, error, refetch } = useQuery({
    queryKey: ['company', ticker],
    queryFn: () => getCompany(ticker),
    staleTime: 300_000, // 5 minutes
    enabled: false, // Only fetch when hover card opens
  })

  const handleMouseEnter = () => {
    if (prefetch && !company) {
      refetch()
    }
  }

  return (
    <HoverCard.Root openDelay={300} closeDelay={150}>
      <HoverCard.Trigger asChild onMouseEnter={handleMouseEnter}>
        {children}
      </HoverCard.Trigger>
      
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={8}
          className="bg-[hsl(var(--popover-background))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 transform transition-all duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {isLoading ? (
            <CompanyPreviewSkeleton />
          ) : error || !company ? (
            <div className="w-80 p-4 text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Company information unavailable
              </p>
            </div>
          ) : (
            <CompanyPreview company={company} />
          )}
          
          <HoverCard.Arrow className="fill-[hsl(var(--popover-background))]" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
