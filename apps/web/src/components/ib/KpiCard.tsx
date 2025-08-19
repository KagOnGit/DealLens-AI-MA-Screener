import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  change?: number;
  changeLabel?: string;
  className?: string;
  valueClassName?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  hint,
  change,
  changeLabel,
  className,
  valueClassName
}: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000000) {
        return `$${(val / 1000000000).toFixed(1)}B`;
      } else if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const changeColor = change !== undefined 
    ? change >= 0 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400"
    : "";

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className={cn("text-2xl font-bold", valueClassName)}>
          {formatValue(value)}
        </div>
        {(hint || change !== undefined) && (
          <div className="flex items-center justify-between">
            {hint && (
              <p className="text-xs text-muted-foreground truncate flex-1">
                {hint}
              </p>
            )}
            {change !== undefined && (
              <p className={cn("text-xs font-medium ml-2", changeColor)}>
                {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                {changeLabel && ` ${changeLabel}`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
