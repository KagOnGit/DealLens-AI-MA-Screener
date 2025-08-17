'use client';

import { LineChart } from './index';
import { getCompanyPriceHistory } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface CompanySparklineProps {
  ticker: string;
  className?: string;
}

export function CompanySparkline({ ticker, className = '' }: CompanySparklineProps) {
  const { data: priceHistory = [] } = useQuery({
    queryKey: ['company-price-history', ticker],
    queryFn: () => getCompanyPriceHistory(ticker),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!ticker
  });

  if (priceHistory.length === 0) {
    return (
      <div className={`h-7 w-16 bg-gray-100 rounded animate-pulse ${className}`} 
           aria-label="Loading price chart" />
    );
  }

  const data = priceHistory.map(point => ({
    date: point.date,
    value: point.price
  }));

  const isPositive = data.length >= 2 && data[data.length - 1].value > data[0].value;
  const color = isPositive ? '#10B981' : '#EF4444';

  return (
    <div className={`h-7 w-16 ${className}`} aria-label={`${ticker} 30-day price trend`}>
      <LineChart
        data={data}
        lines={[{ key: 'value', name: 'Price', color }]}
        height={28}
        width={64}
        xAxisKey="date"
        showGrid={false}
        showAxes={false}
        showTooltip={false}
        showLegend={false}
        margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        strokeWidth={1.5}
        aria-label={`${ticker} sparkline showing ${isPositive ? 'upward' : 'downward'} trend over 30 days`}
      />
    </div>
  );
}
