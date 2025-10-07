import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Eye, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserAlert } from '../types';

interface WatchlistAlertsCardProps {
  alerts: UserAlert[];
  watchlistSymbols: string[];
  totalInWatchlist: number;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onToggleStar?: (alertId: string) => void;
  onMarkAsRead?: (alertId: string) => void;
}

const WatchlistAlertsCard: React.FC<WatchlistAlertsCardProps> = ({
  alerts,
  watchlistSymbols,
  totalInWatchlist,
  isLoading,
  error,
  onRefresh,
  onToggleStar,
  onMarkAsRead
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Agrupar alertas por símbolo
  const alertsBySymbol = alerts.reduce((acc, alert) => {
    const symbol = (alert.premiumAlert?.symbol || 'UNKNOWN').toUpperCase();
    if (!acc[symbol]) acc[symbol] = [];
    acc[symbol].push(alert);
    return acc;
  }, {} as Record<string, UserAlert[]>);

  const getSentimentIcon = (message: string) => {
    const msgLower = message.toLowerCase();
    if (msgLower.includes('bullish') || msgLower.includes('buy') || msgLower.includes('oversold')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (msgLower.includes('bearish') || msgLower.includes('sell') || msgLower.includes('overbought')) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Eye className="w-4 h-4 text-yellow-600" />;
  };

  const getSentimentColor = (message: string) => {
    const msgLower = message.toLowerCase();
    if (msgLower.includes('bullish') || msgLower.includes('buy') || msgLower.includes('oversold')) {
      return 'border-green-200 bg-green-50';
    }
    if (msgLower.includes('bearish') || msgLower.includes('sell') || msgLower.includes('overbought')) {
      return 'border-red-200 bg-red-50';
    }
    return 'border-yellow-200 bg-yellow-50';
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const filteredAlerts = selectedSymbol 
    ? alerts.filter(a => (a.premiumAlert?.symbol || '').toUpperCase() === selectedSymbol)
    : alerts;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-slate-600">Cargando alertas del watchlist...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-200">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Error al cargar alertas</h3>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Tu Watchlist
              </h3>
              <p className="text-indigo-100 text-sm">
                {watchlistSymbols.length} símbolos · {totalInWatchlist} alertas activas
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Filtros de símbolos */}
      {watchlistSymbols.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedSymbol(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                selectedSymbol === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({alerts.length})
            </button>
            {watchlistSymbols.map(symbol => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  selectedSymbol === symbol
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {symbol} ({alertsBySymbol[symbol]?.length || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle para expandir/colapsar */}
      <div className="border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <span>{isExpanded ? 'Ocultar alertas' : 'Ver alertas'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Lista de alertas */}
      {isExpanded && (
        <div className="p-6">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                {selectedSymbol 
                  ? `No hay alertas para ${selectedSymbol}`
                  : 'No hay alertas en tu watchlist'}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                {watchlistSymbols.length === 0 
                  ? 'Agrega símbolos a tu watchlist para ver alertas personalizadas'
                  : 'Las alertas aparecerán aquí cuando se detecten señales'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredAlerts.map((alert) => {
                const symbol = alert.premiumAlert?.symbol || 'UNKNOWN';
                const message = alert.premiumAlert?.message || 'Sin mensaje';
                const timestamp = alert.receivedAt;
                const type = alert.premiumAlert?.type || 'General';
                
                return (
                <div
                  key={alert.id}
                  className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                    getSentimentColor(message)
                  } ${alert.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(message)}
                      <span className="font-black text-lg text-slate-900">
                        {symbol}
                      </span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.isStarred && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <button
                        onClick={() => onToggleStar?.(alert.id)}
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                        title={alert.isStarred ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        <Star className={`w-4 h-4 ${alert.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                    {message}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-500">
                        {formatDate(timestamp)}
                      </span>
                      <span className={`px-2 py-1 rounded-full font-semibold ${
                        String(type).toLowerCase().includes('critical') 
                          ? 'bg-red-100 text-red-700'
                          : String(type).toLowerCase().includes('important')
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {String(type)}
                      </span>
                    </div>
                    {!alert.isRead && onMarkAsRead && (
                      <button
                        onClick={() => onMarkAsRead(alert.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {/* Footer con estadísticas */}
      {alerts.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">
                <span className="font-bold text-slate-900">{alerts.filter(a => !a.isRead).length}</span> sin leer
              </span>
              <span className="text-slate-600">
                <span className="font-bold text-slate-900">{alerts.filter(a => a.isStarred).length}</span> favoritas
              </span>
            </div>
            <span className="text-slate-500">
              Última actualización: {formatDate(alerts[0]?.receivedAt || new Date().toISOString())}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistAlertsCard;
