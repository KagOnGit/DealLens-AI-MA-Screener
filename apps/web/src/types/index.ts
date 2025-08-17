// Core entity types
export interface Alert {
  id: string;
  title: string;
  body: string;
  ticker?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read: boolean;
  type?: 'deal' | 'news' | 'market' | 'system';
  related_deal_id?: string;
  related_company_ticker?: string;
}

export interface Deal {
  id: string;
  acquirer: string;
  target: string;
  value: number; // in millions
  status: 'announced' | 'pending' | 'completed' | 'cancelled';
  announced_at: string;
  expected_close?: string;
  premium?: number; // percentage
  payment_type?: 'cash' | 'stock' | 'mixed';
  deal_type?: 'merger' | 'acquisition' | 'lbo' | 'spin_off';
  sector?: string;
  rationale?: string;
  synergies?: string;
  regulatory_status?: string;
  last_updated?: string;
}

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  market_cap: number;
  price: number;
  change: number;
  change_percent: number;
  volume?: number;
  pe_ratio?: number;
  ev_ebitda?: number;
  revenue?: number;
  employees?: number;
  headquarters?: string;
  founded?: number;
  description?: string;
  website?: string;
}

export interface Suggestion {
  type: 'company' | 'deal' | 'ticker';
  id?: string;
  label: string;
  value: string;
  subtitle?: string; // additional context like sector or deal value
  ticker?: string;
}

// API Response types
export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  unread_count: number;
}

export interface DealsResponse {
  deals: Deal[];
  total: number;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  per_page: number;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
}

// UI Component types
export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Rich detail types for alert pages
export interface AlertDetail extends Alert {
  source?: string;
  deal_detail?: DealDetail;
  related_companies?: CompanySummary[];
  timeline?: TimelineEntry[];
  news_items?: NewsItem[];
  key_metrics?: {
    ev_ebitda?: number;
    ev_sales?: number;
    pe_delta?: number;
    synergy_estimate?: number;
  };
}

export interface DealDetail {
  id: string;
  acquirer: string;
  target: string;
  value: number;
  premium?: number;
  payment_mix?: {
    cash_percent?: number;
    stock_percent?: number;
    debt_percent?: number;
  };
  status: string;
  announced_at: string;
  expected_close?: string;
  key_dates?: {
    announcement?: string;
    filing?: string;
    approvals?: string[];
    close?: string;
    termination?: string;
  };
  rationale?: string;
  synergies?: string;
}

export interface CompanySummary {
  ticker: string;
  name: string;
  logo_url?: string;
  sector: string;
  market_cap?: number;
  price?: number;
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description?: string;
  status: 'completed' | 'pending' | 'cancelled';
  type: 'announcement' | 'filing' | 'approval' | 'close' | 'termination';
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  published_at: string;
  url: string;
  summary?: string;
}

// Analytics event types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}
