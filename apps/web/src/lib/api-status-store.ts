import { create } from 'zustand';
import { logger } from './logger';

export type ApiStatus = 'ok' | 'degraded' | 'down';

export interface ApiStatusState {
  status: ApiStatus;
  usingMocks: boolean;
  lastChecked: number;
  errorCount: number;
  retryCount: number;
}

interface ApiStatusActions {
  setStatus: (status: ApiStatus) => void;
  setUsingMocks: (usingMocks: boolean) => void;
  updateLastChecked: () => void;
  incrementErrorCount: () => void;
  incrementRetryCount: () => void;
  resetCounts: () => void;
}

export type ApiStatusStore = ApiStatusState & ApiStatusActions;

// Get initial state from environment and localStorage
const getInitialUsingMocks = (): boolean => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
  }
  
  // Check localStorage first for user preference
  const stored = localStorage.getItem('deallens-use-mocks');
  if (stored !== null) {
    return stored === 'true';
  }
  
  // Fall back to environment variable
  return process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
};

export const useApiStatusStore = create<ApiStatusStore>((set, get) => ({
  // Initial state
  status: 'ok',
  usingMocks: getInitialUsingMocks(),
  lastChecked: 0,
  errorCount: 0,
  retryCount: 0,

  // Actions
  setStatus: (status: ApiStatus) => {
    const prevStatus = get().status;
    if (prevStatus !== status) {
      logger.apiStatusChange(prevStatus, status);
    }
    set({ status });
  },

  setUsingMocks: (usingMocks: boolean) => {
    set({ usingMocks });
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('deallens-use-mocks', usingMocks.toString());
    }
    
    logger.event('mock_mode_toggled', { usingMocks });
  },

  updateLastChecked: () => {
    set({ lastChecked: Date.now() });
  },

  incrementErrorCount: () => {
    set((state) => ({ errorCount: state.errorCount + 1 }));
  },

  incrementRetryCount: () => {
    set((state) => ({ retryCount: state.retryCount + 1 }));
  },

  resetCounts: () => {
    set({ errorCount: 0, retryCount: 0 });
  },
}));

// Helper functions
export const getApiStatus = (): ApiStatusState => {
  return useApiStatusStore.getState();
};

export const isUsingMocks = (): boolean => {
  return useApiStatusStore.getState().usingMocks;
};

// Initialize the store when the module loads
if (typeof window !== 'undefined') {
  // Update initial state after hydration
  setTimeout(() => {
    const initialMocks = getInitialUsingMocks();
    useApiStatusStore.getState().setUsingMocks(initialMocks);
  }, 0);
}
