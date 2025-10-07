import React from 'react';
import {
  TrendingUp, BarChart3, Plus, ToggleLeft, ToggleRight, Wifi, WifiOff, Loader2
} from 'lucide-react';
import UserMenu from './UserMenu';

interface DashboardHeaderProps {
  isConsolidatedView: boolean;
  onToggleView: () => void;
  signalRConnected?: boolean;
  signalRConnecting?: boolean;
  user?: { username: string; email: string } | null;
  onLogout?: () => void;
  onAddStock?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isConsolidatedView,
  onToggleView,
  signalRConnected = false,
  signalRConnecting = false,
  user = null,
  onLogout,
  onAddStock
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">AI Stock Monitor</h1>
          </div>
          <p className="text-white/80 text-lg">Advanced technical analysis & automated alerts</p>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2 ml-8">
          <button 
            className="px-6 py-3 rounded-lg flex items-center space-x-2 text-white font-medium"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={onAddStock}
            className="px-6 py-3 rounded-lg flex items-center space-x-2 text-white/60 hover:text-white transition-all"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* SignalR Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            signalRConnected 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : signalRConnecting 
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {signalRConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </>
            ) : signalRConnecting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Fallback</span>
              </>
            )}
          </div>
        </div>
        
        {/* Consolidated View Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/70">Vista:</span>
          <button
            onClick={onToggleView}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
              isConsolidatedView 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {isConsolidatedView ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span className="text-sm font-medium">Consolidada</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Detallada</span>
              </>
            )}
          </button>
        </div>
        
        {/* User Menu */}
        {user && onLogout && (
          <UserMenu user={user} onLogout={onLogout} />
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;