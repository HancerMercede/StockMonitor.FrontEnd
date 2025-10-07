import React from 'react';
import type { AlertStats } from '../types';

interface BySymbolProps {
  stats: AlertStats | null;
}

const BySymbol = ({ stats }: BySymbolProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">By Symbol</h3>
      </div>
      <div className="p-4">
        {stats?.bySymbol && Object.keys(stats.bySymbol).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(stats.bySymbol).map(([symbol, count]) => (
              <div key={symbol} className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{symbol}</span>
                <span className="text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No data available</p>
        )}
      </div>
    </div>
  );
};

export default BySymbol;