'use client';

interface GeographicChartProps {
  data: Array<{
    country: string;
    opens: number;
    clicks: number;
  }>;
}

export function GeographicChart({ data }: GeographicChartProps) {
  const sortedData = [...data].sort((a, b) => b.opens - a.opens).slice(0, 10);
  const maxOpens = Math.max(...sortedData.map(d => d.opens));

  return (
    <div className="space-y-4">
      {sortedData.map((country) => (
        <div key={country.country} className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <span className="font-medium text-sm min-w-[120px]">{country.country}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(country.opens / maxOpens) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm ml-4">
            <span className="text-blue-600 font-medium">{country.opens} opens</span>
            <span className="text-green-600 font-medium">{country.clicks} clicks</span>
          </div>
        </div>
      ))}
    </div>
  );
}
