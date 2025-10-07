import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { usePremiumAlerts, type PremiumAlert } from '../hooks/usePremiumAlerts';
import type { ConsolidatedAlert } from '../types';

interface AlertHistoryItem extends ConsolidatedAlert {
  outcome?: 'winner' | 'loser' | 'neutral' | 'pending';
  actualReturn?: number; // % real obtenido
  closedAt?: number; // timestamp de cierre
  daysHeld?: number;
}

interface PerformanceStats {
  totalAlerts: number;
  winners: number;
  losers: number;
  neutral: number;
  pending: number;
  winRate: number;
  avgReturn: number;
  bestAlert: AlertHistoryItem | null;
  worstAlert: AlertHistoryItem | null;
}

// Helper para mapear alertas premium del agente a formato del componente
const mapPremiumAlertToHistoryItem = (alert: PremiumAlert): AlertHistoryItem => {
  // Determinar recommendation basado en el tipo de alerta
  const isBullish = alert.type.includes('Bullish') || alert.type.includes('Oversold');
  const isBearish = alert.type.includes('Bearish') || alert.type.includes('Overbought');
  const recommendation = isBullish ? 'STRONG_BUY' : isBearish ? 'STRONG_SELL' : 'WATCH';
  
  // Calcular scores basados en indicadores técnicos
  const bullishScore = isBullish ? 75 : isBearish ? 20 : 50;
  const bearishScore = isBearish ? 75 : isBullish ? 20 : 50;
  
  const recommendationLevel = alert.priority === 'High' ? 'STRONG' : 'MODERATE';
  
  return {
    id: alert.id,
    symbol: alert.symbol,
    recommendation,
    recommendationLevel,
    confidenceScore: alert.qualityScore, // Quality score calculado por el sistema
    tradingAction: {
      actionText: isBullish ? 'SEÑAL DE COMPRA' : isBearish ? 'SEÑAL DE VENTA' : 'NEUTRAL',
      urgency: alert.priority === 'High' ? 'ALTA' : 'MEDIA',
      timing: 'Generada por el agente',
      entryPrice: alert.currentPrice,
      stopLoss: alert.bollingerLower,
      takeProfit: alert.bollingerUpper,
      positionSize: alert.priority === 'High' ? '3-5%' : '2-3%',
      stepByStepInstructions: []
    },
    outcome: 'pending', // Alertas del agente no tienen outcome aún
    actualReturn: undefined,
    lastUpdate: new Date(alert.timestamp).getTime(),
    closedAt: undefined,
    daysHeld: undefined,
    bullishScore,
    bearishScore,
    neutralScore: 100 - bullishScore - bearishScore,
    bullishSignals: [],
    bearishSignals: [],
    neutralSignals: [],
    primaryReason: alert.message,
    technicalSummary: `RSI: ${alert.rsiValue?.toFixed(2) || 'N/A'}, ADX: ${alert.adxValue?.toFixed(2) || 'N/A'}, Vol: ${alert.volumeMultiplier?.toFixed(2)}x`,
    timeFrame: 'Short Term (1-5 days)',
    alertCount: 1,
    priority: alert.priority === 'High' ? 1 : 2,
    riskLevel: alert.priority === 'High' ? 'MODERATE' : 'LOW',
    technicalIndicatorData: {
      rsi: alert.rsiValue,
      macd: alert.macdValue,
      adx: alert.adxValue,
      volumeRatio: alert.volumeMultiplier
    },
    rawAlerts: []
  };
};

const AlertHistory: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'quality' | 'confidence'>('quality');
  
  // Calcular rango de fechas basado en timeframe (memoizado para evitar loops)
  const { from, to } = useMemo(() => {
    const to = new Date().toISOString();
    const from = new Date();
    switch (timeframe) {
      case 'week':
        from.setDate(from.getDate() - 7);
        break;
      case 'month':
        from.setMonth(from.getMonth() - 1);
        break;
      case 'quarter':
        from.setMonth(from.getMonth() - 3);
        break;
      case 'year':
        from.setFullYear(from.getFullYear() - 1);
        break;
    }
    return { from: from.toISOString(), to };
  }, [timeframe]);
  
  // Obtener alertas premium del agente
  const { alerts: premiumAlerts, loading, error, refresh } = usePremiumAlerts(from, to);
  
  // Mapear alertas premium a formato del componente
  const historyAlerts: AlertHistoryItem[] = premiumAlerts.map(mapPremiumAlertToHistoryItem);

  // Calcular estadísticas locales (para alertas premium del agente)
  const calculateLocalStats = (): PerformanceStats => {
    const highQuality = historyAlerts.filter(a => a.confidenceScore >= 90);
    const mediumQuality = historyAlerts.filter(a => a.confidenceScore >= 80 && a.confidenceScore < 90);
    const lowQuality = historyAlerts.filter(a => a.confidenceScore < 80);
    
    // Promedio de quality score
    const avgQualityScore = historyAlerts.length > 0
      ? historyAlerts.reduce((sum, a) => sum + a.confidenceScore, 0) / historyAlerts.length
      : 0;

    // Mejor y peor alerta por quality score
    const bestAlert = [...historyAlerts].sort((a, b) => 
      b.confidenceScore - a.confidenceScore
    )[0] || null;

    const worstAlert = [...historyAlerts].sort((a, b) => 
      a.confidenceScore - b.confidenceScore
    )[0] || null;

    return {
      totalAlerts: historyAlerts.length,
      winners: highQuality.length, // Reutilizamos para "alta calidad"
      losers: lowQuality.length, // Reutilizamos para "baja calidad"
      neutral: mediumQuality.length, // Calidad media
      pending: 0, // Ya no aplica
      winRate: avgQualityScore, // Reutilizamos para avg quality score
      avgReturn: avgQualityScore,
      bestAlert,
      worstAlert
    };
  };

  const localStats = calculateLocalStats();
  
  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Cargando alertas premium del agente...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-center">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Error al cargar historial</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <button 
              onClick={refresh}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar alertas por prioridad
  const filteredAlerts = historyAlerts.filter(alert => {
    if (filterPriority === 'all') return true;
    if (filterPriority === 'high') return alert.priority === 1;
    if (filterPriority === 'medium') return alert.priority === 2;
    return alert.priority >= 3;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'quality':
        return b.confidenceScore - a.confidenceScore;
      case 'confidence':
        return b.confidenceScore - a.confidenceScore;
      case 'date':
      default:
        return b.lastUpdate - a.lastUpdate;
    }
  });

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'winner': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'loser': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'neutral': return <Minus className="w-5 h-5 text-yellow-600" />;
      default: return <Calendar className="w-5 h-5 text-blue-600" />;
    }
  };

  const getOutcomeBadgeClass = (outcome?: string) => {
    switch (outcome) {
      case 'winner': return 'bg-green-100 text-green-800 border-green-300';
      case 'loser': return 'bg-red-100 text-red-800 border-red-300';
      case 'neutral': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">🎯 Mejores Alertas del Agente</h1>
          <p className="text-white/90 font-medium mt-1">
            Alertas premium generadas automáticamente con alta confianza
          </p>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-5 gap-4">
        
        {/* Total de alertas */}
        <div className="bg-white rounded-xl p-5 border-2 border-slate-200">
          <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-2">
            Total Alertas
          </div>
          <div className="text-3xl font-black text-slate-900">
            {localStats.totalAlerts}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Esta semana
          </div>
        </div>

        {/* Ganadoras */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-700 uppercase tracking-wide font-semibold">
              Ganadoras
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-black text-green-700">
            {localStats.winners}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {localStats.winRate.toFixed(1)}% win rate
          </div>
        </div>

        {/* Perdedoras */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-red-700 uppercase tracking-wide font-semibold">
              Perdedoras
            </div>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700">
            {localStats.losers}
          </div>
          <div className="text-xs text-red-600 mt-1">
            {((localStats.losers / (localStats.totalAlerts - localStats.pending)) * 100).toFixed(1)}% de cerradas
          </div>
        </div>

        {/* Neutrales */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border-2 border-yellow-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-yellow-700 uppercase tracking-wide font-semibold">
              Neutrales
            </div>
            <Minus className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-black text-yellow-700">
            {localStats.neutral}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Break-even aprox
          </div>
        </div>

        {/* Return promedio */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-300">
          <div className="text-sm text-blue-700 uppercase tracking-wide font-semibold mb-2">
            Return Promedio
          </div>
          <div className={`text-3xl font-black ${localStats.avgReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {localStats.avgReturn >= 0 ? '+' : ''}{localStats.avgReturn.toFixed(2)}%
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Por operación
          </div>
        </div>
      </div>

      {/* Mejores y peores alertas */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Mejor alerta */}
        {localStats.bestAlert && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-green-900">🏆 Mejor Alerta de la Semana</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-green-900">{localStats.bestAlert.symbol}</div>
                <div className="text-sm text-green-700">{localStats.bestAlert.tradingAction.actionText}</div>
                <div className="text-xs text-green-600 mt-1">
                  Confianza: {localStats.bestAlert.confidenceScore}% • {localStats.bestAlert.daysHeld} días
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-green-700">
                  +{localStats.bestAlert.actualReturn?.toFixed(2)}%
                </div>
                <div className="text-xs text-green-600">
                  ${((localStats.bestAlert.tradingAction.entryPrice || 0) * 100 * (localStats.bestAlert.actualReturn || 0) / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Peor alerta */}
        {localStats.worstAlert && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-300">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingDown className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-red-900">📉 Lección Aprendida</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-red-900">{localStats.worstAlert.symbol}</div>
                <div className="text-sm text-red-700">{localStats.worstAlert.tradingAction.actionText}</div>
                <div className="text-xs text-red-600 mt-1">
                  Confianza: {localStats.worstAlert.confidenceScore}% • {localStats.worstAlert.daysHeld} días
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-red-700">
                  {localStats.worstAlert.actualReturn?.toFixed(2)}%
                </div>
                <div className="text-xs text-red-600">
                  ${((localStats.worstAlert.tradingAction.entryPrice || 0) * 100 * (localStats.worstAlert.actualReturn || 0) / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          
          {/* Timeframe */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
            </select>
          </div>

          {/* Outcome filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas ({localStats.totalAlerts})</option>
              <option value="winner">Ganadoras ({localStats.winners})</option>
              <option value="loser">Perdedoras ({localStats.losers})</option>
              <option value="neutral">Neutrales ({localStats.neutral})</option>
              <option value="pending">Pendientes ({localStats.pending})</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-600 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Fecha (reciente)</option>
              <option value="return">Return (mayor)</option>
              <option value="confidence">Confianza (mayor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de alertas históricas */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id}
            className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:shadow-lg transition-shadow"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              
              {/* Outcome badge */}
              <div className="col-span-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getOutcomeBadgeClass(alert.outcome)}`}>
                  {getOutcomeIcon(alert.outcome)}
                </div>
              </div>

              {/* Símbolo + Acción */}
              <div className="col-span-3">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-xl font-black text-slate-900">{alert.symbol}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    alert.recommendation.includes('BUY') ? 'bg-green-100 text-green-700' : 
                    alert.recommendation.includes('SELL') ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {alert.recommendation}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{alert.tradingAction.actionText}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {alert.primaryReason}
                </div>
              </div>

              {/* Niveles de precio */}
              <div className="col-span-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-600 font-medium">Entrada</div>
                  <div className="font-bold text-sm text-slate-900">${alert.tradingAction.entryPrice}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 font-medium">Stop</div>
                  <div className="font-bold text-sm text-red-700">${alert.tradingAction.stopLoss}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 font-medium">Target</div>
                  <div className="font-bold text-sm text-green-700">${alert.tradingAction.takeProfit}</div>
                </div>
              </div>

              {/* Return real */}
              <div className="col-span-2 text-center">
                {alert.outcome !== 'pending' ? (
                  <>
                    <div className="text-xs text-slate-600 font-medium mb-1">Return Real</div>
                    <div className={`text-2xl font-black ${
                      (alert.actualReturn || 0) > 0 ? 'text-green-600' : 
                      (alert.actualReturn || 0) < 0 ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {(alert.actualReturn || 0) >= 0 ? '+' : ''}{alert.actualReturn?.toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-500">
                      ${((alert.tradingAction.entryPrice || 0) * 100 * (alert.actualReturn || 0) / 100).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-blue-600 font-semibold">
                    En progreso...
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="col-span-2 text-right">
                <div className="text-xs text-slate-600">
                  Confianza: <span className="font-bold text-slate-900">{alert.confidenceScore}%</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {alert.daysHeld} días • {alert.riskLevel}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatDate(alert.lastUpdate)}
                </div>
              </div>

              {/* Acciones */}
              <div className="col-span-1 text-right">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  Ver detalle →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredAlerts.length === 0 && (
        <div className="bg-white rounded-xl p-12 border-2 border-slate-200 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No hay alertas en este filtro
          </h3>
          <p className="text-slate-600">
            Intenta cambiar el timeframe o el filtro de outcome
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertHistory;

