import { BellIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export function AlertsPanel() {
  const alerts = [
    {
      id: '1',
      type: 'deal',
      title: 'Major Tech Acquisition',
      message: 'TechGiant Inc. announced acquisition of AI Startup for $2.5B',
      timestamp: '10:30 AM',
      severity: 'high'
    },
    {
      id: '2',
      type: 'price',
      title: 'Price Alert Triggered',
      message: 'ACME Corp (ACME) up 15% on acquisition rumors',
      timestamp: '09:15 AM',
      severity: 'medium'
    },
    {
      id: '3',
      type: 'earnings',
      title: 'Earnings Beat',
      message: 'MegaCorp reported Q4 earnings 20% above expectations',
      timestamp: '08:00 AM',
      severity: 'low'
    },
    {
      id: '4',
      type: 'system',
      title: 'Data Update',
      message: 'Financial metrics updated for 1,247 companies',
      timestamp: '07:30 AM',
      severity: 'low'
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-terminal-red'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-terminal-green'
      default: return 'text-gray-400'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'deal': return BellIcon
      case 'price': return ExclamationTriangleIcon
      default: return InformationCircleIcon
    }
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-terminal-primary font-bold text-lg">ALERTS</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-terminal-red rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto terminal-scrollbar">
        {alerts.map((alert) => {
          const IconComponent = getIcon(alert.type)
          return (
            <div key={alert.id} className="border border-terminal-border rounded p-3 hover:bg-terminal-border transition-colors">
              <div className="flex items-start space-x-3">
                <IconComponent className={`h-5 w-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-terminal-primary text-sm font-mono mb-1">
                    {alert.title}
                  </div>
                  <div className="text-white text-xs mb-2">
                    {alert.message}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {alert.timestamp}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)} bg-current`} />
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-terminal-border">
        <div className="flex justify-between text-xs">
          <span className="text-terminal-red">● 1 High</span>
          <span className="text-yellow-500">● 1 Medium</span>
          <span className="text-terminal-green">● 2 Low</span>
        </div>
      </div>
      
      <Link 
        href="/alerts"
        className="w-full mt-3 bg-terminal-primary text-black py-2 px-4 rounded text-sm font-mono hover:bg-yellow-600 transition-colors inline-block text-center"
      >
        VIEW ALL ALERTS
      </Link>
    </div>
  )
}
