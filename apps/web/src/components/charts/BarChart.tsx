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

const CustomTooltip = ({ active, payload, label, formatTooltipValue }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => {
          const [formattedValue, formattedName] = formatTooltipValue
            ? formatTooltipValue(entry.value, entry.name || entry.dataKey)
            : [entry.value, entry.name || entry.dataKey]
          
          return (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{formattedName}:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

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
