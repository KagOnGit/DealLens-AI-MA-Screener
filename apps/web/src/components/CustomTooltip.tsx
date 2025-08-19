import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<any, any> {
  formatTooltipValue?: (value: any, name?: string) => [string, string];
}

export function CustomTooltip({ 
  active, 
  payload, 
  label, 
  formatTooltipValue 
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div 
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-3 py-2 shadow-lg"
      style={{
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}
    >
      {/* Label */}
      {label && (
        <p className="text-white font-medium text-sm mb-1.5">
          {label}
        </p>
      )}
      
      {/* Payload items */}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const [formattedValue, formattedName] = formatTooltipValue
            ? formatTooltipValue(entry.value, entry.name || entry.dataKey)
            : [entry.value, entry.name || entry.dataKey];
          
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/80 font-medium min-w-0">
                {formattedName}:
              </span>
              <span className="text-white font-medium ml-auto">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
