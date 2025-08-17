'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useApiStatusStore } from '@/lib/api-status-store';
import { Wifi, WifiOff, AlertCircle, HardDrive } from 'lucide-react';

export function ApiStatusBadge() {
  const { status, usingMocks, lastChecked } = useApiStatusStore();

  const checkApiHealth = useCallback(async () => {
    try {
      await apiClient.healthCheck();
    } catch (error) {
      // Error handling is done by the ApiClient retry logic
      console.debug('Health check failed, handled by retry logic');
    }
  }, []);

  const getStatusConfig = () => {
    if (usingMocks) {
      return {
        icon: HardDrive,
        text: 'DEMO MODE',
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    }

    switch (status) {
      case 'ok':
        return {
          icon: Wifi,
          text: 'CONNECTED',
          className: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      case 'degraded':
        return {
          icon: AlertCircle,
          text: 'DEGRADED',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        };
      case 'down':
        return {
          icon: WifiOff,
          text: 'API UNREACHABLE',
          className: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      default:
        return {
          icon: AlertCircle,
          text: 'CHECKING',
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse',
        };
    }
  };

  const { icon: Icon, text, className } = getStatusConfig();
  const lastCheckDate = lastChecked ? new Date(lastChecked) : null;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono ${className}`}>
      <Icon className={`h-3 w-3 ${status === 'down' || !usingMocks ? '' : 'animate-pulse'}`} />
      <span>{text}</span>
      {lastCheckDate && !usingMocks && (
        <span className="text-xs opacity-70">
          {lastCheckDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      {!usingMocks && (
        <button
          onClick={checkApiHealth}
          className="ml-1 hover:opacity-80 transition-opacity"
          title="Refresh API status"
        >
          ↻
        </button>
      )}
    </div>
  );
}
