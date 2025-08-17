'use client'

import { useEffect, useState } from 'react'
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline'
import { ApiStatusBadge } from '../ApiStatusBadge'

export function Header() {
  const [currentTime, setCurrentTime] = useState<{ timeString: string; dateString: string }>({
    timeString: '--:--:--',
    dateString: '--- -- ----'
  })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        timeZone: 'America/New_York'
      })
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/New_York'
      })
      setCurrentTime({ timeString, dateString })
    }

    // Update time immediately and then every second
    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-terminal-surface border-b border-terminal-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-terminal-primary" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-terminal-border rounded-md bg-black text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-terminal-primary focus:border-transparent text-sm"
              placeholder="Search companies, deals, tickers..."
            />
          </div>
        </div>

        {/* Status and Time */}
        <div className="flex items-center space-x-6 ml-6">
          {/* Market Indices */}
          <div className="hidden md:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-terminal-primary">SPX</span>
              <span className="text-white">4567.89</span>
              <span className="text-terminal-green">+1.2%</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-terminal-primary">NDX</span>
              <span className="text-white">14234.56</span>
              <span className="text-terminal-green">+0.8%</span>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative text-terminal-primary hover:text-white transition-colors">
            <BellIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-terminal-red rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </button>

          {/* Time and Date */}
          <div className="text-right text-xs">
            <div className="text-terminal-primary font-mono">{currentTime.timeString} EST</div>
            <div className="text-gray-400">{currentTime.dateString}</div>
          </div>
        </div>
      </div>

      {/* Terminal-style status bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-terminal-primary">
        <div className="flex items-center space-x-6">
          <span>DEALLENS TERMINAL v0.1.0</span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-terminal-green rounded-full mr-1 animate-pulse" />
            CONNECTED
          </span>
          <ApiStatusBadge />
        </div>
        <div className="flex items-center space-x-4">
          <span>CPU: 45%</span>
          <span>MEM: 2.1GB</span>
          <span>DATA: REAL-TIME</span>
        </div>
      </div>
    </header>
  )
}
