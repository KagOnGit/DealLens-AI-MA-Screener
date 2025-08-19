'use client'

import { useEffect, useState, useRef } from 'react'
import { ApiStatusBadge } from '../ApiStatusBadge'
import { NotificationsPopover } from '../notifications/NotificationsPopover'
import { GlobalSearch } from '../search/GlobalSearch'

export function Header() {
  const [currentTime, setCurrentTime] = useState<{ timeString: string; dateString: string }>({
    timeString: '--:--:--',
    dateString: '--- -- ----'
  })
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Hover handlers for notifications
  const handleNotificationsMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setNotificationsOpen(true)
  }

  const handleNotificationsMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setNotificationsOpen(false)
    }, 120) // 120ms delay as specified
  }

  const handlePopoverMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handlePopoverMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setNotificationsOpen(false)
    }, 120)
  }

  return (
    <header className="bg-terminal-surface border-b border-terminal-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <GlobalSearch />
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
          <div 
            onMouseEnter={handleNotificationsMouseEnter}
            onMouseLeave={handleNotificationsMouseLeave}
          >
            <NotificationsPopover 
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
            />
          </div>

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
      <div className="ml-auto hidden sm:flex items-center gap-3">
      <Link href="/about" aria-label="About DealLens" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link>
    </div>
  </header>
  )
}
