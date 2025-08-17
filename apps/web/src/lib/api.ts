const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_API_URL is not configured. Using default localhost.');
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/healthz`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// API Functions using React Query
import {
  Alert,
  Deal,
  Company,
  Suggestion,
  AlertsResponse,
  DealsResponse,
  CompaniesResponse,
  SuggestionsResponse,
} from '../types';

// Alerts API
export async function getAlerts({
  unread,
  limit = 10,
}: {
  unread?: boolean;
  limit?: number;
} = {}): Promise<AlertsResponse> {
  const params = new URLSearchParams();
  if (unread !== undefined) params.append('unread', unread.toString());
  if (limit) params.append('limit', limit.toString());
  
  return apiClient.get<AlertsResponse>(`/api/v1/alerts?${params.toString()}`);
}

export async function getAlert(id: string): Promise<Alert> {
  return apiClient.get<Alert>(`/api/v1/alerts/${id}`);
}

export async function markAllAlertsRead(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/api/v1/alerts/mark-all-read');
}

export async function clearAllAlerts(): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>('/api/v1/alerts/clear');
}

export async function markAlertRead(id: string): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/api/v1/alerts/${id}/read`);
}

// Deals API
export async function getRecentDeals(limit = 10): Promise<DealsResponse> {
  return apiClient.get<DealsResponse>(`/api/v1/deals?limit=${limit}&sort=announced_at`);
}

export async function getDeal(id: string): Promise<Deal> {
  return apiClient.get<Deal>(`/api/v1/deals/${id}`);
}

export async function getDeals({
  page = 1,
  limit = 20,
  status,
}: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<DealsResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);
  
  return apiClient.get<DealsResponse>(`/api/v1/deals?${params.toString()}`);
}

// Companies API
export async function getCompanies({
  q,
  page = 1,
  limit = 20,
}: {
  q?: string;
  page?: number;
  limit?: number;
} = {}): Promise<CompaniesResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (q) params.append('q', q);
  
  return apiClient.get<CompaniesResponse>(`/api/v1/companies?${params.toString()}`);
}

export async function getCompany(ticker: string): Promise<Company> {
  return apiClient.get<Company>(`/api/v1/companies/${ticker.toUpperCase()}`);
}

// Search API
export async function searchSuggestions(q: string): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  
  const response = await apiClient.get<SuggestionsResponse>(
    `/api/v1/search?q=${encodeURIComponent(q.trim())}`
  );
  return response.suggestions;
}

// Dashboard API
export async function getDashboardData(): Promise<{
  alerts: AlertsResponse;
  recent_deals: DealsResponse;
  top_companies: CompaniesResponse;
}> {
  const [alerts, deals, companies] = await Promise.all([
    getAlerts({ limit: 5 }),
    getRecentDeals(5),
    getCompanies({ limit: 10 }),
  ]);
  
  return {
    alerts,
    recent_deals: deals,
    top_companies: companies,
  };
}

// Analytics tracking
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties);
  }
  
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', { event, properties });
  }
}

export { API_BASE_URL };
