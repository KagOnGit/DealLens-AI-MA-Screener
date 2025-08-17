'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Terminal, 
  Home, 
  ArrowLeft, 
  AlertTriangle,
  BarChart3,
  Building2,
  DollarSign,
  Bell
} from 'lucide-react'

export default function NotFound() {
  const [typedText, setTypedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const terminalText = 'ERROR 404: PAGE NOT FOUND'
  
  useEffect(() => {
    if (currentIndex < terminalText.length) {
      const timer = setTimeout(() => {
        setTypedText(terminalText.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, terminalText])

  const navigationLinks = [
    {
      href: '/',
      label: 'Dashboard',
      icon: Home,
      description: 'Market overview and key metrics'
    },
    {
      href: '/companies',
      label: 'Companies',
      icon: Building2,
      description: 'Browse and analyze public companies'
    },
    {
      href: '/deals',
      label: 'Deals',
      icon: DollarSign,
      description: 'M&A transactions and deal flow'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Market trends and insights'
    },
    {
      href: '/alerts',
      label: 'Alerts',
      icon: Bell,
      description: 'Notifications and monitoring'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Terminal Header */}
      <div className="bg-terminal-surface border-b border-terminal-border p-4">
        <div className="flex items-center space-x-2">
          <Terminal className="h-6 w-6 text-terminal-primary" />
          <span className="font-mono text-terminal-primary text-lg">DEALLENS TERMINAL</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-12 text-center">
          
          {/* Terminal Error Display */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-8">
            <div className="font-mono text-6xl text-terminal-red mb-4">404</div>
            
            <div className="bg-black border border-terminal-border rounded p-6 mb-6">
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-terminal-primary">user@deallens:~$</span>
                  <span className="text-white">ls -la /requested/page</span>
                </div>
                <div className="text-terminal-red font-mono">
                  {typedText}
                  <span className="animate-pulse">|</span>
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  ls: cannot access '/requested/page': No such file or directory
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-mono">The requested resource could not be located</span>
              </div>
              <p className="text-gray-400 text-lg">
                The page you're looking for doesn't exist or has been moved to a different location.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-mono text-terminal-primary">AVAILABLE DESTINATIONS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navigationLinks.map((link) => {
                const IconComponent = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bg-terminal-surface border border-terminal-border rounded-lg p-6 hover:bg-terminal-border transition-colors group"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <IconComponent className="h-6 w-6 text-terminal-primary group-hover:text-yellow-400 transition-colors" />
                      <h3 className="font-mono text-lg text-white group-hover:text-terminal-primary transition-colors">
                        {link.label}
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm text-left">{link.description}</p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Terminal Commands */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
            <div className="text-left space-y-2">
              <div className="text-terminal-primary font-mono text-sm mb-4">SUGGESTED COMMANDS:</div>
              
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-terminal-primary">$</span>
                  <Link 
                    href="/" 
                    className="text-terminal-green hover:text-green-400 cursor-pointer"
                  >
                    cd /home
                  </Link>
                  <span className="text-gray-500"># Return to dashboard</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-terminal-primary">$</span>
                  <Link 
                    href="/companies" 
                    className="text-terminal-green hover:text-green-400 cursor-pointer"
                  >
                    find /companies -type f
                  </Link>
                  <span className="text-gray-500"># Browse companies</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-terminal-primary">$</span>
                  <Link 
                    href="/deals" 
                    className="text-terminal-green hover:text-green-400 cursor-pointer"
                  >
                    grep -r "M&A" /deals/
                  </Link>
                  <span className="text-gray-500"># Search deals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-6 py-3 bg-terminal-border text-white rounded hover:bg-terminal-primary hover:text-black transition-colors font-mono"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>GO BACK</span>
            </button>
            
            <Link 
              href="/"
              className="flex items-center space-x-2 px-6 py-3 bg-terminal-primary text-black rounded hover:bg-yellow-600 transition-colors font-mono"
            >
              <Home className="h-4 w-4" />
              <span>HOME</span>
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t border-terminal-border pt-6">
            <p className="text-gray-500 text-sm font-mono">
              DEALLENS AI M&A SCREENER v1.0.0 | SYSTEM STATUS: ONLINE
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
