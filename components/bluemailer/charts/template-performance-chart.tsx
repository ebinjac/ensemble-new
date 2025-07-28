'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TemplatePerformanceChartProps {
  data: Array<{
    id: string;
    name: string;
    usageCount: number;
    openRate: number;
    clickRate: number;
  }>;
}

export function TemplatePerformanceChart({ data }: TemplatePerformanceChartProps) {
  const chartData = data.slice(0, 5).map(template => ({
    name: template.name.length > 15 ? template.name.substring(0, 15) + '...' : template.name,
    usage: template.usageCount,
    openRate: template.openRate,
    clickRate: template.clickRate,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="usage" fill="#3b82f6" name="Usage Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
