'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CustomTooltip } from '../CustomTooltip'

export interface LineChartProps {
  data: any[]
  lines: {
    key: string
    name?: string
    color?: string
    strokeWidth?: number
    strokeDasharray?: string
  }[]
  height?: number
  width?: number
  xAxisKey?: string
  formatTooltipValue?: (value: any, name?: string) => [string, string]
  formatXAxisTick?: (value: any) => string
  formatYAxisTick?: (value: any) => string
  yAxisDomain?: [string | number | 'auto', string | number | 'auto']
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showAxes?: boolean
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  strokeWidth?: number
  className?: string
  'aria-label'?: string
}

// Utility function to format numbers
export const formatNumber = (value: number, includeK = true): string => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (includeK && value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(0)
}

// Utility function to format currency
export const formatCurrency = (value: number): string => {
  return `$${formatNumber(value)}`
}

// Utility function to format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const defaultColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
]


export function LineChart({
  data,
  lines,
  height = 300,
  width,
  xAxisKey = 'date',
  formatTooltipValue,
  formatXAxisTick,
  formatYAxisTick,
  yAxisDomain,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showAxes = true,
  margin = { top: 5, right: 20, left: 20, bottom: 5 },
  strokeWidth,
  className = '',
  'aria-label': ariaLabel,
}: LineChartProps) {
  return (
    <div 
      className={`${width ? '' : 'w-full'} ${className}`} 
      role="img" 
      aria-label={ariaLabel || 'Line chart'}
      style={width ? { width } : undefined}
    >
      <ResponsiveContainer width={width || '100%'} height={height}>
        <RechartsLineChart data={data} margin={margin}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              className="dark:stroke-gray-600" 
            />
          )}
          {showAxes && (
            <XAxis
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={formatXAxisTick}
            />
          )}
          {showAxes && (
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={formatYAxisTick}
              domain={yAxisDomain}
            />
          )}
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
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name || line.key}
              stroke={line.color || defaultColors[index % defaultColors.length]}
              strokeWidth={line.strokeWidth || strokeWidth || 2}
              strokeDasharray={line.strokeDasharray}
              dot={false}
              activeDot={{ r: 4, fill: line.color || defaultColors[index % defaultColors.length] }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
