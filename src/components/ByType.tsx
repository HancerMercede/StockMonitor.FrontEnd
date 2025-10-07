import React from 'react';
import type { AlertStats } from '../types';

interface ByTypeProps {
  stats: AlertStats | null;
}

const ByType = ({ stats }: ByTypeProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">By Type</h3>
      </div>
      <div className="p-4">
        {stats?.byType && Object.keys(stats.byType).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{type.replace('_', ' ')}</span>
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

export default ByType;