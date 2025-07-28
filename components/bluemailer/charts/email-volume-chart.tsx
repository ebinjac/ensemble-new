'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';

interface EmailVolumeChartProps {
  data: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
  }>;
}

export function EmailVolumeChart({ data }: EmailVolumeChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            fontSize={12}
          />
          <YAxis fontSize={12} />
          <Tooltip 
            labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
            formatter={(value, name) => [value, name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="sent" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Sent"
          />
          <Line 
            type="monotone" 
            dataKey="delivered" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Delivered"
          />
          <Line 
            type="monotone" 
            dataKey="failed" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Failed"
          />
          <Line 
            type="monotone" 
            dataKey="opened" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Opened"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
