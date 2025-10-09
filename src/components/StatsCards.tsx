import React, { memo } from 'react';
import { Bell, Zap, BarChart3, Activity } from 'lucide-react';
import type { AlertStats, DashboardStatus } from '../types';

interface StatsCardsProps {
  stats: AlertStats | null;
  status: DashboardStatus | null;
  unreadCount: number;
}

const StatsCards: React.FC<StatsCardsProps> = memo(({ stats, status, unreadCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <style>{`
        @keyframes smoothPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .stat-number {
          transition: all 0.3s ease-in-out;
        }
        .stat-number.updated {
          animation: smoothPulse 0.5s ease-in-out;
        }
      `}</style>
      {/* Today's Alerts */}
      <div 
        className="p-4 rounded-xl text-white hover:scale-105 transition-transform duration-300"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70 mb-2">Today's Alerts</p>
            <p className="text-4xl font-bold text-white stat-number">{stats?.today || 0}</p>
            <p className="text-xs text-white/50 mt-1">Yesterday: {stats?.yesterday || 0}</p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Bell className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Unread Alerts */}
      <div 
        className="p-4 rounded-xl text-white hover:scale-105 transition-transform duration-300"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70 mb-2">Unread Alerts</p>
            <p className="text-4xl font-bold text-red-400 stat-number">{unreadCount}</p>
            <p className="text-xs text-white/50 mt-1">Need attention</p>
          </div>
          <div className="p-3 bg-red-500/20 rounded-lg">
            <Zap className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>

      {/* Total Alerts */}
      <div 
        className="p-4 rounded-xl text-white hover:scale-105 transition-transform duration-300"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70 mb-2">Total Alerts</p>
            <p className="text-4xl font-bold text-purple-300 stat-number">{stats?.totalStored || 0}</p>
            <p className="text-xs text-white/50 mt-1">All time</p>
          </div>
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Market Status */}
      <div 
        className="p-4 rounded-xl text-white hover:scale-105 transition-transform duration-300"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70 mb-2">Market Status</p>
            <p className="text-4xl font-bold text-green-300">{status?.isMonitoring ? 'Active' : 'Closed'}</p>
            <p className="text-xs text-white/50 mt-1">{status?.isMonitoring ? 'Monitoring' : 'Waiting'}</p>
          </div>
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Activity className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si los stats NO cambiaron (return true = skip render)
  return (
    prevProps.stats?.today === nextProps.stats?.today &&
    prevProps.stats?.yesterday === nextProps.stats?.yesterday &&
    prevProps.stats?.totalStored === nextProps.stats?.totalStored &&
    prevProps.status?.isMonitoring === nextProps.status?.isMonitoring &&
    prevProps.unreadCount === nextProps.unreadCount
  );
});

StatsCards.displayName = 'StatsCards';

export default StatsCards;
