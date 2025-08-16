'use client'

import { useEffect, useState } from 'react'

export function MarketOverview() {
  const [currentTime, setCurrentTime] = useState<string>('--:--:--')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])
  const marketData = [
    { name: 'S&P 500', symbol: 'SPX', value: 4567.89, change: 1.2, changePercent: 0.026 },
    { name: 'NASDAQ', symbol: 'NDX', value: 14234.56, change: 1.8, changePercent: 0.013 },
    { name: 'Dow Jones', symbol: 'DJIA', value: 35678.90, change: 0.8, changePercent: 0.022 },
    { name: 'Russell 2000', symbol: 'RTY', value: 1987.45, change: -0.3, changePercent: -0.015 },
  ]

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-terminal-primary font-bold text-lg">MARKET OVERVIEW</h2>
        <div className="text-xs text-gray-400">Last Update: {currentTime}</div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {marketData.map((index) => (
          <div key={index.symbol} className="border border-terminal-border rounded p-3">
            <div className="text-terminal-primary text-xs font-mono mb-1">{index.symbol}</div>
            <div className="text-white text-lg font-mono">{index.value.toLocaleString()}</div>
            <div className={`text-sm font-mono ${index.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {index.change >= 0 ? '+' : ''}{index.change} ({index.changePercent >= 0 ? '+' : ''}{(index.changePercent * 100).toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-terminal-primary">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>VOL: 3.2B</div>
          <div>ADV: 1,234</div>
          <div>DECL: 987</div>
          <div>VIX: 18.45</div>
        </div>
      </div>
    </div>
  )
}
