'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ActivityData } from '@/app/actions/admin';
import { useTheme } from 'next-themes';

interface ActivityChartProps {
  data: ActivityData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Date
                      </span>
                      <span className="font-bold text-foreground">
                        {new Date(payload[0].payload.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Requests
                      </span>
                      <span className="font-bold text-foreground">
                        {payload[0].value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorCount)"
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 