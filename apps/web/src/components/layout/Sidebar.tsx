'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  BuildingOffice2Icon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  isCollapsed: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Companies', href: '/companies', icon: BuildingOffice2Icon },
  { name: 'Deals', href: '/deals', icon: DocumentDuplicateIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Alerts', href: '/alerts', icon: BellIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
              ${
                isActive
                  ? 'bg-terminal-primary text-black'
                  : 'text-white hover:bg-terminal-border hover:text-terminal-primary'
              }
            `}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon
              className={`
                flex-shrink-0 h-5 w-5
                ${isActive ? 'text-black' : 'text-terminal-primary'}
                ${isCollapsed ? '' : 'mr-3'}
              `}
            />
            {!isCollapsed && (
              <span className="truncate">{item.name}</span>
            )}
          </Link>
        )
      })}

      {/* Market Status Indicator */}
      {!isCollapsed && (
        <div className="mt-8 pt-4 border-t border-terminal-border">
          <div className="px-2 text-xs text-terminal-primary mb-2">
            MARKET STATUS
          </div>
          <div className="flex items-center px-2 text-xs">
            <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse mr-2" />
            <span className="text-terminal-green">OPEN</span>
            <span className="ml-auto text-white">16:00 EST</span>
          </div>
        </div>
      )}

      {/* System Info */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-2 right-2">
          <div className="text-xs text-gray-500">
            <div>DealLens v0.1.0</div>
            <div>Last Update: --:--:--</div>
          </div>
        </div>
      )}
    </nav>
  )
}
