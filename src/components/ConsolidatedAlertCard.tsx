import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Eye, AlertTriangle, Shield, Clock, ClipboardCheck } from 'lucide-react';
import type { ConsolidatedAlert, ConsolidatedRecommendation, RiskLevel, StepInstruction } from '../types';
import TechnicalIndicatorsPanel from './TechnicalIndicatorsPanel';
import TradeTrackingModal from './TradeTrackingModal';

interface ConsolidatedAlertCardProps {
  alert: ConsolidatedAlert;
  onToggleRead?: (alertId: string) => void;
  isTrackModalOpen: boolean;
  onOpenTrackModal: () => void;
  onCloseTrackModal: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isInWatchlist?: boolean;
  onTradeRegistered?: () => void;
}

const ConsolidatedAlertCard: React.FC<ConsolidatedAlertCardProps> = memo(({ 
  alert, 
  onToggleRead,
  isTrackModalOpen,
  onOpenTrackModal,
  onCloseTrackModal,
  isExpanded,
  onToggleExpanded,
  isInWatchlist = false,
  onTradeRegistered
}) => {
  const getRecommendationConfig = (recommendation: ConsolidatedRecommendation) => {
    const configs = {
      'STRONG_BUY': { 
        color: 'bg-green-600 text-white', 
        icon: TrendingUp, 
        text: 'COMPRA FUERTE',
        gradient: 'from-green-500 to-green-600'
      },
      'BUY': { 
        color: 'bg-green-500 text-white', 
        icon: TrendingUp, 
        text: 'COMPRA',
        gradient: 'from-green-400 to-green-500'
      },
      'WEAK_BUY': { 
        color: 'bg-green-400 text-white', 
        icon: TrendingUp, 
        text: 'COMPRA DÉBIL',
        gradient: 'from-green-300 to-green-400'
      },
      'WATCH': { 
        color: 'bg-yellow-500 text-white', 
        icon: Eye, 
        text: 'OBSERVAR',
        gradient: 'from-yellow-400 to-yellow-500'
      },
      'WEAK_SELL': { 
        color: 'bg-red-400 text-white', 
        icon: TrendingDown, 
        text: 'VENTA DÉBIL',
        gradient: 'from-red-300 to-red-400'
      },
      'SELL': { 
        color: 'bg-red-500 text-white', 
        icon: TrendingDown, 
        text: 'VENTA',
        gradient: 'from-red-400 to-red-500'
      },
      'STRONG_SELL': { 
        color: 'bg-red-600 text-white', 
        icon: TrendingDown, 
        text: 'VENTA FUERTE',
        gradient: 'from-red-500 to-red-600'
      }
    };
    return configs[recommendation];
  };

  const getRiskConfig = (risk: RiskLevel) => {
    const configs = {
      'LOW': { color: 'text-green-600', bgColor: 'bg-green-100', icon: Shield },
      'MODERATE': { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle },
      'HIGH': { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle },
      'EXTREME': { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle }
    };
    return configs[risk];
  };

  const getPriorityIcon = (priority: 1 | 2 | 3): string => {
    const icons = { 1: '🔥', 2: '⚡', 3: '📊' };
    return icons[priority];
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUrgencyBackground = (urgency: string): string => {
    switch (urgency) {
      case 'INMEDIATA': return 'from-red-50 via-rose-50 to-pink-50';
      case 'ALTA': return 'from-orange-50 via-amber-50 to-yellow-50';
      case 'MEDIA': return 'from-yellow-50 via-lime-50 to-green-50';
      default: return 'from-blue-50 via-indigo-50 to-purple-50';
    }
  };

  const getUrgencyBorder = (urgency: string): string => {
    switch (urgency) {
      case 'INMEDIATA': return 'border-red-300';
      case 'ALTA': return 'border-orange-300';
      case 'MEDIA': return 'border-yellow-300';
      default: return 'border-blue-300';
    }
  };

  const getUrgencyTextColor = (urgency: string): string => {
    switch (urgency) {
      case 'INMEDIATA': return 'text-red-800';
      case 'ALTA': return 'text-orange-800';
      case 'MEDIA': return 'text-yellow-800';
      default: return 'text-blue-800';
    }
  };

  const getUrgencyIndicator = (urgency: string): string => {
    switch (urgency) {
      case 'INMEDIATA': return 'bg-gradient-to-br from-red-500 to-rose-600';
      case 'ALTA': return 'bg-gradient-to-br from-orange-500 to-amber-600';
      case 'MEDIA': return 'bg-gradient-to-br from-yellow-500 to-lime-600';
      default: return 'bg-gradient-to-br from-blue-500 to-indigo-600';
    }
  };

  const getActionTextColor = (recommendation: string): string => {
    if (recommendation.includes('BUY')) return 'text-green-700';
    if (recommendation.includes('SELL')) return 'text-red-700';
    return 'text-gray-700';
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const renderQuickIndicators = (alert: ConsolidatedAlert) => {
    const indicators = [];
    const rawAlerts = alert.rawAlerts || [];
    
    // RSI - Extraer del mensaje: "RSI Oversold at 25.43" o "RSI Overbought at 78.91"
    const rsiAlert = rawAlerts.find(a => a && a.message && a.message.includes('RSI'));
    if (rsiAlert) {
      const rsiMatch = rsiAlert.message.match(/RSI (?:Oversold|Overbought) at ([0-9]+\.?[0-9]*)/i);
      const rsiValue = rsiMatch ? parseFloat(rsiMatch[1]) : null;
      const isOverbought = rsiAlert.message.includes('Overbought');
      const isOversold = rsiAlert.message.includes('Oversold');
      
      indicators.push(
        <div key="rsi" className={`p-3 rounded-xl border-2 ${
          isOverbought ? 'bg-red-50 border-red-200' :
          isOversold ? 'bg-green-50 border-green-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-600">RSI</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isOverbought ? 'bg-red-500 text-white' :
              isOversold ? 'bg-green-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {isOverbought ? 'VENDE' : isOversold ? 'COMPRA' : 'NEUTRO'}
            </span>
          </div>
          <div className={`text-lg font-black ${
            isOverbought ? 'text-red-700' :
            isOversold ? 'text-green-700' :
            'text-gray-700'
          }`}>
            {rsiValue ? `${Math.round(rsiValue)}%` : (isOverbought ? '75%+' : isOversold ? '25%-' : '50%')}
          </div>
          <div className="text-xs text-gray-600">
            {isOverbought ? 'Sobrecompra' : isOversold ? 'Sobreventa' : 'Normal'}
          </div>
        </div>
      );
    }
    
    // MACD - Extraer del mensaje: "MACD Bullish Signal - MACD: 3.0253"
    const macdAlert = rawAlerts.find(a => a && a.message && a.message.includes('MACD'));
    if (macdAlert) {
      const macdMatch = macdAlert.message.match(/MACD: ([0-9]+\.?[0-9]*)/i);
      const macdValue = macdMatch ? parseFloat(macdMatch[1]) : null;
      const isBullish = macdAlert.message.includes('Bullish');
      const isBearish = macdAlert.message.includes('Bearish');
      
      indicators.push(
        <div key="macd" className={`p-3 rounded-xl border-2 ${
          isBullish ? 'bg-green-50 border-green-200' :
          isBearish ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-600">MACD</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isBullish ? 'bg-green-500 text-white' :
              isBearish ? 'bg-red-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {isBullish ? 'COMPRA' : isBearish ? 'VENDE' : 'NEUTRO'}
            </span>
          </div>
          <div className={`text-sm font-bold ${
            isBullish ? 'text-green-700' :
            isBearish ? 'text-red-700' :
            'text-gray-700'
          }`}>
            {macdValue ? `${macdValue.toFixed(2)}` : (isBullish ? 'Alcista' : 'Bajista')}
          </div>
          <div className="text-xs text-gray-600">
            {isBullish ? 'Momentum +' : isBearish ? 'Momentum -' : 'Sin señal'}
          </div>
        </div>
      );
    }
    
    // Bollinger Bands - Buscar en alertas originales del backend
    const bbAlert = rawAlerts.find(a => a && typeof a.type === 'string' && a.type.includes('Bollinger'));
    if (bbAlert) {
      const isUpper = bbAlert.type.includes('Upper');
      const isLower = bbAlert.type.includes('Lower');
      const bbValue = bbAlert.value;
      
      indicators.push(
        <div key="bb" className={`p-3 rounded-xl border-2 ${
          isUpper ? 'bg-red-50 border-red-200' :
          isLower ? 'bg-green-50 border-green-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-600">BB</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isUpper ? 'bg-red-500 text-white' :
              isLower ? 'bg-green-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {isUpper ? 'VENDE' : isLower ? 'COMPRA' : 'NEUTRO'}
            </span>
          </div>
          <div className={`text-sm font-bold ${
            isUpper ? 'text-red-700' :
            isLower ? 'text-green-700' :
            'text-gray-700'
          }`}>
            {bbValue ? `$${bbValue.toFixed(2)}` : (isUpper ? 'Superior' : isLower ? 'Inferior' : 'Centro')}
          </div>
          <div className="text-xs text-gray-600">
            {isUpper ? 'Resistencia' : isLower ? 'Soporte' : 'Rango'}
          </div>
        </div>
      );
    }
    
    // Volume - Extraer del mensaje: "High Volume Activity - RVOL: 2.35"
    const volumeAlert = rawAlerts.find(a => a && a.message && a.message.includes('Volume'));
    if (volumeAlert) {
      const rvolMatch = volumeAlert.message.match(/RVOL: ([0-9]+\.?[0-9]*)/i);
      const rvolValue = rvolMatch ? parseFloat(rvolMatch[1]) : null;
      const isSpike = volumeAlert.message.includes('High Volume');
      
      indicators.push(
        <div key="volume" className={`p-3 rounded-xl border-2 ${
          isSpike ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-600">VOL</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isSpike ? 'bg-orange-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {isSpike ? 'ALTO' : 'NORMAL'}
            </span>
          </div>
          <div className={`text-sm font-bold ${
            isSpike ? 'text-orange-700' : 'text-gray-700'
          }`}>
            {rvolValue ? `${rvolValue.toFixed(1)}x` : (isSpike ? '2.5x' : '1x')}
          </div>
          <div className="text-xs text-gray-600">
            {isSpike ? 'Interés fuerte' : 'Actividad normal'}
          </div>
        </div>
      );
    }
    
    // ADX (Trend Strength) - Extraer del mensaje: "Strong Uptrend NVDA: ADX 27.76"
    const adxAlert = rawAlerts.find(a => a && a.message && a.message.includes('ADX'));
    if (adxAlert) {
      const adxMatch = adxAlert.message.match(/ADX ([0-9]+\.?[0-9]*)/i);
      const adxValue = adxMatch ? parseFloat(adxMatch[1]) : null;
      const isStrong = adxValue && adxValue > 25;
      const isUptrend = adxAlert.message.includes('Uptrend');
      
      indicators.push(
        <div key="adx" className={`p-3 rounded-xl border-2 ${
          isStrong ? (isUptrend ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-600">ADX</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isStrong ? (isUptrend ? 'bg-green-500 text-white' : 'bg-red-500 text-white') :
              'bg-gray-500 text-white'
            }`}>
              {isStrong ? (isUptrend ? 'FUERTE+' : 'FUERTE-') : 'DÉBIL'}
            </span>
          </div>
          <div className={`text-sm font-bold ${
            isStrong ? (isUptrend ? 'text-green-700' : 'text-red-700') :
            'text-gray-700'
          }`}>
            {adxValue ? `${adxValue.toFixed(1)}` : '20'}
          </div>
          <div className="text-xs text-gray-600">
            {isStrong ? 'Tendencia fuerte' : 'Sin tendencia'}
          </div>
        </div>
      );
    }
    
    // Si no hay suficientes indicadores, agregar información útil
    const allSignals = [...alert.bullishSignals, ...alert.bearishSignals, ...alert.neutralSignals];
    while (indicators.length < 4) {
      const index = indicators.length;
      const info = [
        { name: 'CONF', value: `${alert.confidenceScore}%`, desc: 'Confianza', color: alert.confidenceScore >= 70 ? 'green' : alert.confidenceScore >= 50 ? 'yellow' : 'red' },
        { name: 'RIESGO', value: alert.riskLevel, desc: 'Nivel', color: alert.riskLevel === 'LOW' ? 'green' : alert.riskLevel === 'HIGH' ? 'red' : 'yellow' },
        { name: 'SEÑALES', value: `${allSignals.length}`, desc: 'Activas', color: allSignals.length >= 3 ? 'green' : 'gray' },
        { name: 'TIEMPO', value: alert.timeFrame.split(' ')[0], desc: 'Horizonte', color: 'blue' }
      ][index];
      
      if (info) {
        indicators.push(
          <div key={`info-${index}`} className={`p-3 rounded-xl border-2 ${
            info.color === 'green' ? 'bg-green-50 border-green-200' :
            info.color === 'red' ? 'bg-red-50 border-red-200' :
            info.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
            info.color === 'blue' ? 'bg-blue-50 border-blue-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-xs font-bold text-gray-600 mb-1">{info.name}</div>
            <div className={`text-sm font-bold ${
              info.color === 'green' ? 'text-green-700' :
              info.color === 'red' ? 'text-red-700' :
              info.color === 'yellow' ? 'text-yellow-700' :
              info.color === 'blue' ? 'text-blue-700' :
              'text-gray-700'
            }`}>
              {info.value}
            </div>
            <div className="text-xs text-gray-600">
              {info.desc}
            </div>
          </div>
        );
      } else {
        break;
      }
    }
    
    return indicators.slice(0, 4);
  };

  const recommendationConfig = getRecommendationConfig(alert.recommendation);
  const riskConfig = getRiskConfig(alert.riskLevel);
  const RecommendationIcon = recommendationConfig.icon;
  const RiskIcon = riskConfig.icon;

  // Extraer precio actual
  const currentPrice = alert.tradingAction.entryPrice || 
                      alert.rawAlerts[0]?.indicators?.currentPrice || 
                      null;

  // Calcular Risk/Reward Ratio
  const calculateRiskReward = () => {
    if (!alert.tradingAction.entryPrice || 
        !alert.tradingAction.stopLoss || 
        !alert.tradingAction.takeProfit) {
      return null;
    }
    
    const entry = alert.tradingAction.entryPrice;
    const stop = alert.tradingAction.stopLoss;
    const target = alert.tradingAction.takeProfit;
    
    const isBuy = alert.recommendation.includes('BUY');
    
    const risk = isBuy ? 
      entry - stop :  // Para compra
      stop - entry;   // Para venta
      
    const reward = isBuy ? 
      target - entry : // Para compra
      entry - target;  // Para venta
    
    const riskPercent = (risk / entry) * 100;
    const rewardPercent = (reward / entry) * 100;
    const ratio = risk > 0 ? reward / risk : 0;
    
    return {
      risk,
      reward,
      riskPercent,
      rewardPercent,
      ratio
    };
  };

  const riskReward = calculateRiskReward();
  
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 overflow-hidden">
      {/* Header compacto con precio */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-3xl w-8" title={isInWatchlist ? "En tu watchlist" : ""}>
              {isInWatchlist ? '⭐' : ''}
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{alert.symbol}</h3>
            {currentPrice && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">${currentPrice.toFixed(2)}</span>
                <span className="text-sm text-slate-500">•</span>
              </div>
            )}
            <span className="text-xl">{getPriorityIcon(alert.priority)}</span>
            {alert.priority === 1 && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {formatTimestamp(alert.lastUpdate)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">

        {/* TRADING ACTION COMPACTA */}
        <div className="mb-5">
          <div className="relative overflow-hidden rounded-xl shadow-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
            
            {/* Header: Urgencia + Confianza */}
            <div className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm border-b border-blue-200">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getUrgencyIndicator(alert.tradingAction.urgency)}`}></div>
                <span className="text-sm font-bold text-red-700">{alert.tradingAction.urgency}</span>
                <span className="text-xs text-slate-600">• {alert.tradingAction.timing}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Confianza: </span>
                <span className={`text-lg font-black ${getConfidenceColor(alert.confidenceScore)}`}>
                  {alert.confidenceScore}%
                </span>
              </div>
            </div>
            
            {/* Acción principal */}
            <div className="text-center py-4 px-3">
              <div className={`text-2xl font-black ${getActionTextColor(alert.recommendation)} mb-1`}>
                {alert.tradingAction.actionText}
              </div>
              <div className="text-sm text-slate-600">
                {alert.primaryReason}
              </div>
            </div>
            
            {/* Precios en 1 línea */}
            <div className="px-3 pb-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {alert.tradingAction.entryPrice && (
                  <div className="bg-white/60 rounded-lg p-2">
                    <div className="text-xs text-blue-600 font-semibold">Entrada</div>
                    <div className="text-lg font-black text-blue-700">
                      ${alert.tradingAction.entryPrice.toFixed(2)}
                    </div>
                  </div>
                )}
                {alert.tradingAction.stopLoss && riskReward && (
                  <div className="bg-white/60 rounded-lg p-2">
                    <div className="text-xs text-red-600 font-semibold">Stop Loss</div>
                    <div className="text-lg font-black text-red-700">
                      ${alert.tradingAction.stopLoss.toFixed(2)}
                    </div>
                    <div className="text-xs text-red-600">
                      {riskReward.riskPercent.toFixed(1)}% | -${riskReward.risk.toFixed(2)}
                    </div>
                  </div>
                )}
                {alert.tradingAction.takeProfit && riskReward && (
                  <div className="bg-white/60 rounded-lg p-2">
                    <div className="text-xs text-green-600 font-semibold">Target</div>
                    <div className="text-lg font-black text-green-700">
                      ${alert.tradingAction.takeProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600">
                      +{riskReward.rewardPercent.toFixed(1)}% | +${riskReward.reward.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Risk/Reward + Metadata en 1 línea */}
            <div className="px-3 pb-3">
              <div className="bg-white/80 rounded-lg p-2 flex items-center justify-between text-xs">
                {riskReward && (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-600">⚖️ R/R:</span>
                    <span className={`font-black ${
                      riskReward.ratio >= 2 ? 'text-green-600' : 
                      riskReward.ratio >= 1.5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      1:{riskReward.ratio.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-slate-600">📊 {alert.tradingAction.positionSize}</span>
                  <span className="text-slate-600">⏱️ {alert.timeFrame.split(' ')[0]} {alert.timeFrame.split(' ')[1]}</span>
                  <span className={`font-semibold ${
                    alert.riskLevel === 'LOW' ? 'text-green-600' :
                    alert.riskLevel === 'MODERATE' ? 'text-yellow-600' :
                    alert.riskLevel === 'HIGH' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {alert.riskLevel}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* PLAN RÁPIDO COMPACTO */}
        <div className="mb-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
          <div className="font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <span>✅</span>
            <span>PLAN RÁPIDO:</span>
          </div>
          
          <div className="space-y-2 text-sm">
            {alert.tradingAction.entryPrice && (
              <div className="flex items-start space-x-2">
                <span className="font-bold text-purple-600">1.</span>
                <span className="text-slate-700">
                  {alert.recommendation.includes('BUY') ? 'Compra' : 'Vende'} a 
                  ${alert.tradingAction.entryPrice.toFixed(2)}
                  {currentPrice && Math.abs(currentPrice - alert.tradingAction.entryPrice) > 0.5 && (
                    <span className="text-xs text-slate-500">
                      {' '}(espera {currentPrice > alert.tradingAction.entryPrice ? 'baja' : 'suba'}{' '}
                      {Math.abs(((currentPrice - alert.tradingAction.entryPrice) / currentPrice) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {alert.tradingAction.stopLoss && riskReward && (
              <div className="flex items-start space-x-2">
                <span className="font-bold text-purple-600">2.</span>
                <span className="text-slate-700">
                  Stop loss en ${alert.tradingAction.stopLoss.toFixed(2)} = 
                  <span className="font-semibold text-red-600">
                    {' '}máximo riesgo ${riskReward.risk.toFixed(2)}/acción
                  </span>
                </span>
              </div>
            )}
            
            {alert.tradingAction.takeProfit && riskReward && (
              <div className="flex items-start space-x-2">
                <span className="font-bold text-purple-600">3.</span>
                <span className="text-slate-700">
                  {alert.recommendation.includes('BUY') ? 'Vende' : 'Compra'} en ${alert.tradingAction.takeProfit.toFixed(2)} = 
                  <span className="font-semibold text-green-600">
                    {' '}objetivo ${riskReward.reward.toFixed(2)}/acción
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Track Trade Button */}
        <div className="mb-3">
          <button
            onClick={onOpenTrackModal}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg"
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>Registrar Trade</span>
          </button>
        </div>

      </div>

      {/* Expand/Collapse Button */}
      <div className="border-t border-gray-200 bg-gray-50">
        <button
          onClick={onToggleExpanded}
          className="w-full p-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
        >
          <span>{isExpanded ? 'Ocultar análisis técnico' : 'Ver análisis técnico completo'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white p-5">
          
          {/* Sentiment Scores - Detallados */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">Alcista</div>
              <div className="text-2xl font-black text-green-700">{alert.bullishScore}%</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-200 text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-2">Bajista</div>
              <div className="text-2xl font-black text-red-700">{alert.bearishScore}%</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-4 border border-slate-200 text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2">Neutral</div>
              <div className="text-2xl font-black text-slate-700">{alert.neutralScore}%</div>
            </div>
          </div>

          {/* Sección técnica removida - Protección de estrategia */}
          {/* Solo se mantienen las 3 tendencias principales arriba */}
          {false && alert.technicalIndicatorData && Object.keys(alert.technicalIndicatorData).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm">📋</span>
                </div>
                <h4 className="font-semibold text-gray-900">Indicadores Técnicos Detallados</h4>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Datos Profesionales</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {Object.entries(alert.technicalIndicatorData).map(([indicator, data]) => (
                  <div key={indicator} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-indigo-600">{indicator}</span>
                      {data.level && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          data.level === 'Sobreventa' || data.level === 'Banda Inferior' ? 'bg-green-100 text-green-700' :
                          data.level === 'Sobrecompra' || data.level === 'Banda Superior' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {data.level}
                        </span>
                      )}
                      {data.signal && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          data.signal === 'Alcista' ? 'bg-green-100 text-green-700' :
                          data.signal === 'Bajista' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {data.signal}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {data.value && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor:</span>
                          <span className="font-medium text-gray-900">{data.value.toFixed ? data.value.toFixed(2) : data.value}</span>
                        </div>
                      )}
                      {data.crossover && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className="font-medium text-gray-900">{data.crossover}</span>
                        </div>
                      )}
                      {data.position && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Posición:</span>
                          <span className="font-medium text-gray-900">{data.position}</span>
                        </div>
                      )}
                      {data.multiplier && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Volumen:</span>
                          <span className="font-medium text-gray-900">{data.multiplier}</span>
                        </div>
                      )}
                      {data.status && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className={`font-medium ${
                            data.status === 'Roto' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {data.status}
                          </span>
                        </div>
                      )}
                      {data.level && typeof data.level === 'number' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nivel:</span>
                          <span className="font-medium text-gray-900">${data.level.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    {data.interpretation && (
                      <div className="mt-2 p-2 bg-white rounded border-l-3 border-indigo-400">
                        <div className="text-xs text-indigo-700 font-medium">
                          💡 {data.interpretation}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Technical Summary */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📈</span>
              </div>
              <h4 className="font-semibold text-gray-900">Resumen Técnico</h4>
            </div>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
              {alert.technicalSummary}
            </p>
          </div>

          {/* Signals Breakdown */}
          <div className="space-y-5">
            {/* Bullish Signals */}
            {alert.bullishSignals.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h5 className="font-semibold text-green-700">
                    Señales Alcistas ({alert.bullishSignals.length})
                  </h5>
                </div>
                <div className="space-y-2">
                  {alert.bullishSignals.map((signal, idx) => (
                    <div key={idx} className="bg-green-50 border-l-3 border-green-400 p-3 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-800 font-medium">
                          {signal.description.replace(/\s*\([^)]*\)/g, '')}
                        </span>
                        <span className="text-xs text-green-600">
                          {formatTimestamp(new Date(signal.timestamp).getTime())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bearish Signals */}
            {alert.bearishSignals.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h5 className="font-semibold text-red-700">
                    Señales Bajistas ({alert.bearishSignals.length})
                  </h5>
                </div>
                <div className="space-y-2">
                  {alert.bearishSignals.map((signal, idx) => (
                    <div key={idx} className="bg-red-50 border-l-3 border-red-400 p-3 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-800 font-medium">
                          {signal.description.replace(/\s*\([^)]*\)/g, '')}
                        </span>
                        <span className="text-xs text-red-600">
                          {formatTimestamp(new Date(signal.timestamp).getTime())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neutral Signals */}
            {alert.neutralSignals.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <h5 className="font-semibold text-gray-700">
                    Señales Neutras ({alert.neutralSignals.length})
                  </h5>
                </div>
                <div className="space-y-2">
                  {alert.neutralSignals.map((signal, idx) => (
                    <div key={idx} className="bg-gray-50 border-l-3 border-gray-400 p-3 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-800 font-medium">
                          {signal.description.replace(/\s*\([^)]*\)/g, '')}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatTimestamp(new Date(signal.timestamp).getTime())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Technical Metadata */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-700 mb-1">Nivel de Recomendación</div>
                <div className="text-gray-900">{alert.recommendationLevel}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-700 mb-1">Alertas Originales</div>
                <div className="text-gray-900">{alert.rawAlerts.length} alertas procesadas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Tracking Modal */}
      <TradeTrackingModal
        alert={alert}
        isOpen={isTrackModalOpen}
        onClose={onCloseTrackModal}
        onSuccess={() => {
          if (onTradeRegistered) {
            onTradeRegistered();
          }
        }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si el alert cambió realmente O si el modal/expanded state cambiaron
  // Comparación optimizada: id + lastUpdate + modal state + expanded state
  return (
    prevProps.alert.id === nextProps.alert.id &&
    prevProps.alert.lastUpdate === nextProps.alert.lastUpdate &&
    prevProps.alert.confidenceScore === nextProps.alert.confidenceScore &&
    prevProps.isTrackModalOpen === nextProps.isTrackModalOpen &&
    prevProps.isExpanded === nextProps.isExpanded
  );
});

ConsolidatedAlertCard.displayName = 'ConsolidatedAlertCard';

export default ConsolidatedAlertCard;
