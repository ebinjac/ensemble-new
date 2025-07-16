import { ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendInfo {
  value: string;
  label: string;
  direction: 'up' | 'down' | 'neutral';
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  valueFormat?: string;
  trend: TrendInfo;
}

export function StatsCard({ title, value, icon, valueFormat, trend }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">
            {value}
            {valueFormat && <span className="ml-1 text-muted-foreground">{valueFormat}</span>}
          </p>
          <p className="mt-2 flex items-center text-sm text-muted-foreground">
            {trend.direction === 'up' && (
              <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
            )}
            {trend.direction === 'down' && (
              <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
            )}
            {trend.direction === 'neutral' && (
              <Minus className="mr-1 h-4 w-4 text-gray-500" />
            )}
            <span className={cn(
              trend.direction === 'up' && 'text-emerald-500',
              trend.direction === 'down' && 'text-red-500'
            )}>
              {trend.value}%
            </span>
            <span className="ml-1">{trend.label}</span>
          </p>
        </div>
      </div>
    </div>
  );
} 