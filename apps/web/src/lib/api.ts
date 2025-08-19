import { useApiStatusStore } from './api-status-store';
import { logger } from './logger';
import toast from 'react-hot-toast';
import * as Sentry from '@sentry/nextjs';

// Environment configuration with guardrails
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Get mock mode from store (will be reactive)
const getUseMocks = (): boolean => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
  }
  return useApiStatusStore.getState().usingMocks;
};

// Retry configuration
const RETRY_DELAYS = [200, 500, 1000, 2000]; // ms
const REQUEST_TIMEOUT = 5000; // 5 seconds

/**
 * Sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Retry function with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  endpoint: string,
  requestId: string
): Promise<T> {
  const store = useApiStatusStore.getState();
  
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const result = await operation();
      
      // Success: reset error counts and set status to ok
      if (attempt > 0) {
        store.resetCounts();
        store.setStatus('ok');
        logger.debug(`Request succeeded after ${attempt} retries`, { endpoint, requestId });
      }
      
      return result;
    } catch (error) {
      const isLastAttempt = attempt === RETRY_DELAYS.length;
      
      if (isLastAttempt) {
        // Final failure
        store.incrementErrorCount();
        const errorCount = store.errorCount;
        
        logger.error(`Request failed after ${attempt} retries`, error, {
          endpoint,
          requestId,
          errorCount
        });
        
        // Update status based on error pattern
        if (errorCount >= 3) {
          store.setStatus('down');
          // Show toast for critical failures only when not using mocks
          if (!store.usingMocks && typeof window !== 'undefined') {
            toast.error('Having trouble contacting the API. We\'ll keep retrying in the background.', {
              id: 'api-down-toast', // Prevent duplicate toasts
              duration: 6000,
            });
          }
        } else {
          store.setStatus('degraded');
          // Show a lighter warning for degraded service
          if (!store.usingMocks && typeof window !== 'undefined') {
            toast('API connection issues detected. Some features may be limited.', {
              id: 'api-degraded-toast',
              icon: '⚠️',
              duration: 4000,
            });
          }
        }
        
        throw error;
      } else {
        // Retry with backoff
        store.incrementRetryCount();
        const delay = RETRY_DELAYS[attempt];
        
        logger.debug(`Retrying request in ${delay}ms`, {
          endpoint,
          requestId,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error)
        });
        
        await sleep(delay);
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Environment warnings
if (typeof window !== 'undefined') {
  // Only run these checks on client-side
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('⚠️ NEXT_PUBLIC_API_URL is not configured. Using default localhost:8000');
    console.warn('Set NEXT_PUBLIC_API_URL in your environment variables for production.');
  }
  
  // Health check on initialization
  setTimeout(async () => {
    const store = useApiStatusStore.getState();
    const requestId = generateRequestId();
    
    try {
      const response = await fetch(`${API_BASE_URL}/healthz`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
      });
      
      if (!response.ok) {
        console.error(`❌ API health check failed: ${response.status} ${response.statusText}`);
        console.error('Check your NEXT_PUBLIC_API_URL configuration and ensure the API server is running.');
        store.setStatus('degraded');
      } else {
        console.info(`✅ API health check passed: ${API_BASE_URL}`);
        store.setStatus('ok');
        store.resetCounts();
      }
    } catch (error) {
      console.error(`❌ API health check failed:`, error);
      console.error('Ensure the API server is running and accessible.');
      store.setStatus('down');
    } finally {
      store.updateLastChecked();
    }
  }, 1000);
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const requestId = generateRequestId();
    const store = useApiStatusStore.getState();
    
    // Add Sentry breadcrumb for API request
    if (typeof Sentry !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message: `API Request: ${options.method || 'GET'} ${endpoint}`,
        category: 'api',
        level: 'info',
        data: {
          url: `${this.baseUrl}${endpoint}`,
          method: options.method || 'GET',
          requestId,
        },
        timestamp: Date.now() / 1000,
      });
    }
    
    return withRetry(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Add Sentry breadcrumb for API failures
          if (typeof Sentry !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
            Sentry.addBreadcrumb({
              message: `API Request Failed: ${response.status} ${response.statusText}`,
              category: 'api.error',
              level: 'error',
              data: {
                url,
                method: options.method || 'GET',
                status: response.status,
                statusText: response.statusText,
                requestId,
              },
              timestamp: Date.now() / 1000,
            });
          }
          
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        store.updateLastChecked();
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Add Sentry breadcrumb for network errors
        if (typeof Sentry !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
          Sentry.addBreadcrumb({
            message: `API Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            category: 'api.error',
            level: 'error',
            data: {
              url,
              method: options.method || 'GET',
              error: error instanceof Error ? error.message : String(error),
              requestId,
            },
            timestamp: Date.now() / 1000,
          });
        }
        
        throw error;
      }
    }, endpoint, requestId);
  }

  async healthCheck(): Promise<{ status: string; timestamp?: string }> {
    const requestId = generateRequestId();
    const store = useApiStatusStore.getState();
    
    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(`${this.baseUrl}/healthz`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          store.setStatus('ok');
          store.updateLastChecked();
          return result;
        } else {
          throw new Error(`Health check failed: ${response.status}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        store.setStatus('down');
        throw error;
      }
    }, '/healthz', requestId);
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
  DealDetail,
  Company,
  CompanyDetail,
  CompanyTimeseries,
  CompanyOwnership,
  CompanyNews,
  Suggestion,
  AlertsResponse,
  DealsResponse,
  CompaniesResponse,
  SuggestionsResponse,
} from '../types';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

// Graceful failure helper
async function handleApiRequest<T>(
  apiCall: () => Promise<T>,
  mockFallback: () => T,
  endpoint: string
): Promise<T> {
  const store = useApiStatusStore.getState();
  
  // If using mocks, return mock data immediately
  if (store.usingMocks) {
    logger.debug('Using mock data', { endpoint });
    return mockFallback();
  }
  
  // Try real API
  try {
    const result = await apiCall();
    // Success - ensure status is ok if it was degraded
    if (store.status === 'degraded') {
      store.setStatus('ok');
    }
    return result;
  } catch (error) {
    logger.warn('API request failed, checking fallback strategy', { endpoint, error });
    
    // If we're not using mocks but API failed, 
    // we can gracefully degrade to mock data for some endpoints
    const canUseMockFallback = endpoint.includes('/alerts') || 
                              endpoint.includes('/companies') || 
                              endpoint.includes('/deals');
    
    if (canUseMockFallback) {
      store.setStatus('degraded');
      logger.debug('Falling back to mock data due to API failure', { endpoint });
      return mockFallback();
    } else {
      // For critical endpoints, re-throw the error
      throw error;
    }
  }
}

// Alerts API
export async function getAlerts({
  unread,
  limit = 10,
}: {
  unread?: boolean;
  limit?: number;
} = {}): Promise<AlertsResponse> {
  return handleApiRequest(
    async () => {
      const params = new URLSearchParams();
      if (unread !== undefined) params.append('unread', unread.toString());
      if (limit) params.append('limit', limit.toString());
      return await apiClient.get<AlertsResponse>(`/api/v1/alerts?${params.toString()}`);
    },
    () => ({ alerts: [], total: 0, unread_count: 0 }),
    '/api/v1/alerts'
  );
}

export async function getAlert(id: string): Promise<Alert> {
  try {
    return await apiClient.get<Alert>(`/api/v1/alerts/${id}`);
  } catch (error) {
    console.warn('Alert API failed:', error);
    throw error; // Re-throw since this is for specific alerts
  }
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

// Legacy Deals API - keeping for backward compatibility
export async function getRecentDeals(limit = 10): Promise<DealsResponse> {
  try {
    return await apiClient.get<DealsResponse>(`/api/v1/deals?limit=${limit}&sort=announced_at`);
  } catch (error) {
    console.warn('Recent deals API failed, using empty response:', error);
    return { deals: [], total: 0, page: 1, limit };
  }
}

export async function getDeal(id: string): Promise<Deal> {
  try {
    return await apiClient.get<Deal>(`/api/v1/deals/${id}`);
  } catch (error) {
    console.warn('Deal API failed:', error);
    throw error; // Re-throw since this is for specific deals
  }
}

export async function getDealsLegacy({
  page = 1,
  limit = 20,
  status,
}: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<DealsResponse> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    
    return await apiClient.get<DealsResponse>(`/api/v1/deals?${params.toString()}`);
  } catch (error) {
    console.warn('Deals legacy API failed, using empty response:', error);
    return { deals: [], total: 0, page, limit };
  }
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
  return handleApiRequest(
    async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (q) params.append('q', q);
      return await apiClient.get<CompaniesResponse>(`/api/v1/companies?${params.toString()}`);
    },
    () => {
      const mockCompanies = Object.values(mockCompanyDetails).slice(0, limit);
      return {
        companies: mockCompanies,
        total: mockCompanies.length,
        page,
        limit
      };
    },
    '/api/v1/companies'
  );
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
  'AMZN': {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Discretionary',
    industry: 'E-commerce',
    market_cap: 1400000,
    price: 142.33,
    change: 0.95,
    change_percent: 0.67,
    volume: 25000000,
    pe_ratio: 45.2,
    ev_ebitda: 26.4,
    revenue: 514000,
    employees: 1540000,
    headquarters: 'Seattle, WA',
    founded: 1994,
    description: 'Amazon.com Inc. is a multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    website: 'https://amazon.com'
  },
  'TSLA': {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Discretionary',
    industry: 'Electric Vehicles',
    market_cap: 800000,
    price: 238.45,
    change: -3.45,
    change_percent: -1.43,
    volume: 35000000,
    pe_ratio: 65.8,
    ev_ebitda: 42.1,
    revenue: 96000,
    employees: 140000,
    headquarters: 'Austin, TX',
    founded: 2003,
    description: 'Tesla Inc. designs, develops, manufactures, and sells electric vehicles and stationary energy storage systems worldwide.',
    website: 'https://tesla.com'
  },
  'META': {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Communication Services',
    industry: 'Social Media',
    market_cap: 750000,
    price: 298.67,
    change: 4.23,
    change_percent: 1.44,
    volume: 28000000,
    pe_ratio: 22.7,
    ev_ebitda: 15.3,
    revenue: 134000,
    employees: 86000,
    headquarters: 'Menlo Park, CA',
    founded: 2004,
    description: 'Meta Platforms Inc. develops products that help people connect, find communities, and grow businesses globally.',
    website: 'https://meta.com'
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
  return handleApiRequest(
    async () => {
      return await apiClient.get<Company>(`/api/v1/companies/${ticker.toUpperCase()}`);
    },
    () => {
      const mockCompany = mockCompanyDetails[ticker.toUpperCase()];
      if (!mockCompany) {
        throw new Error(`Company ${ticker} not found`);
      }
      return mockCompany;
    },
    `/api/v1/companies/${ticker.toUpperCase()}`
  );
}

// Search API
export async function searchSuggestions(q: string): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  
  try {
    const response = await apiClient.get<SuggestionsResponse>(
      `/api/v1/search?q=${encodeURIComponent(q.trim())}`
    );
    return response.suggestions;
  } catch (error) {
    console.warn('Search API failed, using empty results:', error);
    return [];
  }
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

// Enhanced Company Detail API helpers with comprehensive mock data

// Generate realistic quarterly data points
function generateQuarterlyData(baseValue: number, quarters: number = 16, growth: number = 0.05): { date: string; value: number }[] {
  const data = [];
  const now = new Date();
  
  for (let i = quarters - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const value = baseValue * Math.pow(1 + growth, quarters - 1 - i) * (0.95 + Math.random() * 0.1);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value)
    });
  }
  
  return data;
}

// Mock company detail data
const mockCompanyDetailData: Record<string, CompanyDetail> = {
  'AAPL': {
    ...mockCompanyDetails['AAPL'],
    beta: 1.12,
    currency: 'USD',
    updated_at: new Date().toISOString(),
    business_summary: 'Apple Inc. designs, manufactures, and markets consumer electronics, computer software, and online services worldwide. The company operates through iPhone, Mac, iPad, Wearables, Home and Accessories, and Services segments.',
    key_risks: [
      'Dependence on iPhone sales for majority of revenue',
      'Intense competition in consumer electronics market',
      'Supply chain disruptions and component shortages',
      'Regulatory scrutiny in various markets'
    ],
    competitive_moats: [
      'Strong brand loyalty and ecosystem lock-in',
      'Premium positioning and pricing power',
      'Vertical integration and supply chain control',
      'Substantial R&D investments and innovation'
    ]
  },
  'MSFT': {
    ...mockCompanyDetails['MSFT'],
    beta: 0.89,
    currency: 'USD',
    updated_at: new Date().toISOString(),
    business_summary: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments.',
    key_risks: [
      'Cloud competition from AWS and Google',
      'Cybersecurity threats and data breaches',
      'Regulatory scrutiny over market dominance',
      'Dependence on enterprise customers'
    ],
    competitive_moats: [
      'Dominant position in enterprise software',
      'Strong recurring revenue from subscriptions',
      'Network effects from productivity suite',
      'Massive scale in cloud infrastructure'
    ]
  },
  'GOOGL': {
    ...mockCompanyDetails['GOOGL'],
    beta: 1.05,
    currency: 'USD',
    updated_at: new Date().toISOString(),
    business_summary: 'Alphabet Inc. provides online advertising services, search, cloud computing, software, and hardware products worldwide. The company operates through Google Services, Google Cloud, and Other Bets segments.',
    key_risks: [
      'Dependence on advertising revenue',
      'Privacy regulations and data protection',
      'Antitrust investigations and regulations',
      'Competition in cloud and mobile platforms'
    ],
    competitive_moats: [
      'Dominant search market position',
      'Massive data advantages and AI capabilities',
      'Strong network effects in advertising',
      'Diversified technology portfolio'
    ]
  }
};

// Enhanced mock timeseries data for all major companies
const mockTimeseriesData: Record<string, CompanyTimeseries & { peers?: { ticker: string; pe: number; ev_ebitda: number }[] }> = {
  'AAPL': {
    revenue: generateQuarterlyData(81200, 16, 0.02),
    ebitda: generateQuarterlyData(24000, 16, 0.03),
    fcf: generateQuarterlyData(20100, 16, 0.025),
    margins: generateQuarterlyData(44.1, 16, 0.001).map((point, i) => ({
      date: point.date,
      gross: 44.1 + (Math.random() - 0.5) * 2,
      ebitda: 29.5 + (Math.random() - 0.5) * 3,
      net: 25.3 + (Math.random() - 0.5) * 2
    })),
    multiples: generateQuarterlyData(28.5, 16, -0.01).map((point, i) => ({
      date: point.date,
      pe: point.value,
      ev_ebitda: point.value * 0.75 + (Math.random() - 0.5) * 2
    })),
    peers: [
      { ticker: 'MSFT', pe: 32.1, ev_ebitda: 24.8 },
      { ticker: 'GOOGL', pe: 25.4, ev_ebitda: 18.9 },
      { ticker: 'META', pe: 22.7, ev_ebitda: 15.3 },
      { ticker: 'AMZN', pe: 45.2, ev_ebitda: 26.4 }
    ]
  },
  'MSFT': {
    revenue: generateQuarterlyData(52700, 16, 0.04),
    ebitda: generateQuarterlyData(21000, 16, 0.05),
    fcf: generateQuarterlyData(18500, 16, 0.045),
    margins: generateQuarterlyData(68.4, 16, 0.002).map((point, i) => ({
      date: point.date,
      gross: 68.4 + (Math.random() - 0.5) * 2,
      ebitda: 42.1 + (Math.random() - 0.5) * 3,
      net: 36.2 + (Math.random() - 0.5) * 2
    })),
    multiples: generateQuarterlyData(32.1, 16, -0.005).map((point, i) => ({
      date: point.date,
      pe: point.value,
      ev_ebitda: point.value * 0.8 + (Math.random() - 0.5) * 3
    })),
    peers: [
      { ticker: 'AAPL', pe: 28.5, ev_ebitda: 22.1 },
      { ticker: 'GOOGL', pe: 25.4, ev_ebitda: 18.9 },
      { ticker: 'AMZN', pe: 45.2, ev_ebitda: 26.4 },
      { ticker: 'CRM', pe: 35.6, ev_ebitda: 28.9 }
    ]
  },
  'GOOGL': {
    revenue: generateQuarterlyData(70700, 16, 0.03),
    ebitda: generateQuarterlyData(19200, 16, 0.04),
    fcf: generateQuarterlyData(16800, 16, 0.035),
    margins: generateQuarterlyData(56.9, 16, 0.001).map((point, i) => ({
      date: point.date,
      gross: 56.9 + (Math.random() - 0.5) * 3,
      ebitda: 27.3 + (Math.random() - 0.5) * 4,
      net: 21.6 + (Math.random() - 0.5) * 3
    })),
    multiples: generateQuarterlyData(25.4, 16, -0.008).map((point, i) => ({
      date: point.date,
      pe: point.value,
      ev_ebitda: point.value * 0.74 + (Math.random() - 0.5) * 2
    })),
    peers: [
      { ticker: 'AAPL', pe: 28.5, ev_ebitda: 22.1 },
      { ticker: 'MSFT', pe: 32.1, ev_ebitda: 24.8 },
      { ticker: 'META', pe: 22.7, ev_ebitda: 15.3 },
      { ticker: 'NFLX', pe: 34.2, ev_ebitda: 19.7 }
    ]
  },
  'AMZN': {
    revenue: generateQuarterlyData(514000, 16, 0.05),
    ebitda: generateQuarterlyData(42000, 16, 0.06),
    fcf: generateQuarterlyData(35000, 16, 0.04),
    margins: generateQuarterlyData(45.7, 16, 0.002).map((point, i) => ({
      date: point.date,
      gross: 45.7 + (Math.random() - 0.5) * 3,
      ebitda: 8.2 + (Math.random() - 0.5) * 2,
      net: 6.3 + (Math.random() - 0.5) * 2
    })),
    multiples: generateQuarterlyData(45.2, 16, -0.02).map((point, i) => ({
      date: point.date,
      pe: point.value,
      ev_ebitda: point.value * 0.6 + (Math.random() - 0.5) * 5
    })),
    peers: [
      { ticker: 'GOOGL', pe: 25.4, ev_ebitda: 18.9 },
      { ticker: 'MSFT', pe: 32.1, ev_ebitda: 24.8 },
      { ticker: 'META', pe: 22.7, ev_ebitda: 15.3 },
      { ticker: 'NFLX', pe: 34.2, ev_ebitda: 19.7 }
    ]
  },
  'TSLA': {
    revenue: generateQuarterlyData(96000, 16, 0.08),
    ebitda: generateQuarterlyData(8800, 16, 0.12),
    fcf: generateQuarterlyData(7500, 16, 0.15),
    margins: generateQuarterlyData(18.7, 16, 0.01).map((point, i) => ({
      date: point.date,
      gross: 18.7 + (Math.random() - 0.5) * 4,
      ebitda: 9.2 + (Math.random() - 0.5) * 3,
      net: 7.1 + (Math.random() - 0.5) * 3
    })),
    multiples: generateQuarterlyData(65.8, 16, -0.03).map((point, i) => ({
      date: point.date,
      pe: point.value,
      ev_ebitda: point.value * 0.64 + (Math.random() - 0.5) * 8
    })),
    peers: [
      { ticker: 'GM', pe: 5.8, ev_ebitda: 3.2 },
      { ticker: 'F', pe: 12.4, ev_ebitda: 4.7 },
      { ticker: 'RIVN', pe: 0, ev_ebitda: 0 },
      { ticker: 'LCID', pe: 0, ev_ebitda: 0 }
    ]
  },
  'META': {
    revenue: generateQuarterlyData(134000, 16, 0.04),
    ebitda: generateQuarterlyData(46000, 16, 0.05),
    fcf: generateQuarterlyData(40000, 16, 0.03),
    margins: generateQuarterlyData(80.9, 16, 0.001).map((point, i) => ({
      date: point.date,
      gross: 80.9 + (Math.random() - 0.5) * 2,
      ebitda: 34.4 + (Math.random() - 0.5) * 4,
      net: 29.1 + (Math.random() - 0.5) * 3
    })),
    multiples: generateQuarterlyData(22.7, 16, -0.012).map((point, i) => ({
      date: point.date,
      pe: point.value,
      ev_ebitda: point.value * 0.67 + (Math.random() - 0.5) * 3
    })),
    peers: [
      { ticker: 'GOOGL', pe: 25.4, ev_ebitda: 18.9 },
      { ticker: 'SNAP', pe: 0, ev_ebitda: 12.8 },
      { ticker: 'PINS', pe: 21.3, ev_ebitda: 15.6 },
      { ticker: 'TWTR', pe: 0, ev_ebitda: 8.9 }
    ]
  }
};

// Mock ownership data
const mockOwnershipData: Record<string, CompanyOwnership> = {
  'AAPL': {
    slices: [
      { label: 'Institutional', value: 61.2, color: '#3B82F6' },
      { label: 'Retail', value: 37.8, color: '#10B981' },
      { label: 'Insiders', value: 1.0, color: '#F59E0B' }
    ],
    top_holders: [
      { name: 'Vanguard Group Inc', percentage: 8.2, shares: 1345000000 },
      { name: 'BlackRock Inc', percentage: 6.1, shares: 1001000000 },
      { name: 'Berkshire Hathaway Inc', percentage: 5.8, shares: 952000000 },
      { name: 'State Street Corp', percentage: 4.3, shares: 706000000 },
      { name: 'Fidelity Investments', percentage: 2.9, shares: 476000000 }
    ],
    insider_activity: [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'sell',
        shares: 50000,
        value: 9025000,
        person: 'Tim Cook (CEO)'
      },
      {
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'buy',
        shares: 25000,
        value: 4475000,
        person: 'Luca Maestri (CFO)'
      }
    ]
  },
  'MSFT': {
    slices: [
      { label: 'Institutional', value: 73.4, color: '#3B82F6' },
      { label: 'Retail', value: 24.9, color: '#10B981' },
      { label: 'Insiders', value: 1.7, color: '#F59E0B' }
    ],
    top_holders: [
      { name: 'Vanguard Group Inc', percentage: 8.9, shares: 662000000 },
      { name: 'BlackRock Inc', percentage: 7.1, shares: 528000000 },
      { name: 'State Street Corp', percentage: 4.8, shares: 357000000 },
      { name: 'Fidelity Investments', percentage: 2.6, shares: 193000000 },
      { name: 'Capital Research Global', percentage: 2.1, shares: 156000000 }
    ]
  },
  'GOOGL': {
    slices: [
      { label: 'Institutional', value: 65.8, color: '#3B82F6' },
      { label: 'Retail', value: 19.2, color: '#10B981' },
      { label: 'Insiders', value: 15.0, color: '#F59E0B' }
    ],
    top_holders: [
      { name: 'Larry Page', percentage: 6.2, shares: 388000000 },
      { name: 'Sergey Brin', percentage: 5.8, shares: 363000000 },
      { name: 'Vanguard Group Inc', percentage: 7.1, shares: 444000000 },
      { name: 'BlackRock Inc', percentage: 5.9, shares: 369000000 },
      { name: 'T. Rowe Price', percentage: 2.4, shares: 150000000 }
    ]
  },
  'AMZN': {
    slices: [
      { label: 'Institutional', value: 58.2, color: '#3B82F6' },
      { label: 'Retail', value: 41.8, color: '#10B981' },
      { label: 'Insiders', value: 0.0, color: '#F59E0B' }
    ],
    top_holders: [
      { name: 'Vanguard Group Inc', percentage: 6.8, shares: 340000000 },
      { name: 'BlackRock Inc', percentage: 5.4, shares: 270000000 },
      { name: 'State Street Corp', percentage: 3.2, shares: 160000000 },
      { name: 'Fidelity Investments', percentage: 2.8, shares: 140000000 },
      { name: 'Capital Research Global', percentage: 1.9, shares: 95000000 }
    ]
  },
  'TSLA': {
    slices: [
      { label: 'Institutional', value: 42.8, color: '#3B82F6' },
      { label: 'Retail', value: 44.2, color: '#10B981' },
      { label: 'Insiders', value: 13.0, color: '#F59E0B' }
    ],
    top_holders: [
      { name: 'Elon Musk', percentage: 13.0, shares: 411000000 },
      { name: 'Vanguard Group Inc', percentage: 7.1, shares: 224000000 },
      { name: 'BlackRock Inc', percentage: 5.8, shares: 183000000 },
      { name: 'State Street Corp', percentage: 3.4, shares: 107000000 },
      { name: 'Fidelity Investments', percentage: 2.9, shares: 92000000 }
    ]
  },
  'META': {
    slices: [
      { label: 'Institutional', value: 70.2, color: '#3B82F6' },
      { label: 'Retail', value: 16.8, color: '#10B981' },
      { label: 'Insiders', value: 13.0, color: '#F59E0B' }
    ],
    top_holders: [
      { name: 'Mark Zuckerberg', percentage: 13.0, shares: 350000000 },
      { name: 'Vanguard Group Inc', percentage: 8.2, shares: 221000000 },
      { name: 'BlackRock Inc', percentage: 6.9, shares: 186000000 },
      { name: 'State Street Corp', percentage: 4.1, shares: 110000000 },
      { name: 'Fidelity Investments', percentage: 3.2, shares: 86000000 }
    ]
  }
};

// Mock news data
const mockNewsData: Record<string, CompanyNews[]> = {
  'AAPL': [
    {
      id: 'n1',
      headline: 'Apple Unveils Next-Generation iPhone with Enhanced AI Features',
      source: 'TechCrunch',
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: 'https://techcrunch.com/apple-iphone-ai',
      summary: 'Apple introduces advanced AI capabilities in latest iPhone model, positioning for growth in AI-driven consumer electronics.',
      relevance_score: 95,
      sentiment: 'positive'
    },
    {
      id: 'n2',
      headline: 'Apple Services Revenue Hits New Record High',
      source: 'Reuters',
      published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      url: 'https://reuters.com/apple-services-revenue',
      summary: 'Services segment continues strong growth, contributing to diversified revenue streams.',
      relevance_score: 88,
      sentiment: 'positive'
    },
    {
      id: 'n3',
      headline: 'Supply Chain Concerns Weigh on Apple Outlook',
      source: 'Wall Street Journal',
      published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      url: 'https://wsj.com/apple-supply-chain',
      summary: 'Analysts express caution over potential supply chain disruptions affecting production.',
      relevance_score: 82,
      sentiment: 'negative'
    }
  ],
  'MSFT': [
    {
      id: 'n4',
      headline: 'Microsoft Azure Growth Accelerates in Cloud Market',
      source: 'Bloomberg',
      published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      url: 'https://bloomberg.com/microsoft-azure',
      summary: 'Azure cloud platform shows strong growth, gaining market share against competitors.',
      relevance_score: 92,
      sentiment: 'positive'
    },
    {
      id: 'n5',
      headline: 'Microsoft Announces AI Integration Across Office Suite',
      source: 'The Verge',
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      url: 'https://theverge.com/microsoft-ai-office',
      summary: 'Company integrates advanced AI features into productivity applications.',
      relevance_score: 90,
      sentiment: 'positive'
    }
  ],
  'GOOGL': [
    {
      id: 'n6',
      headline: 'Google Cloud Revenue Surges, Closing Gap with Competitors',
      source: 'CNBC',
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: 'https://cnbc.com/google-cloud-revenue',
      summary: 'Google Cloud shows impressive growth, strengthening position in enterprise market.',
      relevance_score: 89,
      sentiment: 'positive'
    }
  ]
};

// Company Detail API Functions
export async function getCompanyDetail(ticker: string): Promise<CompanyDetail> {
  try {
    return await apiClient.get<CompanyDetail>(`/api/v1/companies/${ticker.toUpperCase()}`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockDetail = mockCompanyDetailData[ticker.toUpperCase()];
    if (!mockDetail) {
      throw new Error(`Company detail ${ticker} not found`);
    }
    return mockDetail;
  }
}

export async function getCompanyTimeseries(ticker: string): Promise<CompanyTimeseries> {
  if (!ticker || ticker === 'undefined' || ticker === 'UNDEFINED') {
    throw new Error('Invalid ticker provided');
  }
  
  try {
    return await apiClient.get<CompanyTimeseries>(`/api/v1/companies/${ticker.toUpperCase()}/timeseries`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockTimeseries = mockTimeseriesData[ticker.toUpperCase()];
    if (!mockTimeseries) {
      throw new Error(`Company timeseries ${ticker} not found`);
    }
    return mockTimeseries;
  }
}

export async function getCompanyOwnership(ticker: string): Promise<CompanyOwnership> {
  if (!ticker || ticker === 'undefined' || ticker === 'UNDEFINED') {
    throw new Error('Invalid ticker provided');
  }
  
  try {
    return await apiClient.get<CompanyOwnership>(`/api/v1/companies/${ticker.toUpperCase()}/ownership`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockOwnership = mockOwnershipData[ticker.toUpperCase()];
    if (!mockOwnership) {
      throw new Error(`Company ownership ${ticker} not found`);
    }
    return mockOwnership;
  }
}

export async function getCompanyNews(ticker: string): Promise<CompanyNews[]> {
  if (!ticker || ticker === 'undefined' || ticker === 'UNDEFINED') {
    return [];
  }
  
  try {
    return await apiClient.get<CompanyNews[]>(`/api/v1/companies/${ticker.toUpperCase()}/news`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockNews = mockNewsData[ticker.toUpperCase()];
    if (!mockNews) {
      return [];
    }
    return mockNews;
  }
}

// React Query Hooks
export function useCompanyDetail(ticker: string) {
  return useQuery({
    queryKey: ['company-detail', ticker],
    queryFn: () => getCompanyDetail(ticker),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!ticker && ticker !== 'undefined' && ticker !== 'UNDEFINED' && ticker.length > 0
  });
}

export function useCompanyTimeseries(ticker: string) {
  return useQuery({
    queryKey: ['company-timeseries', ticker],
    queryFn: () => getCompanyTimeseries(ticker),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!ticker && ticker !== 'undefined' && ticker !== 'UNDEFINED' && ticker.length > 0
  });
}

export function useCompanyOwnership(ticker: string) {
  return useQuery({
    queryKey: ['company-ownership', ticker],
    queryFn: () => getCompanyOwnership(ticker),
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!ticker && ticker !== 'undefined' && ticker !== 'UNDEFINED' && ticker.length > 0
  });
}

export function useCompanyNews(ticker: string) {
  return useQuery({
    queryKey: ['company-news', ticker],
    queryFn: () => getCompanyNews(ticker),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!ticker && ticker !== 'undefined' && ticker !== 'UNDEFINED' && ticker.length > 0
  });
}

// Deal Detail API Functions
const mockDealDetails: Record<string, DealDetail> = {
  '1': {
    id: '1',
    acquirer: 'Tech Corp',
    target: 'StartupXYZ',
    value: 500,
    premium: 25.3,
    status: 'announced',
    announced_at: new Date().toISOString(),
    expected_close: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    sector: 'Technology',
    rationale: 'Strategic acquisition to expand AI capabilities and cloud infrastructure',
    synergies: 'Expected annual cost synergies of $50M by year 3',
    terms: {
      ev: 520,
      premium: 25.3,
      payment_mix: {
        cash_percent: 60,
        stock_percent: 40
      },
      consideration: '$300M cash + $200M in acquirer stock'
    },
    timeline: [
      {
        id: 'tl-1',
        date: new Date().toISOString(),
        title: 'Deal Announcement',
        description: 'Official announcement of acquisition agreement',
        status: 'completed',
        type: 'announcement'
      },
      {
        id: 'tl-2',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Regulatory Filing',
        description: 'Submit merger documents to regulatory authorities',
        status: 'pending',
        type: 'filing'
      },
      {
        id: 'tl-3',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Expected Close',
        description: 'Anticipated completion of transaction',
        status: 'pending',
        type: 'close'
      }
    ],
    parties: {
      acquirer: {
        ticker: 'TECH',
        name: 'Tech Corp',
        sector: 'Technology',
        market_cap: 50000,
        price: 125.50
      },
      target: {
        ticker: 'SXYZ',
        name: 'StartupXYZ',
        sector: 'Technology',
        market_cap: 400,
        price: 89.25
      },
      advisors: {
        financial: ['Goldman Sachs', 'J.P. Morgan'],
        legal: ['Wachtell Lipton', 'Skadden Arps']
      }
    },
    comparables: {
      sector_multiples: {
        ev_revenue: 3.2,
        ev_ebitda: 12.5
      },
      recent_deals: [
        {
          acquirer: 'BigTech Inc',
          target: 'AI Company',
          value: 450,
          ev_revenue: 3.5
        },
        {
          acquirer: 'Cloud Corp',
          target: 'Data Startup',
          value: 380,
          ev_revenue: 2.8
        }
      ]
    },
    news: [
      {
        id: 'news-deal-1',
        headline: 'Tech Corp Announces $500M Acquisition of StartupXYZ',
        source: 'Reuters',
        published_at: new Date().toISOString(),
        url: 'https://reuters.com/tech-corp-acquisition',
        summary: 'Strategic move to strengthen AI portfolio and expand market reach'
      },
      {
        id: 'news-deal-2',
        headline: 'Market Reaction: Tech Corp Stock Up 3% on Acquisition News',
        source: 'Bloomberg',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        url: 'https://bloomberg.com/tech-corp-reaction',
        summary: 'Investors welcome strategic acquisition, citing synergy potential'
      }
    ],
    filings: [
      {
        type: 'Merger Agreement',
        date: new Date().toISOString(),
        url: 'https://sec.gov/filing-123',
        description: 'Definitive merger agreement between Tech Corp and StartupXYZ'
      }
    ],
    price_impact: {
      acquirer_change: 2.8,
      target_change: 24.1,
      announcement_date: new Date().toISOString()
    }
  }
};

export async function getDealDetail(dealId: string): Promise<DealDetail> {
  try {
    return await apiClient.get<DealDetail>(`/api/v1/deals/${dealId}`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    const mockDetail = mockDealDetails[dealId];
    if (!mockDetail) {
      throw new Error(`Deal detail ${dealId} not found`);
    }
    return mockDetail;
  }
}

export function useDealDetail(dealId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: () => getDealDetail(dealId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!dealId
  });
}

// Legacy Deals Statistics API - replaced by DealsStats interface below
interface LegacyDealsStats {
  deals_by_month: { date: string; count: number; value: number }[];
  deals_by_industry: { industry: string; count: number; value: number }[];
  deals_by_size: { size_bucket: string; count: number; value: number }[];
}

// Generate mock deals statistics (legacy)
function generateLegacyDealsStats(): LegacyDealsStats {
  const now = new Date();
  
  // Generate monthly data for last 24 months
  const deals_by_month = [];
  for (let i = 23; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = Math.floor(Math.random() * 20) + 5; // 5-25 deals per month
    const avgDealSize = Math.random() * 2000 + 500; // $500M - $2.5B avg
    deals_by_month.push({
      date: date.toISOString().split('T')[0],
      count,
      value: count * avgDealSize
    });
  }
  
  // Industry distribution
  const deals_by_industry = [
    { industry: 'Technology', count: 145, value: 187000 },
    { industry: 'Healthcare', count: 89, value: 156000 },
    { industry: 'Financial Services', count: 67, value: 134000 },
    { industry: 'Energy', count: 43, value: 89000 },
    { industry: 'Consumer Discretionary', count: 38, value: 67000 },
    { industry: 'Industrials', count: 29, value: 45000 },
    { industry: 'Communication Services', count: 24, value: 78000 },
    { industry: 'Materials', count: 18, value: 34000 }
  ];
  
  // Size buckets
  const deals_by_size = [
    { size_bucket: '$0-500M', count: 178, value: 45000 },
    { size_bucket: '$500M-1B', count: 89, value: 67000 },
    { size_bucket: '$1-5B', count: 67, value: 156000 },
    { size_bucket: '$5-20B', count: 34, value: 234000 },
    { size_bucket: '$20B+', count: 12, value: 456000 }
  ];
  
  return { deals_by_month, deals_by_industry, deals_by_size };
}

export async function getDealsStatsLegacy(filters?: {
  industry?: string;
  status?: string;
  size?: number;
  startDate?: string;
  endDate?: string;
}): Promise<LegacyDealsStats> {
  try {
    const params = new URLSearchParams();
    if (filters?.industry && filters.industry !== 'All') params.append('industry', filters.industry);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.size) params.append('size', filters.size.toString());
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    
    return await apiClient.get<LegacyDealsStats>(`/api/v1/deals/stats?${params.toString()}`);
  } catch (error) {
    console.warn('API failed, using mock data:', error);
    return generateLegacyDealsStats();
  }
}

// Company price history for sparklines (daily data, last 30 days)
export async function getCompanyPriceHistory(ticker: string): Promise<{ date: string; price: number }[]> {
  // Always use mock data for now since API endpoints are not available
  console.log(`Generating mock price history for ${ticker}`);
  
  // Generate mock daily price data for last 30 days
  const basePrice = mockCompanyDetails[ticker.toUpperCase()]?.price || 100;
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const randomWalk = (Math.random() - 0.5) * 0.05; // ±2.5% daily volatility
    const price = i === 0 ? basePrice : basePrice * (1 + randomWalk * (30 - i) / 30);
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(price, basePrice * 0.8) // Floor at 80% of current price
    });
  }
  
  return data;
}

// Enhanced Deals API with flagship deal detail pages
import { DealsListItem, DealDetailPage, DealsStats, DealParty, DealKPI, DealTimelineEntry, DealNewsItem } from '../types';

// Mock data for flagship deals
const mockDealsData: Record<string, DealDetailPage> = {
  'msft-atvi': {
    id: 'msft-atvi',
    title: 'Microsoft acquires Activision Blizzard for $68.7B',
    status: 'Closed',
    announced_at: '2022-01-18T00:00:00Z',
    closed_at: '2023-10-13T00:00:00Z',
    value_usd: 68700,
    premium_pct: 45.3,
    multiple_ev_ebitda: 13.8,
    parties: [
      {
        name: 'Microsoft Corporation',
        ticker: 'MSFT',
        role: 'Acquirer',
        industry: 'Technology',
        country: 'United States'
      },
      {
        name: 'Activision Blizzard Inc.',
        ticker: 'ATVI',
        role: 'Target',
        industry: 'Gaming',
        country: 'United States'
      }
    ],
    overview: 'Microsoft\'s acquisition of Activision Blizzard represents the largest gaming acquisition in history, positioning Microsoft as a dominant player in the gaming industry with iconic franchises including Call of Duty, World of Warcraft, and Candy Crush.',
    rationale: [
      'Accelerate growth in Microsoft\'s gaming business across mobile, PC, console and cloud',
      'Acquire world-class content, talent and franchises including Call of Duty and World of Warcraft',
      'Enhance Game Pass subscription service with premium content',
      'Strengthen position in the rapidly growing mobile gaming market through King Digital Entertainment'
    ],
    kpis: [
      { label: 'Transaction Value', value: '$68.7B', hint: 'All-cash transaction' },
      { label: 'Premium to Market Price', value: '45.3%', deltaPct: 45.3 },
      { label: 'EV/EBITDA Multiple', value: '13.8x', hint: 'Based on 2022 EBITDA' },
      { label: 'Price per Share', value: '$95.00', hint: 'Cash consideration' },
      { label: 'Implied Gaming Revenue', value: '$15.3B', hint: 'Pro forma combined gaming revenue' },
      { label: 'Cost Synergies (Annual)', value: '$2.0B', hint: 'Expected by year 3', deltaPct: 15.2 }
    ],
    timeline: [
      { date: '2022-01-18T00:00:00Z', title: 'Deal Announced', description: 'Microsoft announces intent to acquire Activision Blizzard', type: 'Announcement' },
      { date: '2022-04-28T00:00:00Z', title: 'Shareholder Approval', description: 'Activision shareholders approve the transaction', type: 'Shareholder' },
      { date: '2022-11-08T00:00:00Z', title: 'CMA Investigation', description: 'UK CMA opens Phase 2 investigation', type: 'Regulatory' },
      { date: '2023-05-15T00:00:00Z', title: 'EU Approval', description: 'European Commission approves transaction with conditions', type: 'Regulatory' },
      { date: '2023-10-13T00:00:00Z', title: 'Transaction Closes', description: 'Deal officially completed after regulatory approvals', type: 'Closing' }
    ],
    news: [
      {
        id: 'n1',
        title: 'Microsoft Completes $69 Billion Activision Blizzard Deal',
        source: 'Wall Street Journal',
        url: 'https://wsj.com/microsoft-activision-complete',
        published_at: '2023-10-13T16:00:00Z',
        sentiment: 'positive',
        relevance: 0.98,
        summary: 'Microsoft has officially completed its $68.7 billion acquisition of Activision Blizzard after nearly two years of regulatory scrutiny.'
      },
      {
        id: 'n2',
        title: 'Gaming Industry Consolidation Accelerates Post-Microsoft Deal',
        source: 'Financial Times',
        url: 'https://ft.com/gaming-consolidation',
        published_at: '2023-10-14T08:00:00Z',
        sentiment: 'neutral',
        relevance: 0.85,
        summary: 'Industry analysts predict increased M&A activity in gaming sector following successful completion of mega-deal.'
      }
    ]
  },
  'amzn-wholefoods': {
    id: 'amzn-wholefoods',
    title: 'Amazon acquires Whole Foods Market for $13.7B',
    status: 'Closed',
    announced_at: '2017-06-16T00:00:00Z',
    closed_at: '2017-08-28T00:00:00Z',
    value_usd: 13700,
    premium_pct: 27.0,
    multiple_ev_ebitda: 28.2,
    parties: [
      {
        name: 'Amazon.com Inc.',
        ticker: 'AMZN',
        role: 'Acquirer',
        industry: 'E-commerce',
        country: 'United States'
      },
      {
        name: 'Whole Foods Market Inc.',
        ticker: 'WFM',
        role: 'Target',
        industry: 'Retail',
        country: 'United States'
      }
    ],
    overview: 'Amazon\'s acquisition of Whole Foods Market marked a major expansion into physical retail and grocery, providing Amazon with 460+ premium grocery stores and accelerating its omnichannel strategy.',
    rationale: [
      'Enter the $800B grocery market with established premium brand',
      'Acquire 460+ physical store locations for faster delivery and pickup',
      'Integrate Prime membership benefits with grocery shopping',
      'Leverage Whole Foods\' organic and premium food expertise'
    ],
    kpis: [
      { label: 'Transaction Value', value: '$13.7B', hint: 'All-cash transaction' },
      { label: 'Premium to Market Price', value: '27.0%', deltaPct: 27.0 },
      { label: 'EV/EBITDA Multiple', value: '28.2x', hint: 'High multiple for grocery sector' },
      { label: 'Price per Share', value: '$42.00', hint: 'Cash consideration' },
      { label: 'Store Count', value: '460+', hint: 'Physical locations acquired' },
      { label: 'Grocery Market Size', value: '$800B', hint: 'Addressable market opportunity' }
    ],
    timeline: [
      { date: '2017-06-16T00:00:00Z', title: 'Deal Announced', description: 'Amazon announces acquisition of Whole Foods', type: 'Announcement' },
      { date: '2017-06-29T00:00:00Z', title: 'Shareholder Approval', description: 'Whole Foods shareholders approve transaction', type: 'Shareholder' },
      { date: '2017-08-23T00:00:00Z', title: 'FTC Clearance', description: 'Federal Trade Commission clears the acquisition', type: 'Regulatory' },
      { date: '2017-08-28T00:00:00Z', title: 'Transaction Closes', description: 'Deal completed, Whole Foods becomes Amazon subsidiary', type: 'Closing' }
    ],
    news: [
      {
        id: 'n3',
        title: 'Amazon-Whole Foods Deal Reshapes Grocery Industry',
        source: 'Reuters',
        url: 'https://reuters.com/amazon-wholefoods-impact',
        published_at: '2017-08-28T14:00:00Z',
        sentiment: 'positive',
        relevance: 0.96,
        summary: 'The acquisition immediately disrupted traditional grocery retailers and accelerated online grocery adoption.'
      }
    ]
  },
  'meta-giphy': {
    id: 'meta-giphy',
    title: 'Meta sells Giphy to Shutterstock for $53M',
    status: 'Closed',
    announced_at: '2022-10-13T00:00:00Z',
    closed_at: '2023-05-31T00:00:00Z',
    value_usd: 53,
    premium_pct: -85.0,
    multiple_ev_ebitda: 2.1,
    parties: [
      {
        name: 'Meta Platforms Inc.',
        ticker: 'META',
        role: 'Acquirer',
        industry: 'Social Media',
        country: 'United States'
      },
      {
        name: 'Shutterstock Inc.',
        ticker: 'SSTK',
        role: 'Target',
        industry: 'Digital Media',
        country: 'United States'
      }
    ],
    overview: 'Following regulatory pressure from the UK CMA, Meta was forced to divest Giphy to Shutterstock at a significant loss, representing one of the largest forced divestitures in recent tech history.',
    rationale: [
      'Comply with UK Competition and Markets Authority divestiture order',
      'Resolve regulatory concerns about concentration in GIF market',
      'Focus resources on core metaverse and social media initiatives',
      'Eliminate ongoing regulatory uncertainty and costs'
    ],
    kpis: [
      { label: 'Sale Price', value: '$53M', hint: 'Massive loss from $400M acquisition' },
      { label: 'Loss on Investment', value: '-85.0%', deltaPct: -85.0 },
      { label: 'Original Acquisition Price', value: '$400M', hint: 'Meta paid in 2020' },
      { label: 'Regulatory Timeline', value: '30 months', hint: 'From CMA investigation to divestiture' },
      { label: 'GIF Library Size', value: '1B+', hint: 'GIFs in Giphy database' }
    ],
    timeline: [
      { date: '2020-05-15T00:00:00Z', title: 'Original Acquisition', description: 'Meta (Facebook) acquires Giphy for $400M', type: 'Other' },
      { date: '2021-11-30T00:00:00Z', title: 'CMA Blocks Deal', description: 'UK regulator orders divestiture', type: 'Regulatory' },
      { date: '2022-10-13T00:00:00Z', title: 'Sale Announced', description: 'Meta announces sale to Shutterstock', type: 'Announcement' },
      { date: '2023-05-31T00:00:00Z', title: 'Divestiture Complete', description: 'Shutterstock completes acquisition', type: 'Closing' }
    ],
    news: [
      {
        id: 'n4',
        title: 'Meta Forced to Sell Giphy at Massive Loss After Regulatory Order',
        source: 'Bloomberg',
        url: 'https://bloomberg.com/meta-giphy-loss',
        published_at: '2022-10-13T10:00:00Z',
        sentiment: 'negative',
        relevance: 0.92,
        summary: 'The forced sale represents one of the largest losses on a tech acquisition due to regulatory intervention.'
      }
    ]
  },
  'aapl-beats': {
    id: 'aapl-beats',
    title: 'Apple acquires Beats Electronics for $3.0B',
    status: 'Closed',
    announced_at: '2014-05-28T00:00:00Z',
    closed_at: '2014-08-01T00:00:00Z',
    value_usd: 3000,
    premium_pct: 15.0,
    multiple_ev_ebitda: 12.5,
    parties: [
      {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        role: 'Acquirer',
        industry: 'Technology',
        country: 'United States'
      },
      {
        name: 'Beats Electronics LLC',
        ticker: undefined,
        role: 'Target',
        industry: 'Audio Equipment',
        country: 'United States'
      }
    ],
    overview: 'Apple\'s acquisition of Beats Electronics brought premium headphone expertise and streaming music capabilities, laying the foundation for Apple Music and enhancing the company\'s audio ecosystem.',
    rationale: [
      'Enter premium headphone market with established brand',
      'Acquire streaming music technology and content relationships',
      'Add music industry talent including Jimmy Iovine and Dr. Dre',
      'Enhance ecosystem with high-margin audio accessories'
    ],
    kpis: [
      { label: 'Transaction Value', value: '$3.0B', hint: 'Mix of cash and stock' },
      { label: 'Premium to Valuation', value: '15.0%', deltaPct: 15.0 },
      { label: 'Headphone Market Share', value: '27%', hint: 'Beats share in premium segment' },
      { label: 'Streaming Subscribers', value: '250K', hint: 'Beats Music subscriber base' },
      { label: 'Annual Revenue Run-rate', value: '$1.8B', hint: 'Beats revenue at acquisition' }
    ],
    timeline: [
      { date: '2014-05-28T00:00:00Z', title: 'Deal Announced', description: 'Apple announces Beats acquisition', type: 'Announcement' },
      { date: '2014-07-25T00:00:00Z', title: 'Regulatory Approval', description: 'Deal receives necessary approvals', type: 'Regulatory' },
      { date: '2014-08-01T00:00:00Z', title: 'Transaction Closes', description: 'Beats becomes Apple subsidiary', type: 'Closing' },
      { date: '2015-06-30T00:00:00Z', title: 'Apple Music Launch', description: 'Apple Music launches based on Beats technology', type: 'Other' }
    ],
    news: [
      {
        id: 'n5',
        title: 'Apple Completes $3B Beats Acquisition, Largest in Company History',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/apple-beats-complete',
        published_at: '2014-08-01T18:00:00Z',
        sentiment: 'positive',
        relevance: 0.94,
        summary: 'The acquisition marks Apple\'s largest purchase to date and signals serious entry into music streaming.'
      }
    ]
  }
};

// Mock deals list data
const mockDealsListData: DealsListItem[] = [
  {
    id: 'msft-atvi',
    title: 'Microsoft acquires Activision Blizzard',
    date: '2022-01-18T00:00:00Z',
    value_usd: 68700,
    status: 'Closed',
    acquirer: 'Microsoft Corporation',
    target: 'Activision Blizzard Inc.',
    industry: 'Technology',
    sizeBucket: '$50B+'
  },
  {
    id: 'amzn-wholefoods',
    title: 'Amazon acquires Whole Foods Market',
    date: '2017-06-16T00:00:00Z',
    value_usd: 13700,
    status: 'Closed',
    acquirer: 'Amazon.com Inc.',
    target: 'Whole Foods Market Inc.',
    industry: 'Consumer Discretionary',
    sizeBucket: '$10B-$50B'
  },
  {
    id: 'meta-giphy',
    title: 'Meta divests Giphy to Shutterstock',
    date: '2022-10-13T00:00:00Z',
    value_usd: 53,
    status: 'Closed',
    acquirer: 'Shutterstock Inc.',
    target: 'Giphy Inc.',
    industry: 'Technology',
    sizeBucket: '<$500M'
  },
  {
    id: 'aapl-beats',
    title: 'Apple acquires Beats Electronics',
    date: '2014-05-28T00:00:00Z',
    value_usd: 3000,
    status: 'Closed',
    acquirer: 'Apple Inc.',
    target: 'Beats Electronics LLC',
    industry: 'Technology',
    sizeBucket: '$1B-$10B'
  },
  {
    id: 'nvda-arm-failed',
    title: 'NVIDIA-ARM deal terminated',
    date: '2020-09-14T00:00:00Z',
    value_usd: 40000,
    status: 'Terminated',
    acquirer: 'NVIDIA Corporation',
    target: 'ARM Holdings',
    industry: 'Technology',
    sizeBucket: '$10B-$50B'
  },
  {
    id: 'broadcom-vmware',
    title: 'Broadcom acquires VMware',
    date: '2022-05-26T00:00:00Z',
    value_usd: 61000,
    status: 'Pending',
    acquirer: 'Broadcom Inc.',
    target: 'VMware Inc.',
    industry: 'Technology',
    sizeBucket: '$50B+'
  }
];

// Mock deals stats
function generateMockDealsStats(filters?: { industry?: string; status?: string; size?: string; startDate?: string; endDate?: string }): DealsStats {
  const baseStats = {
    byMonth: [
      { month: 'Jan 2024', count: 12 },
      { month: 'Feb 2024', count: 18 },
      { month: 'Mar 2024', count: 15 },
      { month: 'Apr 2024', count: 22 },
      { month: 'May 2024', count: 19 },
      { month: 'Jun 2024', count: 25 },
      { month: 'Jul 2024', count: 28 },
      { month: 'Aug 2024', count: 23 },
      { month: 'Sep 2024', count: 31 },
      { month: 'Oct 2024', count: 27 },
      { month: 'Nov 2024', count: 21 },
      { month: 'Dec 2024', count: 16 }
    ],
    byIndustry: [
      { industry: 'Technology', count: 87 },
      { industry: 'Healthcare', count: 62 },
      { industry: 'Financial Services', count: 45 },
      { industry: 'Consumer Discretionary', count: 38 },
      { industry: 'Energy', count: 29 },
      { industry: 'Materials', count: 23 },
      { industry: 'Industrials', count: 19 },
      { industry: 'Utilities', count: 12 }
    ],
    bySize: [
      { bucket: '<$500M', count: 156 },
      { bucket: '$500M–$1B', count: 78 },
      { bucket: '$1B–$10B', count: 89 },
      { bucket: '$10B–$50B', count: 23 },
      { bucket: '$50B+', count: 9 }
    ]
  };
  
  // Apply basic filtering simulation
  if (filters?.industry && filters.industry !== 'All') {
    const industryMultiplier = filters.industry === 'Technology' ? 1.0 : 0.6;
    baseStats.byMonth = baseStats.byMonth.map(m => ({ ...m, count: Math.round(m.count * industryMultiplier) }));
  }
  
  return baseStats;
}

// API Functions
export async function getDeals(params?: {
  industry?: string;
  status?: string;
  size?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  q?: string;
}): Promise<DealsListItem[]> {
  try {
    const urlParams = new URLSearchParams();
    if (params?.industry && params.industry !== 'All') urlParams.append('industry', params.industry);
    if (params?.status && params.status !== 'All') urlParams.append('status', params.status);
    if (params?.size && params.size !== 'All') urlParams.append('size', params.size);
    if (params?.startDate) urlParams.append('start_date', params.startDate);
    if (params?.endDate) urlParams.append('end_date', params.endDate);
    if (params?.page) urlParams.append('page', params.page.toString());
    if (params?.q) urlParams.append('q', params.q);
    
    const response = await apiClient.get<DealsListItem[]>(`/api/v1/deals?${urlParams.toString()}`);
    return response;
  } catch (error) {
    console.warn('API failed, using mock deals data:', error);
    
    // Apply client-side filtering to mock data
    let filtered = [...mockDealsListData];
    
    if (params?.industry && params.industry !== 'All') {
      filtered = filtered.filter(deal => deal.industry?.toLowerCase().includes(params.industry!.toLowerCase()));
    }
    
    if (params?.status && params.status !== 'All') {
      filtered = filtered.filter(deal => deal.status.toLowerCase() === params.status!.toLowerCase());
    }
    
    if (params?.q) {
      const query = params.q.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.title.toLowerCase().includes(query) ||
        deal.acquirer?.toLowerCase().includes(query) ||
        deal.target?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }
}

export async function getDealDetailPage(id: string): Promise<DealDetailPage> {
  try {
    const response = await apiClient.get<DealDetailPage>(`/api/v1/deals/${id}`);
    return response;
  } catch (error) {
    console.warn('API failed, using mock deal detail:', error);
    const mockDeal = mockDealsData[id];
    if (!mockDeal) {
      throw new Error(`Deal ${id} not found`);
    }
    return mockDeal;
  }
}

export async function getDealsStatsNew(filters?: {
  industry?: string;
  status?: string;
  size?: string;
  startDate?: string;
  endDate?: string;
}): Promise<DealsStats> {
  try {
    const urlParams = new URLSearchParams();
    if (filters?.industry && filters.industry !== 'All') urlParams.append('industry', filters.industry);
    if (filters?.status && filters.status !== 'All') urlParams.append('status', filters.status);
    if (filters?.size && filters.size !== 'All') urlParams.append('size', filters.size);
    if (filters?.startDate) urlParams.append('start_date', filters.startDate);
    if (filters?.endDate) urlParams.append('end_date', filters.endDate);
    
    const response = await apiClient.get<DealsStats>(`/api/v1/deals/stats?${urlParams.toString()}`);
    return response;
  } catch (error) {
    console.warn('API failed, using mock deals stats:', error);
    return generateMockDealsStats(filters);
  }
}

// React Query Hooks
export function useDeals(params?: {
  industry?: string;
  status?: string;
  size?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  q?: string;
}) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => getDeals(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDealDetailPage(id: string) {
  return useQuery({
    queryKey: ['deal-detail-page', id],
    queryFn: () => getDealDetailPage(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useDealsStatsNew(filters?: {
  industry?: string;
  status?: string;
  size?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['deals-stats-new', filters],
    queryFn: () => getDealsStatsNew(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export { API_BASE_URL };

// ----------------------------
// IB Endpoints & Fallbacks
// ----------------------------
const PROXY = "/api/proxy"; // local proxy to avoid CORS in prod

type CompsRow = {
  ticker: string; name: string; sector: string; region: string;
  market_cap: number; revenue: number; ebitda: number; pe: number; ev_ebitda: number;
};
type CompsResponse = { items: CompsRow[]; total: number; page: number; page_size: number; };
type PrecedentDeal = { id: string; acquirer: string; target: string; announced: string; value: number; industry: string; status: string; ev_ebitda?: number; premium?: number; };
type PrecedentsResponse = { items: PrecedentDeal[]; total: number; page: number; page_size: number; };
type MarketSnapshot = { indices: { name: string; value: number; change: number; }[]; yields: { tenor: string; value: number; }[]; fx: { pair: string; value: number;}[]; commodities: { name: string; value: number; }[]; asof: string; };

// Mock data for IB pages (used when API fails or USE_MOCKS=true)
const mockComps: CompsResponse = {
  items: [
    { ticker:"AAPL", name:"Apple Inc.", sector:"Technology", region:"US", market_cap:2800000, revenue:385000, ebitda:130000, pe:28.2, ev_ebitda:20.5 },
    { ticker:"MSFT", name:"Microsoft Corp.", sector:"Technology", region:"US", market_cap:3100000, revenue:250000, ebitda:120000, pe:35.1, ev_ebitda:22.1 },
    { ticker:"GOOGL", name:"Alphabet Inc.", sector:"Communication Services", region:"US", market_cap:2100000, revenue:305000, ebitda:98000, pe:26.4, ev_ebitda:17.9 },
  ],
  total: 3, page: 1, page_size: 50,
};
const mockPrecedents: PrecedentsResponse = {
  items: [
    { id:"msft-atvi", acquirer:"Microsoft", target:"Activision Blizzard", announced:"2022-01-18", value:68700, industry:"Technology", status:"Completed", ev_ebitda:18.8, premium:45.3 },
    { id:"avgo-vmw", acquirer:"Broadcom", target:"VMware", announced:"2022-05-26", value:69000, industry:"Technology", status:"Completed", ev_ebitda:19.2, premium:49.0 },
  ],
  total: 2, page:1, page_size: 50,
};
const mockMarket: MarketSnapshot = {
  indices: [
    { name:"SPX", value:4567.8, change: 1.2 },
    { name:"NDX", value:14234.5, change: 0.8 },
    { name:"DJIA", value:35678.9, change: 0.2 },
  ],
  yields: [{tenor:"2Y", value:4.78},{tenor:"10Y", value:4.12},{tenor:"30Y", value:4.03}],
  fx: [{pair:"EURUSD", value:1.091},{pair:"USDJPY", value:155.4}],
  commodities: [{name:"WTI", value:77.2},{name:"Gold", value:2310}],
  asof: new Date().toISOString(),
};

async function safeFetch<T>(path: string, mock: T, init?: RequestInit): Promise<T> {
  const url = `${PROXY}/${path.replace(/^\/+/, "")}`;
  try {
    const store = useApiStatusStore.getState();
    if (store.usingMocks) return mock;
    const r = await fetch(url, { ...init, cache: "no-store" });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return (await r.json()) as T;
  } catch (e) {
    console.warn(`⚠️ Falling back to mock for ${path}:`, e);
    return mock;
  }
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  return safeFetch<MarketSnapshot>("api/v1/market/snapshot", mockMarket);
}

// React Query hooks for IB endpoints
export const useComps = (params: Record<string,string|number> = {}) =>
  useQuery({ queryKey:["comps", params], queryFn: () => getComps(params), staleTime: 5*60*1000 });
export const usePrecedents = (params: Record<string,string|number> = {}) =>
  useQuery({ queryKey:["precedents", params], queryFn: () => getPrecedents(), staleTime: 5*60*1000 });
export const useMarketSnapshot = () =>
  useQuery({ queryKey:["market/snapshot"], queryFn: getMarketSnapshot, refetchInterval: 60*1000 });

// ----------------------------
// Enhanced IB API Functions
// ----------------------------

// Enhanced Comps API with rich mock data
export async function getCompsEnhanced(params: Record<string,string|number> = {}) {
  const qs = new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)])).toString();
  try {
    const store = useApiStatusStore.getState();
    if (store.usingMocks) throw new Error('Using mocks');
    const response = await fetch(`${PROXY}/api/v1/comps${qs ? `?${qs}` : ""}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (e) {
    console.warn('⚠️ Comps API failed, using mock data:', e);
    return {
      items: [
        { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 180.50, market_cap: 2800000, pe: 28.5, ev_ebitda: 22.1, rev_growth: 8.2, ebitda_margin: 29.5, ndebt: 15000 },
        { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", price: 378.25, market_cap: 2700000, pe: 32.1, ev_ebitda: 24.8, rev_growth: 12.1, ebitda_margin: 42.1, ndebt: 22000 },
        { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Communication Services", price: 135.80, market_cap: 1700000, pe: 25.4, ev_ebitda: 18.9, rev_growth: 9.8, ebitda_margin: 27.3, ndebt: 8500 },
        { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", price: 142.33, market_cap: 1400000, pe: 45.2, ev_ebitda: 26.4, rev_growth: 15.3, ebitda_margin: 8.2, ndebt: 35000 },
        { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", price: 238.45, market_cap: 800000, pe: 65.8, ev_ebitda: 42.1, rev_growth: 28.5, ebitda_margin: 9.2, ndebt: 5000 }
      ],
      total: 5,
      page: 1,
      limit: 50,
      summary: { median_pe: 32.1, median_ev_ebitda: 24.8, count: 5 }
    };
  }
}

// Enhanced Precedents API with rich deal data
export async function getPrecedentsEnhanced(params: Record<string,string|number> = {}) {
  const qs = new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)])).toString();
  try {
    const store = useApiStatusStore.getState();
    if (store.usingMocks) throw new Error('Using mocks');
    const response = await fetch(`${PROXY}/api/v1/precedents${qs ? `?${qs}` : ""}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (e) {
    console.warn('⚠️ Precedents API failed, using mock data:', e);
    return {
      items: [
        { id: "msft-atvi", acquirer: "Microsoft Corporation", target: "Activision Blizzard Inc.", announced: "2022-01-18", status: "Completed", industry: "Technology", value: 68700, ev_ebitda: 18.8, premium: 45.3, cash_percent: 100.0, stock_percent: 0.0, advisors: { buy: ["Allen & Company"], sell: ["Goldman Sachs", "J.P. Morgan"] }},
        { id: "avgo-vmw", acquirer: "Broadcom Inc.", target: "VMware Inc.", announced: "2022-05-26", status: "Completed", industry: "Technology", value: 69000, ev_ebitda: 19.2, premium: 49.0, cash_percent: 100.0, stock_percent: 0.0, advisors: { buy: ["Goldman Sachs", "J.P. Morgan"], sell: ["Morgan Stanley", "Credit Suisse"] }},
        { id: "pfe-sgen", acquirer: "Pfizer Inc.", target: "Seagen Inc.", announced: "2023-03-13", status: "Completed", industry: "Healthcare", value: 43000, ev_ebitda: 25.8, premium: 32.8, cash_percent: 100.0, stock_percent: 0.0, advisors: { buy: ["Morgan Stanley", "Guggenheim"], sell: ["Goldman Sachs", "Evercore"] }}
      ],
      summary: { total_value: 180700, median_ev_ebitda: 19.2, median_premium: 45.3 }
    };
  }
}


// DCF Valuation API
export async function postDCF(payload: any) {
  try {
    const store = useApiStatusStore.getState();
    if (store.usingMocks) throw new Error('Using mocks');
    const response = await fetch(`${PROXY}/api/v1/valuation/dcf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (e) {
    console.warn('⚠️ DCF API failed, using mock calculation:', e);
    // Mock DCF calculation
    const { base_revenue, growth, ebitda_margin, wacc, lgr } = payload;
    let revenue = base_revenue;
    const projections = [];
    
    for (let i = 0; i < 5; i++) {
      revenue = revenue * (1 + growth[i]);
      const ebitda = revenue * ebitda_margin[i];
      const fcff = ebitda * 0.6; // Simplified
      const pv = fcff / Math.pow(1 + wacc, i + 1);
      projections.push({ year: 2025 + i, revenue, ebitda, fcff, pv });
    }
    
    const pv_sum = projections.reduce((sum, p) => sum + p.pv, 0);
    const tv_pv = (projections[4].fcff * (1 + lgr)) / (wacc - lgr) / Math.pow(1 + wacc, 5);
    const ev = pv_sum + tv_pv;
    
    return {
      projections,
      pv_sum,
      tv_pv,
      ev,
      sensitivity: [
        { wacc: wacc - 0.005, g: lgr, ev: ev * 1.1 },
        { wacc: wacc, g: lgr, ev },
        { wacc: wacc + 0.005, g: lgr, ev: ev * 0.9 }
      ]
    };
  }
}

// React Query hooks for enhanced IB functionality
export const useCompsEnhanced = (params: Record<string,string|number> = {}) =>
  useQuery({ queryKey:["comps-enhanced", params], queryFn: () => getCompsEnhanced(params), staleTime: 5*60*1000 });

export const usePrecedentsEnhanced = (params: Record<string,string|number> = {}) =>
  useQuery({ queryKey:["precedents-enhanced", params], queryFn: () => getPrecedentsEnhanced(params), staleTime: 5*60*1000 });

export const useLeagueTables = (params: Record<string,string|number> = {}) =>
  useQuery({ queryKey:["league-tables", params], queryFn: () => getLeagueTables(params), staleTime: 10*60*1000 });

export const useDCFMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postDCF,
    onSuccess: () => {
      // Invalidate and refetch any related queries
      queryClient.invalidateQueries({ queryKey: ['dcf'] });
    },
  });
};

// ----------------------------
// New IB Types & API Helpers
// ----------------------------

export type CompRow = {
  ticker: string; 
  name: string; 
  sector: string; 
  region: string;
  price: number; 
  market_cap: number; 
  revenue: number; 
  ebitda: number;
  pe: number; 
  ev_ebitda: number; 
  ev_sales: number;
};

export type PrecedentDeal = {
  id: string;
  acquirer: string; 
  target: string; 
  sector: string; 
  status: "Announced"|"Completed";
  announced: string; 
  value: number; 
  ev_ebitda?: number; 
  premium?: number;
  rationale?: string; 
  terms?: string;
  timeline?: Array<{date:string; title:string; note?:string; tag?:string;}>;
};

export type LeagueRow = { 
  advisor: string; 
  rank: number; 
  deals: number; 
  total_value: number; 
  avg_size: number; 
  sector?: string; 
};

// Rich mock data for comps
const mockCompsData: CompRow[] = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", region: "US", price: 180.50, market_cap: 2800000, revenue: 394000, ebitda: 130000, pe: 28.5, ev_ebitda: 22.1, ev_sales: 7.1 },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", region: "US", price: 378.25, market_cap: 2700000, revenue: 211000, ebitda: 89000, pe: 32.1, ev_ebitda: 24.8, ev_sales: 12.8 },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", region: "US", price: 135.80, market_cap: 1700000, revenue: 283000, ebitda: 77000, pe: 25.4, ev_ebitda: 18.9, ev_sales: 6.0 },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", region: "US", price: 142.33, market_cap: 1400000, revenue: 514000, ebitda: 42000, pe: 45.2, ev_ebitda: 26.4, ev_sales: 2.7 },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", region: "US", price: 238.45, market_cap: 800000, revenue: 96000, ebitda: 8800, pe: 65.8, ev_ebitda: 42.1, ev_sales: 8.3 },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Communication Services", region: "US", price: 298.67, market_cap: 750000, revenue: 134000, ebitda: 46000, pe: 22.7, ev_ebitda: 15.3, ev_sales: 5.6 },
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology", region: "US", price: 875.28, market_cap: 2200000, revenue: 79000, ebitda: 32000, pe: 68.2, ev_ebitda: 55.1, ev_sales: 27.8 },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services", region: "US", price: 158.92, market_cap: 460000, revenue: 155000, ebitda: 62000, pe: 12.8, ev_ebitda: 8.9, ev_sales: 3.0 },
  { ticker: "CVX", name: "Chevron Corporation", sector: "Energy", region: "US", price: 156.44, market_cap: 295000, revenue: 200000, ebitda: 45000, pe: 13.4, ev_ebitda: 8.2, ev_sales: 1.5 },
  { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", sector: "Financial Services", region: "US", price: 425.18, market_cap: 950000, revenue: 365000, ebitda: 45000, pe: 21.1, ev_ebitda: 18.9, ev_sales: 2.6 }
];

// Rich mock data for precedent deals
const mockPrecedentsData: PrecedentDeal[] = [
  {
    id: "msft-atvi",
    acquirer: "Microsoft Corporation",
    target: "Activision Blizzard Inc.",
    sector: "Technology",
    status: "Completed",
    announced: "2022-01-18",
    value: 68700,
    ev_ebitda: 18.8,
    premium: 45.3,
    rationale: "Strategic acquisition to expand gaming capabilities and cloud infrastructure, adding iconic franchises including Call of Duty, World of Warcraft, and Candy Crush.",
    terms: "All-cash transaction at $95.00 per share. Break fee of $3.0B. Expected annual cost synergies of $2.0B by year 3.",
    timeline: [
      { date: "2022-01-18", title: "Deal Announced", note: "Microsoft announces intent to acquire Activision Blizzard", tag: "announcement" },
      { date: "2022-04-28", title: "Shareholder Approval", note: "Activision shareholders approve the transaction", tag: "regulatory" },
      { date: "2022-11-08", title: "CMA Investigation", note: "UK CMA opens Phase 2 investigation", tag: "regulatory" },
      { date: "2023-05-15", title: "EU Approval", note: "European Commission approves transaction with conditions", tag: "regulatory" },
      { date: "2023-10-13", title: "Transaction Closes", note: "Deal officially completed after regulatory approvals", tag: "closing" }
    ]
  },
  {
    id: "avgo-vmw",
    acquirer: "Broadcom Inc.",
    target: "VMware Inc.",
    sector: "Technology",
    status: "Completed",
    announced: "2022-05-26",
    value: 69000,
    ev_ebitda: 19.2,
    premium: 49.0,
    rationale: "Acquisition to strengthen position in enterprise software and accelerate multi-cloud strategy.",
    terms: "All-cash transaction at $142.50 per share plus special dividend of $12.00. Break fee of $1.5B.",
    timeline: [
      { date: "2022-05-26", title: "Deal Announced", note: "Broadcom announces VMware acquisition", tag: "announcement" },
      { date: "2022-08-19", title: "Regulatory Filings", note: "Merger documents filed with regulators", tag: "regulatory" },
      { date: "2023-11-22", title: "Transaction Closes", note: "Acquisition completed", tag: "closing" }
    ]
  },
  {
    id: "pfe-sgen",
    acquirer: "Pfizer Inc.",
    target: "Seagen Inc.",
    sector: "Healthcare",
    status: "Completed",
    announced: "2023-03-13",
    value: 43000,
    ev_ebitda: 25.8,
    premium: 32.8,
    rationale: "Acquisition of leading ADC technology platform to enhance oncology portfolio and pipeline.",
    terms: "All-cash transaction at $229.00 per share. Expected to be accretive to earnings by 2030.",
    timeline: [
      { date: "2023-03-13", title: "Deal Announced", note: "Pfizer announces Seagen acquisition", tag: "announcement" },
      { date: "2023-06-28", title: "Shareholder Approval", note: "Seagen shareholders approve transaction", tag: "regulatory" },
      { date: "2023-12-14", title: "Transaction Closes", note: "Acquisition completed", tag: "closing" }
    ]
  },
  {
    id: "cvs-aetna",
    acquirer: "CVS Health Corporation",
    target: "Aetna Inc.",
    sector: "Healthcare",
    status: "Completed",
    announced: "2017-12-03",
    value: 77000,
    ev_ebitda: 16.4,
    premium: 28.2,
    rationale: "Vertical integration to create healthcare ecosystem combining pharmacy, insurance, and care delivery.",
    terms: "Mix of cash ($145/share) and stock ($50.84/share). Break fee of $2.1B.",
    timeline: [
      { date: "2017-12-03", title: "Deal Announced", note: "CVS announces Aetna acquisition", tag: "announcement" },
      { date: "2018-11-28", title: "Transaction Closes", note: "Acquisition completed", tag: "closing" }
    ]
  },
  {
    id: "dis-fox",
    acquirer: "The Walt Disney Company",
    target: "Twenty-First Century Fox Inc.",
    sector: "Communication Services",
    status: "Completed",
    announced: "2017-12-14",
    value: 71300,
    ev_ebitda: 14.8,
    premium: 19.1,
    rationale: "Acquisition of content assets to compete in streaming and direct-to-consumer markets.",
    terms: "All-stock transaction valued at $38/share. Break fee of $2.5B.",
    timeline: [
      { date: "2017-12-14", title: "Deal Announced", note: "Disney announces 21CF acquisition", tag: "announcement" },
      { date: "2019-03-20", title: "Transaction Closes", note: "Acquisition completed after Comcast bidding war", tag: "closing" }
    ]
  }
];

// Mock league tables data
const mockLeagueData: LeagueRow[] = [
  { advisor: "Goldman Sachs", rank: 1, deals: 47, total_value: 145000, avg_size: 3085, sector: "All" },
  { advisor: "Morgan Stanley", rank: 2, deals: 42, total_value: 132000, avg_size: 3143, sector: "All" },
  { advisor: "J.P. Morgan", rank: 3, deals: 39, total_value: 118000, avg_size: 3026, sector: "All" },
  { advisor: "Bank of America", rank: 4, deals: 35, total_value: 98000, avg_size: 2800, sector: "All" },
  { advisor: "Evercore", rank: 5, deals: 28, total_value: 89000, avg_size: 3179, sector: "All" },
  { advisor: "Centerview Partners", rank: 6, deals: 24, total_value: 85000, avg_size: 3542, sector: "All" },
  { advisor: "Credit Suisse", rank: 7, deals: 31, total_value: 76000, avg_size: 2452, sector: "All" },
  { advisor: "Lazard", rank: 8, deals: 29, total_value: 72000, avg_size: 2483, sector: "All" },
  { advisor: "Deutsche Bank", rank: 9, deals: 26, total_value: 65000, avg_size: 2500, sector: "All" },
  { advisor: "Barclays", rank: 10, deals: 23, total_value: 58000, avg_size: 2522, sector: "All" }
];

// API Helper Functions
export async function getComps(params?: { sector?: string; region?: string }): Promise<CompRow[]> {
  const store = useApiStatusStore.getState();
  
  try {
    if (store.usingMocks) throw new Error('Using mocks');
    
    const urlParams = new URLSearchParams();
    if (params?.sector && params.sector !== 'All') urlParams.append('sector', params.sector);
    if (params?.region && params.region !== 'All') urlParams.append('region', params.region);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/comps?${urlParams.toString()}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    
    const data = await response.json();
    return data.items || data;
  } catch (error) {
    console.warn('⚠️ Comps API failed, using mock data:', error);
    
    // Apply client-side filtering to mock data
    let filtered = [...mockCompsData];
    
    if (params?.sector && params.sector !== 'All') {
      filtered = filtered.filter(comp => comp.sector.toLowerCase().includes(params.sector!.toLowerCase()));
    }
    
    if (params?.region && params.region !== 'All') {
      filtered = filtered.filter(comp => comp.region === params.region);
    }
    
    return filtered;
  }
}

export async function getPrecedents(): Promise<PrecedentDeal[]> {
  const store = useApiStatusStore.getState();
  
  try {
    if (store.usingMocks) throw new Error('Using mocks');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/precedents`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    
    const data = await response.json();
    return data.items || data;
  } catch (error) {
    console.warn('⚠️ Precedents API failed, using mock data:', error);
    return mockPrecedentsData;
  }
}

export async function getPrecedentById(id: string): Promise<PrecedentDeal | null> {
  const store = useApiStatusStore.getState();
  
  try {
    if (store.usingMocks) throw new Error('Using mocks');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/precedents/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('⚠️ Precedent detail API failed, using mock data:', error);
    return mockPrecedentsData.find(deal => deal.id === id) || null;
  }
}

export async function getLeagueTables(params?: { period?: string; sector?: string }): Promise<LeagueRow[]> {
  const store = useApiStatusStore.getState();
  
  try {
    if (store.usingMocks) throw new Error('Using mocks');
    
    const urlParams = new URLSearchParams();
    if (params?.period && params.period !== 'All') urlParams.append('period', params.period);
    if (params?.sector && params.sector !== 'All') urlParams.append('sector', params.sector);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/league-tables?${urlParams.toString()}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    
    const data = await response.json();
    return data.advisors || data;
  } catch (error) {
    console.warn('⚠️ League Tables API failed, using mock data:', error);
    
    // Apply basic filtering to mock data
    let filtered = [...mockLeagueData];
    
    if (params?.period === '1Y') {
      // Simulate 1Y filter by reducing deal counts/values
      filtered = filtered.map(row => ({
        ...row,
        deals: Math.round(row.deals * 0.8),
        total_value: Math.round(row.total_value * 0.8)
      }));
    }
    
    return filtered;
  }
}

// Pure client-side DCF utility
export function runDcf(
  baseRevenue: number,
  revGrowth: number[],    // e.g., [15,12,10,8,5]
  ebitdaMargins: number[],// e.g., [25,26,27,27,28]
  taxRatePct: number,     // e.g., 25
  waccPct: number,        // e.g., 10
  ltmGrowthPct: number    // e.g., 2.5
) {
  const wacc = waccPct / 100;
  const ltGrowth = ltmGrowthPct / 100;
  const taxRate = taxRatePct / 100;
  
  const yearly = [];
  let revenue = baseRevenue;
  
  // Project 5 years
  for (let i = 0; i < 5; i++) {
    const year = new Date().getFullYear() + i + 1;
    revenue = revenue * (1 + revGrowth[i] / 100);
    const ebitda = revenue * (ebitdaMargins[i] / 100);
    const ebit = ebitda; // Simplified, assuming D&A negligible
    const tax = ebit * taxRate;
    const nopat = ebit - tax;
    const capex = revenue * 0.04; // Assume 4% of revenue
    const workingCapital = revenue * 0.01; // Assume 1% of revenue
    const fcf = nopat - capex - workingCapital;
    const discountFactor = 1 / Math.pow(1 + wacc, i + 1);
    const pv = fcf * discountFactor;
    
    yearly.push({
      year,
      revenue: Math.round(revenue),
      ebitda: Math.round(ebitda),
      fcf: Math.round(fcf),
      discountFactor: Number(discountFactor.toFixed(4)),
      pv: Math.round(pv)
    });
  }
  
  const sumPvFcf = yearly.reduce((sum, y) => sum + y.pv, 0);
  const finalFcf = yearly[4].fcf;
  const terminalValue = (finalFcf * (1 + ltGrowth)) / (wacc - ltGrowth);
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, 5);
  const ev = sumPvFcf + pvTerminalValue;
  
  return {
    yearly,
    ev: Math.round(ev),
    terminalValue: Math.round(terminalValue),
    pvTerminalValue: Math.round(pvTerminalValue),
    sumPvFcf: Math.round(sumPvFcf),
    // Additional fields for equity value calculation
    equityValue: (sharesOutstanding: number, netCash: number = 0) => Math.round(ev + netCash),
    impliedPrice: (sharesOutstanding: number, netCash: number = 0) => Number(((ev + netCash) / sharesOutstanding).toFixed(2))
  };
}
