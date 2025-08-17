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

// Company detail types
export interface CompanyDetail extends Company {
  beta?: number;
  currency: string;
  updated_at: string;
  business_summary?: string;
  key_risks?: string[];
  competitive_moats?: string[];
}

export interface CompanyKpi {
  label: string;
  value: string | number;
  change?: number;
  change_percent?: number;
  format?: 'currency' | 'number' | 'percentage' | 'ratio';
}

export interface TimeseriesPoint {
  date: string;
  value: number;
}

export interface CompanyTimeseries {
  revenue: TimeseriesPoint[];
  ebitda: TimeseriesPoint[];
  fcf: TimeseriesPoint[];
  margins: {
    date: string;
    gross: number;
    ebitda: number;
    net: number;
  }[];
  multiples: {
    date: string;
    pe: number;
    ev_ebitda: number;
  }[];
}

export interface OwnershipSlice {
  label: string;
  value: number;
  color?: string;
}

export interface CompanyOwnership {
  slices: OwnershipSlice[];
  top_holders?: {
    name: string;
    percentage: number;
    shares: number;
  }[];
  insider_activity?: {
    date: string;
    type: 'buy' | 'sell';
    shares: number;
    value: number;
    person: string;
  }[];
}

export interface CompanyNews extends NewsItem {
  relevance_score?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Deal detail types
export interface DealDetail extends Deal {
  terms: {
    ev: number;
    premium: number;
    payment_mix: {
      cash_percent: number;
      stock_percent: number;
      other_percent?: number;
    };
    consideration?: string;
  };
  timeline: TimelineEntry[];
  parties: {
    acquirer: CompanySummary;
    target: CompanySummary;
    advisors?: {
      financial: string[];
      legal: string[];
    };
  };
  comparables?: {
    sector_multiples: {
      ev_revenue: number;
      ev_ebitda: number;
    };
    recent_deals: {
      acquirer: string;
      target: string;
      value: number;
      ev_revenue: number;
    }[];
  };
  news: NewsItem[];
  filings?: {
    type: string;
    date: string;
    url: string;
    description?: string;
  }[];
  price_impact?: {
    acquirer_change: number;
    target_change: number;
    announcement_date: string;
  };
}

// Analytics event types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}
