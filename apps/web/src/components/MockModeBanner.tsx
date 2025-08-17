'use client';

import { useState, useEffect } from 'react';
import { useApiStatusStore } from '@/lib/api-status-store';
import { X, Info } from 'lucide-react';

const STORAGE_KEY = 'deallens-mock-banner-dismissed';

export function MockModeBanner() {
  const { usingMocks } = useApiStatusStore();
  const [isDismissed, setIsDismissed] = useState(true); // Start as dismissed to prevent flash

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Don't show if not using mocks or if dismissed
  if (!usingMocks || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Info className="h-5 w-5 text-blue-200 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Demo data active — some values are mocked. 
                <span className="hidden sm:inline ml-1">
                  Switch to live data in settings.
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 flex-shrink-0 rounded-md p-1 hover:bg-white/10 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5 text-blue-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
