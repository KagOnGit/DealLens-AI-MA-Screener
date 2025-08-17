'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { BellIcon, CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { Alert } from '../../types';
import { getAlerts, markAllAlertsRead, clearAllAlerts, trackEvent } from '../../lib/api';

function AlertItem({ alert }: { alert: Alert }) {
  const router = useRouter();

  const handleClick = () => {
    trackEvent('alert_clicked', { alert_id: alert.id, alert_type: alert.type });
    router.push(`/alerts/${alert.id}`);
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-[hsl(var(--alert-critical-bg))] border-[hsl(var(--alert-critical-border))] text-red-800 dark:text-red-200';
      case 'high':
        return 'bg-[hsl(var(--alert-high-bg))] border-[hsl(var(--alert-high-border))] text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-[hsl(var(--alert-medium-bg))] border-[hsl(var(--alert-medium-border))] text-yellow-700 dark:text-yellow-300';
      case 'low':
      default:
        return 'bg-[hsl(var(--alert-low-bg))] border-[hsl(var(--alert-low-border))] text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 rounded-lg border hover:bg-[hsl(var(--surface-100))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary-500))] ${
        !alert.read ? 'font-medium' : 'opacity-75'
      } ${getSeverityStyles(alert.severity)}`}
      role="menuitem"
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <div className="flex items-center space-x-2 mt-1">
            {alert.ticker && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[hsl(var(--primary-100))] text-[hsl(var(--primary-800))] dark:bg-[hsl(var(--primary-800))] dark:text-[hsl(var(--primary-100))]">
                {alert.ticker}
              </span>
            )}
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        {!alert.read && (
          <div className="w-2 h-2 bg-[hsl(var(--primary-500))] rounded-full mt-2 ml-2 flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border border-[hsl(var(--border))]">
          <div className="animate-pulse">
            <div className="h-4 bg-[hsl(var(--muted))] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[hsl(var(--muted))] rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface NotificationsPopoverProps {
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function NotificationsPopover({ 
  className = '', 
  open, 
  onOpenChange, 
  onMouseEnter, 
  onMouseLeave 
}: NotificationsPopoverProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch alerts with React Query
  const {
    data: alertsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alerts', { limit: 10, unread: true }],
    queryFn: () => getAlerts({ limit: 10 }),
    staleTime: 30_000, // 30 seconds
    enabled: open, // Only fetch when popover is open
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      trackEvent('alerts_mark_all_read');
    },
    onError: (error) => {
      console.error('Failed to mark all alerts as read:', error);
    },
  });

  // Clear all alerts mutation
  const clearAllMutation = useMutation({
    mutationFn: clearAllAlerts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      trackEvent('alerts_clear_all');
    },
    onError: (error) => {
      console.error('Failed to clear all alerts:', error);
    },
  });

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('notifications_bell_clicked');
    onOpenChange(false); // Close popover before navigation
    router.push('/alerts');
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      trackEvent('notifications_popover_opened');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const unreadCount = alertsResponse?.unread_count ?? 0;
  const alerts = alertsResponse?.alerts ?? [];

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <button
                onClick={handleBellClick}
                className={`relative text-terminal-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary-500))] rounded-full p-1 ${className}`}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-terminal-red rounded-full text-xs flex items-center justify-center text-white font-medium min-w-[1.25rem]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </Popover.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Content
            side="bottom"
            className="bg-[hsl(var(--popover-background))] text-[hsl(var(--popover-foreground))] px-2 py-1 rounded text-sm border border-[hsl(var(--border))] shadow-lg"
          >
            Notifications
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="bg-[hsl(var(--popover-background))] border border-[hsl(var(--border))] rounded-lg shadow-lg p-4 w-80 z-50 max-h-96 overflow-hidden flex flex-col"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-[hsl(var(--popover-foreground))]">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary-500))]"
              aria-label="Close notifications"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <AlertsSkeleton />
            ) : error ? (
              <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                Failed to load notifications
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                No notifications
              </div>
            ) : (
              <div className="space-y-2" role="menu">
                {alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {alerts.length > 0 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[hsl(var(--border))]">
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending || unreadCount === 0}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary-500))] rounded"
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                Mark all read
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[hsl(var(--danger-600))] hover:text-[hsl(var(--danger-700))] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--danger-500))] rounded"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Clear all
              </button>
            </div>
          )}

          <Popover.Arrow className="fill-[hsl(var(--popover-background))]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
