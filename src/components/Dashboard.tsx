import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, BarChart3, Activity, 
  Bell, Plus, Zap, RefreshCw, MoreHorizontal,
  User, Target, Shield, Clock, ToggleLeft, ToggleRight, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts, alertsKeys } from '../hooks/useAlerts';
import { useConsolidatedAlerts } from '../hooks/useConsolidatedAlerts';
import { useStableConsolidatedAlerts } from '../hooks/useStableConsolidatedAlerts';
import { useAlertFilters } from '../hooks/useAlertFilters';
import { useWatchlistAlerts } from '../hooks/useWatchlistAlerts';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import { userAlertService } from '../services/userAlertService';
import LoginModal from './LoginModal';
import { interpretAlert, getActionColor, getRiskColor } from '../utils/alertInterpreter';
import ConsolidatedAlertCard from './ConsolidatedAlertCard';
import DashboardHeader from './DashboardHeader';
import StatsCards from './StatsCards';
import Sidebar from './Sidebar';
import TechnicalIndicatorsPanel from './TechnicalIndicatorsPanel';
import SearchAndFilters from './SearchAndFilters';
import AlertHistory from './AlertHistory';
import DisclaimerBanner from './DisclaimerBanner';
import TraderStatsPanel from './TraderStatsPanel';
import AlertLimitBanner from './AlertLimitBanner';
import UpgradeButton from './ui/UpgradeButton';
import type { ConsolidatedAlert } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading: authLoading, logout, alertStats, loadingStats } = useAuth();
  const { hasAccessToHistory, hasAccessToTechnicalAnalysis, canTrackTrades, planName } = useSubscriptionAccess();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const {
    alerts, 
    status, 
    stats, 
    loading, 
    error, 
    refresh, 
    signalRConnected,
    signalRConnecting 
  } = useAlerts();
  const rawConsolidatedAlerts = useConsolidatedAlerts(alerts);
  const consolidatedAlerts = useStableConsolidatedAlerts(rawConsolidatedAlerts);
  
  const [isConsolidatedView, setIsConsolidatedView] = useState(true);
  const [currentView, setCurrentView] = useState<'alerts' | 'history' | 'trades'>('alerts');
  
  // Modal state lifted up to prevent loss during re-renders
  const [openTradeModalAlertId, setOpenTradeModalAlertId] = useState<string | null>(null);
  
  // Expanded state lifted up to preserve user's reading state
  const [expandedAlertIds, setExpandedAlertIds] = useState<Set<string>>(new Set());
  
  // Callback to refresh trades when a new trade is registered
  const [refetchTradesCallback, setRefetchTradesCallback] = useState<(() => void) | null>(null);
  
  // ✅ NO REFRESCAR al cambiar de tabs
  // Las alertas de SignalR se agregan optimísticamente al cache de React Query.
  // El cache ya tiene los datos más recientes (incluyendo alertas en tiempo real).
  // Un refetch() sobrescribiría con solo las alertas del servidor (perdiendo las de SignalR).
  
  // Hook para alertas del watchlist
  const { 
    watchlistAlerts, 
    watchlistSymbols, 
    totalInWatchlist, 
    isLoading: watchlistLoading, 
    error: watchlistError, 
    refetch: refetchWatchlist 
  } = useWatchlistAlerts(50);
  
  // Handlers para watchlist alerts
  const handleToggleStarWatchlist = async (alertId: string) => {
    try {
      await userAlertService.toggleStar(alertId);
      refetchWatchlist();
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };
  
  const handleMarkAsReadWatchlist = async (alertId: string) => {
    try {
      await userAlertService.markAsRead(alertId);
      refetchWatchlist();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };
  
  // Mostrar modal de login si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [authLoading, isAuthenticated]);
  
  // ✅ Invalidar caché de alertas al montar Dashboard si está obsoleto (más de 30 segundos)
  // Esto asegura que al volver del perfil de usuario, las alertas se actualicen
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const alertsState = queryClient.getQueryState(alertsKeys.list());
    
    if (alertsState && alertsState.dataUpdatedAt) {
      const timeSinceLastUpdate = Date.now() - alertsState.dataUpdatedAt;
      const STALE_THRESHOLD = 30 * 1000; // 30 segundos
      
      // Solo invalidar si los datos tienen más de 30 segundos
      if (timeSinceLastUpdate > STALE_THRESHOLD) {
        console.log(`🔄 Dashboard montado: Alertas tienen ${(timeSinceLastUpdate / 1000).toFixed(0)}s - Invalidando caché...`);
        queryClient.invalidateQueries({ queryKey: alertsKeys.list() });
      } else {
        console.log(`✅ Dashboard montado: Alertas frescas (${(timeSinceLastUpdate / 1000).toFixed(0)}s) - No se invalida caché`);
      }
    }
  }, [isAuthenticated, queryClient]);
  
  // Filters for alerts and consolidated alerts
  const alertFilters = useAlertFilters(alerts);
  
  // ⭐ Sort consolidated alerts with watchlist symbols first
  const sortedConsolidatedAlerts = useMemo(() => {
    return [...consolidatedAlerts].sort((a, b) => {
      const aInWatchlist = watchlistSymbols.includes(a.symbol.toUpperCase());
      const bInWatchlist = watchlistSymbols.includes(b.symbol.toUpperCase());
      
      // 1. Watchlist symbols first
      if (aInWatchlist && !bInWatchlist) return -1;
      if (!aInWatchlist && bInWatchlist) return 1;
      
      // 2. Then by priority (1=highest)
      if (a.priority !== b.priority) return a.priority - b.priority;
      
      // 3. Finally by confidence
      return b.confidenceScore - a.confidenceScore;
    });
  }, [consolidatedAlerts, watchlistSymbols]);
  
  const consolidatedFilters = useAlertFilters(sortedConsolidatedAlerts);
  
  // Filtrado memorizado de alertas consolidadas solo para símbolos del watchlist
  const watchlistFilteredRef = useRef<ConsolidatedAlert[]>([]);
  const watchlistFiltered = useMemo(() => {
    if (!watchlistSymbols || watchlistSymbols.length === 0) return [] as ConsolidatedAlert[];
    
    const newFiltered = consolidatedAlerts.filter(alert => 
      watchlistSymbols.includes(alert.symbol.toUpperCase())
    ) as ConsolidatedAlert[];
    
    // ✅ OPTIMIZACIÓN: Si el contenido es idéntico (mismos IDs), reutilizar array anterior
    const oldIds = watchlistFilteredRef.current.map(a => a.id).sort().join('|');
    const newIds = newFiltered.map(a => a.id).sort().join('|');
    
    if (oldIds === newIds) {
      return watchlistFilteredRef.current;  // ✅ Misma referencia = NO re-render
    }
    
    watchlistFilteredRef.current = newFiltered;
    return newFiltered;
  }, [consolidatedAlerts, watchlistSymbols]);

  // Sticky state: conserva la última lista no vacía para evitar parpadeos temporales
  // ✅ FIX TEMPORAL: Deshabilitar sticky state para evitar re-render infinito
  // const [stickyWatchlist, setStickyWatchlist] = useState<ConsolidatedAlert[]>([]);
  // useEffect(() => {
  //   if (watchlistFiltered.length > 0) {
  //     setStickyWatchlist(watchlistFiltered);
  //   } else if (watchlistSymbols.length === 0) {
  //     setStickyWatchlist([]);
  //   }
  // }, [watchlistFiltered, watchlistSymbols.length]);
  const stickyWatchlist = watchlistFiltered; // Usar directamente sin estado
  
  // ✅ IMPORTANTE: Mover hooks ANTES de cualquier early return (Reglas de Hooks de React)
  // Memoizar unreadCount para evitar re-cálculos innecesarios
  const unreadCount = useMemo(() => 
    alerts.filter(a => !a.isRead).length,
    [alerts]
  );
  
  // Early returns DESPUÉS de todos los hooks
  
  // 🐛 DEBUG
  console.log('[Dashboard] authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  // ✅ Verificar autenticación DESPUÉS de todos los hooks
  if (!authLoading && !isAuthenticated) {
    console.log('[Dashboard] Showing login modal');
    return (
      <LoginModal 
        isOpen={true} 
        onClose={() => {}} // No permitir cerrar sin autenticar
      />
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
      }}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
      }}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
              <p className="text-red-200 mb-4">{error}</p>
              <button 
                onClick={refresh}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
    <div className="min-h-screen pb-16" style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
    }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <DashboardHeader 
          isConsolidatedView={isConsolidatedView}
          onToggleView={() => setIsConsolidatedView(!isConsolidatedView)}
          signalRConnected={signalRConnected}
          signalRConnecting={signalRConnecting}
          user={isAuthenticated ? user : null}
          onLogout={logout}
          onAddStock={() => navigate('/profile')}
        />
        
        {/* Alert Limit Banner - Solo mostrar si NO es plan Free */}
        {!loadingStats && alertStats && planName !== 'Free' && (
          <AlertLimitBanner stats={alertStats} />
        )}

        {/* Stats Cards */}
        <StatsCards
          stats={stats}
          status={status}
          unreadCount={unreadCount}
        />

        {/* Navigation Tabs */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setCurrentView('alerts')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentView === 'alerts' 
              ? 'bg-white text-blue-600 shadow-lg' 
              : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🔔 Alertas Activas
          </button>
          <button
            onClick={() => {
              if (!hasAccessToHistory) {
                alert(`El historial de alertas solo está disponible en el plan Premium. Tu plan actual: ${planName}`);
                return;
              }
              setCurrentView('history');
            }}
            disabled={!hasAccessToHistory}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              currentView === 'history' 
                ? 'bg-white text-blue-600 shadow-lg' 
                : hasAccessToHistory
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed'
            }`}
          >
            📊 Historial de Alertas
            {!hasAccessToHistory && (
              <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-xs font-bold rounded-full text-gray-800 shadow-sm">
                🔒 Premium
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (!canTrackTrades) {
                alert(`El registro de trades está disponible desde el plan Pro. Tu plan actual: ${planName}`);
                return;
              }
              setCurrentView('trades');
            }}
            disabled={!canTrackTrades}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              currentView === 'trades' 
                ? 'bg-white text-blue-600 shadow-lg' 
                : canTrackTrades
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed'
            }`}
          >
            📈 Mis Trades
            {!canTrackTrades && (
              <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-xs font-bold rounded-full text-gray-800 shadow-sm">
                🔒 Pro
              </span>
            )}
          </button>
        </div>

        {/* Main Content Grid */}
        {currentView === 'alerts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
                    {isConsolidatedView && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Consolidadas
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">
                      {isConsolidatedView ? consolidatedAlerts.length : alerts.length} 
                      {isConsolidatedView ? ' símbolos' : ' alertas'}
                    </span>
                    <button
                      onClick={refresh}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Refrescar alertas del servidor"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {/* Search and Filters */}
                {isConsolidatedView ? (
                  <SearchAndFilters
                    filters={consolidatedFilters.filters}
                    availableTypes={consolidatedFilters.availableTypes}
                    onUpdateFilter={consolidatedFilters.updateFilter}
                    onResetFilters={consolidatedFilters.resetFilters}
                    hasActiveFilters={consolidatedFilters.hasActiveFilters}
                    filteredCount={consolidatedFilters.filteredCount}
                    totalCount={consolidatedFilters.totalCount}
                  />
                ) : (
                  <SearchAndFilters
                    filters={alertFilters.filters}
                    availableTypes={alertFilters.availableTypes}
                    onUpdateFilter={alertFilters.updateFilter}
                    onResetFilters={alertFilters.resetFilters}
                    hasActiveFilters={alertFilters.hasActiveFilters}
                    filteredCount={alertFilters.filteredCount}
                    totalCount={alertFilters.totalCount}
                  />
                )}
                
                {(isConsolidatedView ? consolidatedFilters.filteredAlerts.length === 0 : alertFilters.filteredAlerts.length === 0) ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isConsolidatedView ? 'No consolidated alerts yet' : 'No alerts yet'}
                    </h3>
                    <p className="text-gray-500">Alerts will appear here when the market is active.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isConsolidatedView ? (
                      // Consolidated Alerts View
                      consolidatedFilters.filteredAlerts.map((consolidatedAlert) => (
                        <ConsolidatedAlertCard 
                          key={consolidatedAlert.id} 
                          alert={consolidatedAlert}
                          isTrackModalOpen={openTradeModalAlertId === consolidatedAlert.id}
                          onOpenTrackModal={() => setOpenTradeModalAlertId(consolidatedAlert.id)}
                          onCloseTrackModal={() => setOpenTradeModalAlertId(null)}
                          isExpanded={expandedAlertIds.has(consolidatedAlert.id)}
                          onToggleExpanded={() => {
                            const newSet = new Set(expandedAlertIds);
                            if (newSet.has(consolidatedAlert.id)) {
                              newSet.delete(consolidatedAlert.id);
                            } else {
                              newSet.add(consolidatedAlert.id);
                            }
                            setExpandedAlertIds(newSet);
                          }}
                          isInWatchlist={watchlistSymbols.includes(consolidatedAlert.symbol.toUpperCase())}
                          onTradeRegistered={() => {
                            if (refetchTradesCallback) {
                              refetchTradesCallback();
                            }
                          }}
                        />
                      ))
                    ) : (
                      // Original Detailed Alerts View
                      alertFilters.filteredAlerts.map((alert) => {
                      const tradingSignal = interpretAlert(alert);
                      
                      return (
                        <div key={alert.id} className="bg-gradient-to-r from-white to-gray-50 p-5 border rounded-xl hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-gray-900">{alert.symbol}</h3>
                              <span className={`px-3 py-1 text-sm font-bold rounded-full ${getActionColor(tradingSignal.action, tradingSignal.strength)}`}>
                                {tradingSignal.action} - {tradingSignal.strength}
                              </span>
                              {!alert.isRead && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Trading Recommendation */}
                          <div className="bg-blue-50 p-4 rounded-lg mb-3">
                            <div className="flex items-start space-x-2">
                              <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Trading Recommendation</h4>
                                <p className="text-blue-800 text-sm">{tradingSignal.reasoning}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Technical Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <Shield className={`w-4 h-4 ${getRiskColor(tradingSignal.riskLevel)}`} />
                              <span className="text-sm font-medium">Risk:</span>
                              <span className={`text-sm font-semibold ${getRiskColor(tradingSignal.riskLevel)}`}>
                                {tradingSignal.riskLevel}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">Timeframe:</span>
                              <span className="text-sm text-gray-700">{tradingSignal.timeframe}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                                alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {alert.priority} priority
                              </span>
                            </div>
                          </div>
                          
                          {/* Technical Basis */}
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tradingSignal.technicalBasis.map((basis, idx) => (
                                <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                  {basis}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* Technical Indicators Panel - Compact (Solo Premium) */}
                          {hasAccessToTechnicalAnalysis && alert.indicators && (
                            <div className="mb-3">
                              <TechnicalIndicatorsPanel 
                                indicators={{
                                  currentPrice: alert.indicators.currentPrice,
                                  rsi: alert.indicators.rsi,
                                  macd: alert.indicators.macd,
                                  bollingerBands: alert.indicators.bollingerBands,
                                  trend: alert.indicators.trend,
                                  volume: alert.indicators.volume,
                                  movingAverages: alert.indicators.movingAverages
                                }}
                                compact
                              />
                            </div>
                          )}
                          {!hasAccessToTechnicalAnalysis && (
                            <div className="mb-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">🔒</span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">Análisis Técnico Avanzado</p>
                                    <p className="text-xs text-gray-600">Disponible solo en plan Premium</p>
                                  </div>
                                </div>
                                <UpgradeButton size="sm" />
                              </div>
                            </div>
                          )}
                          
                          {/* Original Technical Details */}
                          <div className="border-t pt-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-gray-500">Technical Alert:</span>
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{alert.type}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{alert.message}</p>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <Sidebar stats={stats} alerts={alerts} />
        </div>
        ) : currentView === 'history' ? (
          // History View (Solo Premium)
          hasAccessToHistory ? (
            <AlertHistory />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Historial de Alertas - Premium</h2>
              <p className="text-gray-600 mb-6">Esta función está disponible exclusivamente para usuarios Premium.</p>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Con Premium obtienes:</h3>
                <ul className="text-left text-sm text-gray-700 space-y-2">
                  <li>✅ Historial completo de todas las alertas</li>
                  <li>✅ Análisis técnico avanzado con indicadores</li>
                  <li>✅ Estadísticas de rendimiento histórico</li>
                  <li>✅ Filtros avanzados por rendimiento y fecha</li>
                  <li>✅ Exportación de datos en CSV/PDF</li>
                </ul>
              </div>
              <UpgradeButton 
                size="lg"
                text="Actualizar a Premium"
              />
              <p className="text-xs text-gray-500 mt-4">Tu plan actual: {planName}</p>
            </div>
          )
        ) : (
          // Trader Stats View
          <TraderStatsPanel 
            onRefetchReady={(refetch) => {
              setRefetchTradesCallback(() => refetch);
            }}
          />
        )}
      </div>
    </div>
    <DisclaimerBanner />
    </>
  );
}
