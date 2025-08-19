'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CustomTooltip } from '../CustomTooltip'

export interface BarChartProps {
  data: any[]
  bars: {
    key: string
    name?: string
    color?: string
    stackId?: string
  }[]
  height?: number
  xAxisKey?: string
  formatTooltipValue?: (value: any, name?: string) => [string, string]
  formatXAxisTick?: (value: any) => string
  formatYAxisTick?: (value: any) => string
  yAxisDomain?: [string | number | 'auto', string | number | 'auto']
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  layout?: 'horizontal' | 'vertical'
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  className?: string
  'aria-label'?: string
}

// Import utility functions from LineChart
import { formatNumber, formatCurrency, formatPercentage } from './LineChart'

const defaultColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
]


export function BarChart({
  data,
  bars,
  height = 300,
  xAxisKey = 'name',
  formatTooltipValue,
  formatXAxisTick,
  formatYAxisTick,
  yAxisDomain,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  layout = 'vertical',
  margin = { top: 5, right: 20, left: 20, bottom: 5 },
  className = '',
  'aria-label': ariaLabel,
}: BarChartProps) {
  return (
    <div 
      className={`w-full ${className}`} 
      role="img" 
      aria-label={ariaLabel || 'Bar chart'}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={data} 
          margin={margin}
          layout={layout}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              className="dark:stroke-gray-600" 
            />
          )}
          <XAxis
            type={layout === 'horizontal' ? 'number' : 'category'}
            dataKey={layout === 'vertical' ? xAxisKey : undefined}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={layout === 'horizontal' ? formatYAxisTick : formatXAxisTick}
            domain={layout === 'horizontal' ? yAxisDomain : undefined}
          />
          <YAxis
            type={layout === 'horizontal' ? 'category' : 'number'}
            dataKey={layout === 'horizontal' ? xAxisKey : undefined}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={layout === 'horizontal' ? formatXAxisTick : formatYAxisTick}
            domain={layout === 'vertical' ? yAxisDomain : undefined}
            width={layout === 'horizontal' ? 100 : undefined}
          />
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip formatTooltipValue={formatTooltipValue} />}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
                color: '#6B7280',
              }}
            />
          )}
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name || bar.key}
              fill={bar.color || defaultColors[index % defaultColors.length]}
              stackId={bar.stackId}
              radius={[2, 2, 2, 2]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Export utility functions for consistency
export { formatNumber, formatCurrency, formatPercentage }
