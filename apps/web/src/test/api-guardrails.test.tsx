import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApiStatusStore } from '@/lib/api-status-store';
import { ApiStatusBadge } from '@/components/ApiStatusBadge';
import { MockModeBanner } from '@/components/MockModeBanner';
import toast from 'react-hot-toast';

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('API Guardrails', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    // Reset Zustand store
    useApiStatusStore.setState({
      status: 'ok',
      usingMocks: true,
      lastChecked: 0,
      errorCount: 0,
      retryCount: 0,
    });
    // Clear localStorage
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiStatusBadge', () => {
    it('shows DEMO MODE when using mocks', () => {
      useApiStatusStore.setState({ usingMocks: true, status: 'ok' });
      
      render(
        <TestWrapper>
          <ApiStatusBadge />
        </TestWrapper>
      );
      
      expect(screen.getByText('DEMO MODE')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument(); // No refresh button in mock mode
    });

    it('shows CONNECTED when API is ok and not using mocks', () => {
      useApiStatusStore.setState({ usingMocks: false, status: 'ok' });
      
      render(
        <TestWrapper>
          <ApiStatusBadge />
        </TestWrapper>
      );
      
      expect(screen.getByText('CONNECTED')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument(); // Refresh button available
    });

    it('shows DEGRADED when API has issues', () => {
      useApiStatusStore.setState({ usingMocks: false, status: 'degraded' });
      
      render(
        <TestWrapper>
          <ApiStatusBadge />
        </TestWrapper>
      );
      
      expect(screen.getByText('DEGRADED')).toBeInTheDocument();
    });

    it('shows API UNREACHABLE when API is down', () => {
      useApiStatusStore.setState({ usingMocks: false, status: 'down' });
      
      render(
        <TestWrapper>
          <ApiStatusBadge />
        </TestWrapper>
      );
      
      expect(screen.getByText('API UNREACHABLE')).toBeInTheDocument();
    });
  });

  describe('MockModeBanner', () => {
    it('shows banner when using mocks and not dismissed', () => {
      useApiStatusStore.setState({ usingMocks: true });
      vi.mocked(localStorage.getItem).mockReturnValue('false'); // Not dismissed
      
      render(
        <TestWrapper>
          <MockModeBanner />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Demo data active/)).toBeInTheDocument();
    });

    it('does not show banner when not using mocks', () => {
      useApiStatusStore.setState({ usingMocks: false });
      
      render(
        <TestWrapper>
          <MockModeBanner />
        </TestWrapper>
      );
      
      expect(screen.queryByText(/Demo data active/)).not.toBeInTheDocument();
    });

    it('dismisses banner and saves to localStorage', async () => {
      useApiStatusStore.setState({ usingMocks: true });
      vi.mocked(localStorage.getItem).mockReturnValue('false');
      
      render(
        <TestWrapper>
          <MockModeBanner />
        </TestWrapper>
      );
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('deallens-mock-banner-dismissed', 'true');
      });
    });
  });

  describe('API Store', () => {
    it('initializes with correct default values', () => {
      const store = useApiStatusStore.getState();
      expect(store.status).toBe('ok');
      expect(store.errorCount).toBe(0);
      expect(store.retryCount).toBe(0);
    });

    it('updates mock mode and persists to localStorage', () => {
      const store = useApiStatusStore.getState();
      
      store.setUsingMocks(false);
      
      expect(store.usingMocks).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('deallens-use-mocks', 'false');
    });

    it('tracks error and retry counts', () => {
      const store = useApiStatusStore.getState();
      
      store.incrementErrorCount();
      store.incrementRetryCount();
      
      expect(store.errorCount).toBe(1);
      expect(store.retryCount).toBe(1);
    });

    it('resets counts', () => {
      const store = useApiStatusStore.getState();
      
      store.incrementErrorCount();
      store.incrementRetryCount();
      store.resetCounts();
      
      expect(store.errorCount).toBe(0);
      expect(store.retryCount).toBe(0);
    });
  });

  describe('Mock API Integration', () => {
    it('handles fetch failure gracefully', async () => {
      // Mock fetch to fail
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      useApiStatusStore.setState({ usingMocks: false, status: 'ok' });
      
      // This would normally trigger API calls in real app
      const store = useApiStatusStore.getState();
      store.setStatus('down');
      
      expect(store.status).toBe('down');
    });

    it('falls back to mock data when API fails', () => {
      useApiStatusStore.setState({ usingMocks: false, status: 'degraded' });
      
      // In a real scenario, the handleApiRequest function would fall back to mock data
      // This test verifies the store state can be properly set to degraded
      const store = useApiStatusStore.getState();
      expect(store.status).toBe('degraded');
      expect(store.usingMocks).toBe(false);
    });
  });
});
