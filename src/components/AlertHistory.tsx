import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { usePremiumAlerts, type PremiumAlert } from '../hooks/usePremiumAlerts';
import { useHistoryConsolidatedAlerts } from '../hooks/useHistoryConsolidatedAlerts';
import { useStableConsolidatedAlerts } from '../hooks/useStableConsolidatedAlerts';
import type { Alert, ConsolidatedAlert } from '../types';

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

// Helper para convertir PremiumAlert a Alert preservando qualityScore
const mapPremiumAlertToAlert = (premiumAlert: PremiumAlert): Alert => {
  return {
    id: premiumAlert.id,
    symbol: premiumAlert.symbol,
    type: premiumAlert.type,
    message: premiumAlert.message,
    priority: premiumAlert.priority,
    timestamp: premiumAlert.timestamp,
    source: premiumAlert.source,
    isRead: false,
    value: premiumAlert.currentPrice,
    qualityScore: premiumAlert.qualityScore, // ✅ Preservar del backend
    indicators: {
      currentPrice: premiumAlert.currentPrice,
      rsi: premiumAlert.rsiValue,
      macd: premiumAlert.macdValue ? {
        macd: premiumAlert.macdValue,
        signal: premiumAlert.macdSignal,
        histogram: (premiumAlert.macdValue ?? 0) - (premiumAlert.macdSignal ?? 0),
        trend: (premiumAlert.macdValue ?? 0) > (premiumAlert.macdSignal ?? 0) ? 'Bullish' : 'Bearish'
      } : undefined,
      trend: premiumAlert.adxValue ? {
        adx: premiumAlert.adxValue,
        trendStrength: premiumAlert.adxValue > 25 ? 'Strong' : 'Weak',
        trendDirection: premiumAlert.type.includes('Bullish') ? 'Up' : 'Down'
      } : undefined,
      volume: premiumAlert.volumeMultiplier ? {
        relativeVolume: premiumAlert.volumeMultiplier,
        volumeSignal: premiumAlert.volumeMultiplier > 1.5 ? 'High' : 'Normal'
      } : undefined
    }
  };
};

// Mapear ConsolidatedAlert a AlertHistoryItem
const mapConsolidatedToHistoryItem = (alert: ConsolidatedAlert): AlertHistoryItem => {
  let outcome: 'winner' | 'loser' | 'neutral' | 'pending';
  if (alert.confidenceScore >= 80) {
    outcome = 'winner';
  } else if (alert.confidenceScore < 65) {
    outcome = 'loser';
  } else {
    outcome = 'neutral';
  }
  
  return {
    ...alert,
    outcome,
    actualReturn: undefined,
    closedAt: undefined,
    daysHeld: undefined
  };
};

// Mapear PremiumAlert del backend directamente a AlertHistoryItem
const mapPremiumAlertToHistoryItem_OLD = (alert: PremiumAlert): AlertHistoryItem => {
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
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'winner' | 'loser' | 'neutral' | 'pending'>('all');
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
  
  // Convertir a formato Alert preservando qualityScore
  const alertsForConsolidation = useMemo(
    () => premiumAlerts.map(mapPremiumAlertToAlert),
    [premiumAlerts]
  );
  
  // Consolidar usando hook especializado que usa qualityScore del backend
  const rawConsolidatedAlerts = useHistoryConsolidatedAlerts(alertsForConsolidation);
  const consolidatedAlerts = useStableConsolidatedAlerts(rawConsolidatedAlerts);
  
  // Mapear a formato con outcome
  const historyAlerts: AlertHistoryItem[] = useMemo(
    () => consolidatedAlerts.map(mapConsolidatedToHistoryItem),
    [consolidatedAlerts]
  );

  // Calcular estadísticas locales  
  const localStats = useMemo((): PerformanceStats => {
    // Clasificar por nivel de confianza (no por resultado real)
    const highConfidence = historyAlerts.filter(a => a.confidenceScore >= 80);
    const mediumConfidence = historyAlerts.filter(a => a.confidenceScore >= 65 && a.confidenceScore < 80);
    const lowConfidence = historyAlerts.filter(a => a.confidenceScore < 65);
    
    // Promedio de confianza
    const avgConfidence = historyAlerts.length > 0
      ? historyAlerts.reduce((sum, a) => sum + a.confidenceScore, 0) / historyAlerts.length
      : 0;

    // Mejor y peor alerta por confidence score
    const bestAlert = [...historyAlerts].sort((a, b) => 
      b.confidenceScore - a.confidenceScore
    )[0] || null;

    const worstAlert = [...historyAlerts].sort((a, b) => 
      a.confidenceScore - b.confidenceScore
    )[0] || null;

    return {
      totalAlerts: historyAlerts.length,
      winners: highConfidence.length,    // Reusado como "Alta Confianza"
      losers: lowConfidence.length,       // Reusado como "Baja Confianza"
      neutral: mediumConfidence.length,   // Reusado como "Confianza Media"
      pending: 0,                         // Sin uso por ahora
      winRate: avgConfidence,             // Promedio de confianza
      avgReturn: avgConfidence,           // Mismo valor
      bestAlert,
      worstAlert
    };
  }, [historyAlerts]);
  
  // Filtrar alertas por prioridad y outcome (DEBE estar ANTES de los if statements)
  const filteredAlerts = useMemo(() => {
    let filtered = [...historyAlerts];
    
    // Aplicar filtro de outcome
    if (filterOutcome !== 'all') {
      filtered = filtered.filter(alert => alert.outcome === filterOutcome);
    }
    
    // Aplicar filtro de prioridad
    if (filterPriority !== 'all') {
      if (filterPriority === 'high') {
        filtered = filtered.filter(alert => alert.priority === 1);
      } else if (filterPriority === 'medium') {
        filtered = filtered.filter(alert => alert.priority === 2);
      } else if (filterPriority === 'low') {
        filtered = filtered.filter(alert => alert.priority >= 3);
      }
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'quality':
        case 'confidence':
          return b.confidenceScore - a.confidenceScore;
        case 'date':
        default:
          return b.lastUpdate - a.lastUpdate;
      }
    });
    
    return filtered;
  }, [historyAlerts, filterPriority, filterOutcome, sortBy]);
  
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

  // Icono basado en la RECOMENDACIÓN (no en outcome)
  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('BUY')) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (recommendation.includes('SELL')) {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    } else {
      return <Minus className="w-5 h-5 text-yellow-600" />;
    }
  };

  // Badge basado en la RECOMENDACIÓN (no en outcome)
  const getRecommendationBadgeClass = (recommendation: string) => {
    if (recommendation.includes('BUY')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (recommendation.includes('SELL')) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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

        {/* Alta Confianza */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-700 uppercase tracking-wide font-semibold">
              Alta Confianza
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-black text-green-700">
            {localStats.winners}
          </div>
          <div className="text-xs text-green-600 mt-1">
            ≥80% de confianza
          </div>
        </div>

        {/* Baja Confianza */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-orange-700 uppercase tracking-wide font-semibold">
              Baja Confianza
            </div>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-black text-orange-700">
            {localStats.losers}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            &lt;65% de confianza
          </div>
        </div>

        {/* Confianza Media */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-blue-700 uppercase tracking-wide font-semibold">
              Confianza Media
            </div>
            <Minus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700">
            {localStats.neutral}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            65-80% de confianza
          </div>
        </div>

        {/* Confianza Promedio */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-300">
          <div className="text-sm text-purple-700 uppercase tracking-wide font-semibold mb-2">
            Confianza Promedio
          </div>
          <div className="text-3xl font-black text-purple-700">
            {localStats.avgReturn.toFixed(1)}%
          </div>
          <div className="text-xs text-purple-600 mt-1">
            De todas las alertas
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
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas ({localStats.totalAlerts})</option>
              <option value="winner">Alta Confianza ({localStats.winners})</option>
              <option value="loser">Baja Confianza ({localStats.losers})</option>
              <option value="neutral">Confianza Media ({localStats.neutral})</option>
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
              
              {/* Recommendation badge */}
              <div className="col-span-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRecommendationBadgeClass(alert.recommendation)}`}>
                  {getRecommendationIcon(alert.recommendation)}
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
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-xs text-slate-600">Confianza:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    alert.confidenceScore >= 80 ? 'bg-green-100 text-green-700' :
                    alert.confidenceScore >= 65 ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {alert.confidenceScore}%
                    {alert.confidenceScore >= 80 ? ' ✓' : alert.confidenceScore < 65 ? ' ⚠' : ''}
                  </span>
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

