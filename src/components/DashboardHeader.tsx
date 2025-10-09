import React from 'react';
import {
  TrendingUp, BarChart3, Plus, ToggleLeft, ToggleRight, Wifi, WifiOff, Loader2
} from 'lucide-react';
import UserMenu from './UserMenu';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

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
  const { isPro, isPremium, isFree } = useSubscriptionAccess();
  const canUseDetailedView = isPro || isPremium; // Pro y Premium pueden usar vista detallada
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-6">
        <div>
          <div className="flex items-center space-x-4">
            <img 
              src="/images/StockMonitorAgentLogo.jpeg" 
              alt="Stock Monitor Logo" 
              className="w-16 h-16 object-contain rounded-full"
            />
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight">IA Stock Monitor</h1>
              <p className="text-white/70 text-sm mt-1">Advanced technical analysis & automated alerts</p>
            </div>
          </div>
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
          
          {canUseDetailedView ? (
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
                  <span className="text-sm font-medium">👁️ Detallada</span>
                </>
              )}
            </button>
          ) : (
            <div className="relative group">
              <button className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/10 cursor-not-allowed opacity-75 border border-white/20">
                <div className="flex items-center space-x-2">
                  <ToggleRight className="w-4 h-4 text-white/50" />
                  <span className="text-sm font-medium text-white/60">Consolidada</span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-green-400 text-xs">🔒</span>
                  <span className="text-xs font-semibold text-green-300">Pro</span>
                </div>
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-xl border border-gray-700">
                  <div className="font-semibold mb-1">👁️ Vista Detallada</div>
                  <div>Disponible desde plan Pro</div>
                </div>
              </div>
            </div>
          )}
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