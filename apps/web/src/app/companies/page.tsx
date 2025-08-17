'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react'

// Mock data
const mockCompanies = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 189.84,
    change: 2.31,
    changePercent: 1.23,
    marketCap: 2800000000000,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    country: 'United States',
    employees: 161000
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: 342.45,
    change: -1.20,
    changePercent: -0.35,
    marketCap: 2500000000000,
    sector: 'Technology',
    industry: 'Software',
    country: 'United States',
    employees: 221000
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 134.56,
    change: 1.89,
    changePercent: 1.42,
    marketCap: 1600000000000,
    sector: 'Communication Services',
    industry: 'Internet Content',
    country: 'United States',
    employees: 182000
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 142.33,
    change: 0.95,
    changePercent: 0.67,
    marketCap: 1400000000000,
    sector: 'Consumer Discretionary',
    industry: 'E-commerce',
    country: 'United States',
    employees: 1540000
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    price: 238.45,
    change: -3.45,
    changePercent: -1.43,
    marketCap: 800000000000,
    sector: 'Consumer Discretionary',
    industry: 'Electric Vehicles',
    country: 'United States',
    employees: 140000
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    price: 298.67,
    change: 4.23,
    changePercent: 1.44,
    marketCap: 750000000000,
    sector: 'Communication Services',
    industry: 'Social Media',
    country: 'United States',
    employees: 86000
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 485.12,
    change: 12.45,
    changePercent: 2.63,
    marketCap: 1200000000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    country: 'United States',
    employees: 29600
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 156.78,
    change: -0.89,
    changePercent: -0.56,
    marketCap: 450000000000,
    sector: 'Financial Services',
    industry: 'Banking',
    country: 'United States',
    employees: 293000
  }
]

const sectors = ['All', 'Technology', 'Financial Services', 'Communication Services', 'Consumer Discretionary']
const marketCapRanges = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Large Cap (>$10B)', min: 10000000000, max: Infinity },
  { label: 'Mid Cap ($2B-$10B)', min: 2000000000, max: 10000000000 },
  { label: 'Small Cap (<$2B)', min: 0, max: 2000000000 }
]

type SortField = 'ticker' | 'name' | 'price' | 'change' | 'marketCap'
type SortOrder = 'asc' | 'desc'

function CompaniesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('All')
  const [selectedMarketCap, setSelectedMarketCap] = useState(0)
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Initialize state from URL parameters
  useEffect(() => {
    if (searchParams) {
      const sector = searchParams.get('sector')
      const marketCap = searchParams.get('marketCap')
      const sort = searchParams.get('sort')
      const order = searchParams.get('order')
      const search = searchParams.get('search')
      const page = searchParams.get('page')
      
      if (sector && sectors.includes(sector)) setSelectedSector(sector)
      if (marketCap) setSelectedMarketCap(Number(marketCap))
      if (sort && ['ticker', 'name', 'price', 'change', 'marketCap'].includes(sort)) setSortField(sort as SortField)
      if (order && ['asc', 'desc'].includes(order)) setSortOrder(order as SortOrder)
      if (search) setSearchTerm(search)
      if (page) setCurrentPage(Number(page))
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

  const filteredAndSortedCompanies = useMemo(() => {
    const filtered = mockCompanies.filter(company => {
      const matchesSearch = company.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSector = selectedSector === 'All' || company.sector === selectedSector
      
      const selectedRange = marketCapRanges[selectedMarketCap]
      const matchesMarketCap = company.marketCap >= selectedRange.min && company.marketCap <= selectedRange.max
      
      return matchesSearch && matchesSector && matchesMarketCap
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [searchTerm, selectedSector, selectedMarketCap, sortField, sortOrder])

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCompanies.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedCompanies, currentPage])

  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    const newOrder = field === sortField ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
    setSortField(field)
    setSortOrder(newOrder)
    updateUrl({ sort: field, order: newOrder })
  }
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    updateUrl({ search: value, page: 1 })
  }
  
  const handleSectorChange = (value: string) => {
    setSelectedSector(value)
    setCurrentPage(1)
    updateUrl({ sector: value, page: 1 })
  }
  
  const handleMarketCapChange = (value: number) => {
    setSelectedMarketCap(value)
    setCurrentPage(1)
    updateUrl({ marketCap: value, page: 1 })
  }
  
  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedSector('All')
    setSelectedMarketCap(0)
    setCurrentPage(1)
    updateUrl({})
    router.replace(pathname)
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${value.toFixed(0)}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-primary font-mono">COMPANIES</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredAndSortedCompanies.length} companies found
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-primary h-4 w-4" />
              <input
                type="text"
                placeholder="Search by ticker or name..."
                className="w-full pl-10 pr-4 py-2 bg-black border border-terminal-border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-terminal-primary"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Sector Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedSector}
              onChange={(e) => handleSectorChange(e.target.value)}
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>

            {/* Market Cap Filter */}
            <select
              className="px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary"
              value={selectedMarketCap}
              onChange={(e) => handleMarketCapChange(Number(e.target.value))}
            >
              {marketCapRanges.map((range, index) => (
                <option key={index} value={index}>{range.label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-terminal-border text-white rounded hover:bg-terminal-primary hover:text-black transition-colors font-mono text-sm"
            >
              CLEAR FILTERS
            </button>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-terminal-border">
                <tr>
                  {[
                    { key: 'ticker', label: 'TICKER' },
                    { key: 'name', label: 'COMPANY NAME' },
                    { key: 'price', label: 'PRICE' },
                    { key: 'change', label: 'CHANGE' },
                    { key: 'marketCap', label: 'MARKET CAP' }
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-terminal-primary font-mono text-sm cursor-pointer hover:bg-terminal-primary hover:bg-opacity-10 transition-colors"
                      onClick={() => handleSort(key as SortField)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{label}</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-terminal-primary font-mono text-sm">SECTOR</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company, index) => (
                  <tr 
                    key={company.ticker}
                    className={`border-t border-terminal-border hover:bg-terminal-border transition-colors ${
                      index % 2 === 0 ? 'bg-black' : 'bg-terminal-surface'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-terminal-primary font-bold">
                      {company.ticker}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-white font-mono">
                      ${company.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center space-x-1">
                        {company.change >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-terminal-green" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-terminal-red" />
                        )}
                        <span className={company.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}>
                          {company.change >= 0 ? '+' : ''}{company.change.toFixed(2)}
                        </span>
                        <span className={`text-xs ${company.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                          ({company.changePercent >= 0 ? '+' : ''}{company.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white font-mono">
                      {formatMarketCap(company.marketCap)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {company.sector}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-terminal-border border-t border-terminal-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCompanies.length)} of {filteredAndSortedCompanies.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-terminal-primary text-black rounded disabled:bg-gray-600 disabled:text-gray-400 hover:bg-yellow-600 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-white">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-terminal-primary text-black rounded disabled:bg-gray-600 disabled:text-gray-400 hover:bg-yellow-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-terminal-primary font-mono">COMPANIES</h1>
              <p className="text-gray-400 text-sm mt-1">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <CompaniesPageContent />
    </Suspense>
  )
}
