'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CompanyHoverCard } from '../companies/CompanyHoverCard'
import { CompanySparkline } from '../charts'

export function TopCompanies() {
  const [currentTime, setCurrentTime] = useState<string>('--:--:--')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])
  const companies = [
    { ticker: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 2.31, marketCap: '2.8T', sector: 'Technology' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: 342.45, change: -1.20, marketCap: '2.5T', sector: 'Technology' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 134.56, change: 1.89, marketCap: '1.6T', sector: 'Communication' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 142.33, change: 0.95, marketCap: '1.4T', sector: 'Consumer Disc.' },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: 238.45, change: -3.45, marketCap: '800B', sector: 'Consumer Disc.' },
    { ticker: 'META', name: 'Meta Platforms', price: 298.67, change: 4.23, marketCap: '750B', sector: 'Communication' },
  ]

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-terminal-primary font-bold text-lg">TOP COMPANIES BY MARKET CAP</h2>
        <div className="text-xs text-gray-400">Live Data</div>
      </div>
      
      <div className="overflow-x-auto terminal-scrollbar">
        <table className="terminal-table w-full text-sm font-mono">
          <thead>
            <tr className="text-terminal-primary border-b border-terminal-border">
              <th className="text-left py-2 px-3">TICKER</th>
              <th className="text-left py-2 px-3">NAME</th>
              <th className="text-right py-2 px-3">PRICE</th>
              <th className="text-right py-2 px-3">CHANGE</th>
              <th className="text-center py-2 px-3">TREND</th>
              <th className="text-right py-2 px-3">MKT CAP</th>
              <th className="text-left py-2 px-3">SECTOR</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr key={company.ticker} className={`hover:bg-terminal-border transition-colors ${
                index % 2 === 0 ? 'bg-black' : 'bg-terminal-surface'
              }`}>
                <td className="py-2 px-3 text-terminal-primary font-bold">{company.ticker}</td>
                <td className="py-2 px-3 text-white">
                  <CompanyHoverCard ticker={company.ticker}>
                    <Link 
                      href={`/companies/${company.ticker}`} 
                      className="hover:text-terminal-primary transition-colors"
                    >
                      {company.name}
                    </Link>
                  </CompanyHoverCard>
                </td>
                <td className="py-2 px-3 text-right text-white">${company.price.toFixed(2)}</td>
                <td className={`py-2 px-3 text-right ${
                  company.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                }`}>
                  {company.change >= 0 ? '+' : ''}{company.change.toFixed(2)}
                </td>
                <td className="py-2 px-3 flex justify-center items-center">
                  <CompanySparkline ticker={company.ticker} className="opacity-80" />
                </td>
                <td className="py-2 px-3 text-right text-white">${company.marketCap}</td>
                <td className="py-2 px-3 text-gray-400">{company.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t border-terminal-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-terminal-primary flex space-x-6">
            <span>Total Market Cap: $10.85T</span>
            <span>Avg P/E: 24.7</span>
            <span>Updated: {currentTime}</span>
          </div>
          <Link 
            href="/companies?sector=All&marketCap=0&sort=marketCap&order=desc"
            className="px-4 py-2 bg-terminal-primary text-black rounded hover:bg-yellow-600 transition-colors font-mono text-xs font-bold"
          >
            VIEW ALL COMPANIES
          </Link>
        </div>
      </div>
    </div>
  )
}
