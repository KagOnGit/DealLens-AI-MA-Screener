'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

type ApiStatus = 'connected' | 'disconnected' | 'checking';

export function ApiStatusBadge() {
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkApiHealth = async () => {
    try {
      setStatus('checking');
      await apiClient.healthCheck();
      setStatus('connected');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('disconnected');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Initial check
    checkApiHealth();

    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'API Connected',
          className: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'API Unreachable',
          className: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      case 'checking':
        return {
          icon: AlertCircle,
          text: 'Checking API',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        };
    }
  };

  const { icon: Icon, text, className } = getStatusConfig();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono ${className}`}>
      <Icon className={`h-3 w-3 ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span>{text}</span>
      {lastCheck && status !== 'checking' && (
        <span className="text-xs opacity-70">
          {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <button
        onClick={checkApiHealth}
        className="ml-1 hover:opacity-80 transition-opacity"
        title="Refresh API status"
      >
        ↻
      </button>
    </div>
  );
}
