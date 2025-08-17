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
  AlertDetail,
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

// Mock data for alert details
const mockAlertDetails: Record<string, AlertDetail> = {
  '1': {
    id: '1',
    title: 'New M&A Deal Announced',
    body: 'Tech Corp announced acquisition of StartupXYZ for $500M',
    ticker: 'TECH',
    severity: 'high',
    created_at: new Date().toISOString(),
    read: false,
    type: 'deal',
    source: 'Bloomberg Terminal',
    deal_detail: {
      id: 'deal-1',
      acquirer: 'Tech Corp',
      target: 'StartupXYZ',
      value: 500,
      premium: 25.3,
      payment_mix: {
        cash_percent: 60,
        stock_percent: 40
      },
      status: 'announced',
      announced_at: new Date().toISOString(),
      expected_close: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      key_dates: {
        announcement: new Date().toISOString(),
        filing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      rationale: 'Strategic acquisition to expand AI capabilities and cloud infrastructure',
      synergies: 'Expected annual cost synergies of $50M by year 3'
    },
    related_companies: [
      {
        ticker: 'TECH',
        name: 'Tech Corp',
        sector: 'Technology',
        market_cap: 50000,
        price: 125.50
      },
      {
        ticker: 'SXYZ',
        name: 'StartupXYZ',
        sector: 'Technology',
        market_cap: 400,
        price: 89.25
      }
    ],
    timeline: [
      {
        id: 'timeline-1',
        date: new Date().toISOString(),
        title: 'Deal Announcement',
        description: 'Official announcement of acquisition',
        status: 'completed',
        type: 'announcement'
      },
      {
        id: 'timeline-2', 
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Regulatory Filing',
        description: 'Submit merger documents to regulators',
        status: 'pending',
        type: 'filing'
      },
      {
        id: 'timeline-3',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Expected Close',
        description: 'Anticipated deal completion',
        status: 'pending',
        type: 'close'
      }
    ],
    news_items: [
      {
        id: 'news-1',
        headline: 'Tech Corp to Acquire StartupXYZ for $500M',
        source: 'Reuters',
        published_at: new Date().toISOString(),
        url: 'https://reuters.com/tech-corp-acquisition',
        summary: 'Strategic move to strengthen AI portfolio'
      },
      {
        id: 'news-2',
        headline: 'Analysts Praise Tech Corp Acquisition Strategy',
        source: 'Wall Street Journal',
        published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        url: 'https://wsj.com/tech-corp-analysis'
      }
    ],
    key_metrics: {
      ev_ebitda: 12.5,
      ev_sales: 3.2,
      pe_delta: 2.1,
      synergy_estimate: 50
    }
  },
  '2': {
    id: '2',
    title: 'Market Update',
    body: 'Healthcare sector showing strong performance',
    severity: 'medium',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    type: 'market',
    source: 'Market Data Feed',
    related_companies: [
      {
        ticker: 'HLTH',
        name: 'Healthcare Inc',
        sector: 'Healthcare',
        market_cap: 25000,
        price: 89.75
      }
    ],
    news_items: [
      {
        id: 'news-3',
        headline: 'Healthcare Sector Reaches New Highs',
        source: 'MarketWatch',
        published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        url: 'https://marketwatch.com/healthcare-highs'
      }
    ]
  }
}

export async function getAlertDetail(id: string): Promise<AlertDetail> {
  try {
    return await apiClient.get<AlertDetail>(`/api/v1/alerts/${id}`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockAlert = mockAlertDetails[id];
    if (!mockAlert) {
      throw new Error(`Alert ${id} not found`);
    }
    return mockAlert;
  }
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

// Mock company data for major companies
const mockCompanyDetails: Record<string, Company> = {
  'AAPL': {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    market_cap: 3000000,
    price: 180.50,
    change: 2.50,
    change_percent: 1.41,
    volume: 45000000,
    pe_ratio: 28.5,
    ev_ebitda: 22.1,
    revenue: 394000,
    employees: 164000,
    headquarters: 'Cupertino, CA',
    founded: 1976,
    description: 'Apple Inc. designs, manufactures, and markets consumer electronics, computer software, and online services worldwide.',
    website: 'https://apple.com'
  },
  'MSFT': {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software',
    market_cap: 2800000,
    price: 378.25,
    change: -1.25,
    change_percent: -0.33,
    volume: 23000000,
    pe_ratio: 32.1,
    ev_ebitda: 24.8,
    revenue: 211000,
    employees: 228000,
    headquarters: 'Redmond, WA',
    founded: 1975,
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    website: 'https://microsoft.com'
  },
  'GOOGL': {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    industry: 'Internet Software & Services',
    market_cap: 1700000,
    price: 135.80,
    change: 0.90,
    change_percent: 0.67,
    volume: 18000000,
    pe_ratio: 25.4,
    ev_ebitda: 18.9,
    revenue: 283000,
    employees: 174000,
    headquarters: 'Mountain View, CA',
    founded: 1998,
    description: 'Alphabet Inc. provides online advertising services, cloud-based solutions, and other products.',
    website: 'https://abc.xyz'
  },
  'TECH': {
    ticker: 'TECH',
    name: 'Tech Corp',
    sector: 'Technology',
    industry: 'Software',
    market_cap: 50000,
    price: 125.50,
    change: 2.30,
    change_percent: 1.87,
    volume: 5000000,
    pe_ratio: 24.2,
    ev_ebitda: 18.5,
    revenue: 15000,
    employees: 25000,
    headquarters: 'San Francisco, CA',
    founded: 2010,
    description: 'Tech Corp is a leading technology company specializing in AI and cloud infrastructure.',
    website: 'https://techcorp.com'
  },
  'HLTH': {
    ticker: 'HLTH',
    name: 'Healthcare Inc',
    sector: 'Healthcare',
    industry: 'Biotechnology',
    market_cap: 25000,
    price: 89.75,
    change: -1.25,
    change_percent: -1.37,
    volume: 3000000,
    pe_ratio: 15.8,
    ev_ebitda: 12.4,
    revenue: 8000,
    employees: 15000,
    headquarters: 'Boston, MA',
    founded: 2005,
    description: 'Healthcare Inc develops innovative biotechnology solutions for rare diseases.',
    website: 'https://healthcareinc.com'
  }
}

export async function getCompany(ticker: string): Promise<Company> {
  try {
    return await apiClient.get<Company>(`/api/v1/companies/${ticker.toUpperCase()}`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockCompany = mockCompanyDetails[ticker.toUpperCase()];
    if (!mockCompany) {
      throw new Error(`Company ${ticker} not found`);
    }
    return mockCompany;
  }
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
