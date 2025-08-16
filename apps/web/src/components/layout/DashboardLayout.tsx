'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen flex bg-black text-white font-mono">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-terminal-surface border-r border-terminal-border flex-shrink-0`}>
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && (
            <h1 className="text-terminal-primary font-bold text-xl">DealLens</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-terminal-primary hover:bg-terminal-border p-1 rounded"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <Sidebar isCollapsed={!sidebarOpen} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto terminal-scrollbar bg-black p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
