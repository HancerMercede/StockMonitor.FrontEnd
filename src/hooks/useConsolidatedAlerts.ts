import { useMemo } from 'react';
import type { 
  Alert, 
  ConsolidatedAlert, 
  ConsolidatedRecommendation,
  RiskLevel,
  Priority,
  TimeFrame,
  TechnicalSignal,
  SignalWeight,
  TradingAction,
  StepInstruction
} from '../types';

// Configuration for signal weights and sentiment analysis
const SIGNAL_WEIGHTS: Record<string, SignalWeight> = {
  // RSI Indicators
  'RSI_Overbought': { weight: 0.8, sentiment: 'bearish', priority: 'medium' },
  'RSI_Oversold': { weight: 0.8, sentiment: 'bullish', priority: 'medium' },
  
  // MACD Indicators
  'MACD_Bullish': { weight: 1.2, sentiment: 'bullish', priority: 'high' },
  'MACD_Bearish': { weight: 1.2, sentiment: 'bearish', priority: 'high' },
  'MACD_CrossAbove': { weight: 1.2, sentiment: 'bullish', priority: 'high' },
  'MACD_CrossBelow': { weight: 1.2, sentiment: 'bearish', priority: 'high' },
  
  // Moving Averages
  'SMA_CrossAbove': { weight: 1.0, sentiment: 'bullish', priority: 'high' },
  'SMA_CrossBelow': { weight: 1.0, sentiment: 'bearish', priority: 'high' },
  'EMA_CrossAbove': { weight: 1.0, sentiment: 'bullish', priority: 'high' },
  'EMA_CrossBelow': { weight: 1.0, sentiment: 'bearish', priority: 'high' },
  // Bollinger Bands
  'BollingerBands_Upper': { weight: 0.7, sentiment: 'bearish', priority: 'medium' },
  'BollingerBands_Lower': { weight: 0.7, sentiment: 'bullish', priority: 'medium' },
  'BollingerBands_Squeeze': { weight: 0.5, sentiment: 'neutral', priority: 'low' },
  'BollingerBands_Divergence': { weight: 1.8, sentiment: 'bullish', priority: 'high' },  // 👈 AUMENTADO para señal premium
  'BollingerBands_Divergence_Bullish': { weight: 1.8, sentiment: 'bullish', priority: 'high' },  // 👈 NUEVO
  'BollingerBands_Divergence_Bearish': { weight: 1.8, sentiment: 'bearish', priority: 'high' },  // 👈 NUEVO
  'BollingerBands_MiddleTouch': { weight: 0.6, sentiment: 'neutral', priority: 'medium' },
  'BollingerBands_Confirmation': { weight: 0.8, sentiment: 'bullish', priority: 'medium' },
  
  // Stochastic
  'Stochastic_Bullish': { weight: 0.9, sentiment: 'bullish', priority: 'medium' },
  'Stochastic_Bearish': { weight: 0.9, sentiment: 'bearish', priority: 'medium' },
  'Stochastic_Overbought': { weight: 0.7, sentiment: 'bearish', priority: 'medium' },
  'Stochastic_Oversold': { weight: 0.7, sentiment: 'bullish', priority: 'medium' },
  
  // Volume Indicators
  'Volume_Spike': { weight: 0.8, sentiment: 'bullish', priority: 'medium' },
  'Volume_Breakout': { weight: 1.0, sentiment: 'bullish', priority: 'high' },
  'VWAP_Above': { weight: 0.6, sentiment: 'bullish', priority: 'low' },
  'VWAP_Below': { weight: 0.6, sentiment: 'bearish', priority: 'low' },
  
  // Trend Indicators
  'Trend_Strong': { weight: 1.0, sentiment: 'bullish', priority: 'high' },
  'Trend_Weak': { weight: 0.6, sentiment: 'bearish', priority: 'medium' },
  'ADX_Strong': { weight: 0.9, sentiment: 'bullish', priority: 'medium' },
  
  // Momentum
  'Momentum_Bullish': { weight: 0.9, sentiment: 'bullish', priority: 'medium' },
  'Momentum_Bearish': { weight: 0.9, sentiment: 'bearish', priority: 'medium' },
  'Williams_Overbought': { weight: 0.7, sentiment: 'bearish', priority: 'medium' },
  'Williams_Oversold': { weight: 0.7, sentiment: 'bullish', priority: 'medium' },
  
  // Volatility
  'Volatility_High': { weight: 0.6, sentiment: 'neutral', priority: 'medium' },
  'Volatility_Low': { weight: 0.4, sentiment: 'neutral', priority: 'low' },
  'ATR_Spike': { weight: 0.7, sentiment: 'neutral', priority: 'medium' },
  
  // Price Action
  'PriceChange_Percentage': { weight: 0.8, sentiment: 'mixed', priority: 'medium' },
  'PriceBreakout': { weight: 1.2, sentiment: 'bullish', priority: 'high' },
  'Support_Level': { weight: 0.9, sentiment: 'bullish', priority: 'medium' },
  'Resistance_Level': { weight: 0.9, sentiment: 'bearish', priority: 'medium' },
  
  // Divergences
  'Divergence_Bullish': { weight: 1.4, sentiment: 'bullish', priority: 'high' },
  'Divergence_Bearish': { weight: 1.4, sentiment: 'bearish', priority: 'high' },
} as const;

/**
 * Custom hook for consolidating multiple technical alerts per symbol
 * into unified trading recommendations with confidence scoring
 */
export const useConsolidatedAlerts = (alerts: Alert[]): ConsolidatedAlert[] => {
  return useMemo(() => {
    if (!alerts?.length) return [];

    // Group alerts by symbol
    const alertsBySymbol = groupAlertsBySymbol(alerts);
    
    // Consolidate each symbol's alerts
    const consolidatedAlerts = Object.entries(alertsBySymbol)
      .map(([symbol, symbolAlerts]) => consolidateSymbolAlerts(symbol, symbolAlerts))
      .filter(Boolean) as ConsolidatedAlert[];

    // Sort by priority (1=highest) then confidence
    return consolidatedAlerts.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.confidenceScore - a.confidenceScore;
    });
  }, [alerts]);
};

/**
 * Groups alerts by symbol for consolidation
 */
const groupAlertsBySymbol = (alerts: Alert[]): Record<string, Alert[]> => {
  return alerts.reduce((acc, alert) => {
    const symbol = alert.symbol.toUpperCase();
    if (!acc[symbol]) acc[symbol] = [];
    acc[symbol].push(alert);
    return acc;
  }, {} as Record<string, Alert[]>);
};

/**
 * Consolidates all alerts for a single symbol into a unified recommendation
 */
const consolidateSymbolAlerts = (symbol: string, alerts: Alert[]): ConsolidatedAlert | null => {
  if (!alerts.length) return null;

  // Initialize scoring
  let bullishScore = 0;
  let bearishScore = 0;
  let neutralScore = 0;
  let totalWeight = 0;
  
  const bullishSignals: TechnicalSignal[] = [];
  const bearishSignals: TechnicalSignal[] = [];
  const neutralSignals: TechnicalSignal[] = [];

  // Process each alert
  for (const alert of alerts) {
    const signalType = extractSignalType(alert.type);
    const signalConfig = SIGNAL_WEIGHTS[signalType] || { 
      weight: 0.5, 
      sentiment: 'neutral', 
      priority: 'low' 
    };

    const weight = signalConfig.weight;
    totalWeight += weight;

    const technicalSignal: TechnicalSignal = {
      type: signalType,
      description: generateSignalDescription(signalType, alert),
      weight,
      timestamp: alert.timestamp,
      sentiment: signalConfig.sentiment === 'mixed' ? 'neutral' : signalConfig.sentiment,
    };

    // Categorize signal by sentiment
    switch (signalConfig.sentiment) {
      case 'bullish':
        bullishScore += weight;
        bullishSignals.push(technicalSignal);
        break;
      case 'bearish':
        bearishScore += weight;
        bearishSignals.push(technicalSignal);
        break;
      case 'mixed':
        // For mixed signals, add to both but with reduced weight
        bullishScore += weight * 0.3;
        bearishScore += weight * 0.3;
        neutralScore += weight * 0.4;
        neutralSignals.push(technicalSignal);
        break;
      default:
        neutralScore += weight;
        neutralSignals.push(technicalSignal);
    }
  }

  // Normalize scores (0-100 scale)
  const normalizedBullish = totalWeight > 0 ? Math.round((bullishScore / totalWeight) * 100) : 0;
  const normalizedBearish = totalWeight > 0 ? Math.round((bearishScore / totalWeight) * 100) : 0;
  const normalizedNeutral = totalWeight > 0 ? Math.round((neutralScore / totalWeight) * 100) : 0;

  // Generate recommendation con algoritmo agresivo
  const recommendation = determineRecommendation(
    normalizedBullish, 
    normalizedBearish, 
    normalizedNeutral,
    bullishSignals,
    bearishSignals
  );
  const confidenceScore = calculateConfidenceScore(normalizedBullish, normalizedBearish, totalWeight, alerts.length);
  const riskLevel = calculateRiskLevel(recommendation, confidenceScore, alerts.length);
  const priority = determinePriority(recommendation, confidenceScore);
  
  // Generar la acción de trading específica
  const tradingAction = generateTradingAction(
    symbol, 
    recommendation, 
    confidenceScore, 
    riskLevel, 
    bullishSignals, 
    bearishSignals,
    alerts
  );
  
  // Extraer datos técnicos específicos para traders profesionales
  const technicalIndicatorData = extractTechnicalIndicatorData(alerts);

  return {
    id: `consolidated-${symbol}`,
    symbol,
    recommendation: recommendation.action,
    recommendationLevel: recommendation.level,
    riskLevel,
    confidenceScore,
    
    // LA INFORMACIÓN MÁS IMPORTANTE PARA EL TRADER
    tradingAction,
    
    // DATOS TÉCNICOS ESPECÍFICOS PARA TRADERS PROFESIONALES
    technicalIndicatorData,
    
    bullishScore: normalizedBullish,
    bearishScore: normalizedBearish,
    neutralScore: normalizedNeutral,
    
    bullishSignals: bullishSignals.sort((a, b) => b.weight - a.weight),
    bearishSignals: bearishSignals.sort((a, b) => b.weight - a.weight),
    neutralSignals: neutralSignals.sort((a, b) => b.weight - a.weight),
    
    primaryReason: generatePrimaryReason(recommendation, bullishSignals, bearishSignals),
    technicalSummary: generateTechnicalSummary(symbol, recommendation, confidenceScore),
    timeFrame: determineTimeFrame(alerts),
    
    alertCount: alerts.length,
    lastUpdate: Math.max(...alerts.map(a => new Date(a.timestamp).getTime())),
    priority,
    
    rawAlerts: alerts,
  };
};

/**
 * Extracts the base signal type from alert type (string or enum number)
 */
const extractSignalType = (type: string | number): string => {
  // Convertir a string si es un número (enum del backend)
  const typeStr = String(type);
  
  if (!typeStr || typeStr === 'undefined') return 'Unknown';
  
  // Handle patterns like "RSI_Overbought_Daily" -> "RSI_Overbought"
  const parts = typeStr.split('_');
  return parts.slice(0, 2).join('_');
};

/**
 * Generates human-readable description for technical signals
 */
const generateSignalDescription = (signalType: string, alert: Alert): string => {
  const descriptions: Record<string, string> = {
    // RSI
    'RSI_Overbought': `RSI en sobrecompra${alert.value ? ` (${alert.value})` : ''}`,
    'RSI_Oversold': `RSI en sobreventa${alert.value ? ` (${alert.value})` : ''}`,
    
    // MACD
    'MACD_Bullish': 'MACD señal alcista confirmada',
    'MACD_Bearish': 'MACD señal bajista confirmada',
    'MACD_CrossAbove': 'MACD cruzó por encima de la señal',
    'MACD_CrossBelow': 'MACD cruzó por debajo de la señal',
    
    // Moving Averages
    'SMA_CrossAbove': 'Golden Cross - SMA20 cruzó SMA50 al alza',
    'SMA_CrossBelow': 'Death Cross - SMA20 cruzó SMA50 a la baja',
    'EMA_CrossAbove': 'EMA cruzó al alza - señal alcista',
    'EMA_CrossBelow': 'EMA cruzó a la baja - señal bajista',
    
    // Bollinger Bands
    'BollingerBands_Upper': 'Precio toca banda superior Bollinger',
    'BollingerBands_Lower': 'Precio toca banda inferior Bollinger',
    'BollingerBands_Squeeze': 'Compresión de Bollinger Bands detectada',
    'BollingerBands_Divergence': 'Divergencia en Bollinger Bands',
    'BollingerBands_MiddleTouch': 'Precio toca línea media Bollinger',
    'BollingerBands_Confirmation': 'Confirmación en marco temporal 4H',
    
    // Stochastic
    'Stochastic_Bullish': 'Stochastic señal alcista',
    'Stochastic_Bearish': 'Stochastic señal bajista',
    'Stochastic_Overbought': 'Stochastic en sobrecompra',
    'Stochastic_Oversold': 'Stochastic en sobreventa',
    
    // Volume
    'Volume_Spike': 'Volumen significativamente elevado',
    'Volume_Breakout': 'Breakout con volumen fuerte',
    'VWAP_Above': 'Precio por encima del VWAP',
    'VWAP_Below': 'Precio por debajo del VWAP',
    
    // Trend
    'Trend_Strong': 'Tendencia fuerte confirmada por múltiples marcos temporales',
    'Trend_Weak': 'Tendencia débil detectada',
    'ADX_Strong': 'ADX indica tendencia fuerte',
    
    // Momentum
    'Momentum_Bullish': 'Momentum alcista detectado',
    'Momentum_Bearish': 'Momentum bajista detectado',
    'Williams_Overbought': 'Williams %R en sobrecompra',
    'Williams_Oversold': 'Williams %R en sobreventa',
    
    // Volatility
    'Volatility_High': 'Volatilidad alta detectada',
    'Volatility_Low': 'Volatilidad baja detectada',
    'ATR_Spike': 'Pico de ATR - aumento de volatilidad',
    
    // Price Action
    'PriceChange_Percentage': `Movimiento significativo de precio${alert.value ? ` (${alert.value}%)` : ''}`,
    'PriceBreakout': 'Breakout de precio detectado',
    'Support_Level': 'Nivel de soporte alcanzado',
    'Resistance_Level': 'Nivel de resistencia alcanzado',
    
    // Divergences
    'Divergence_Bullish': 'Divergencia alcista detectada en indicadores',
    'Divergence_Bearish': 'Divergencia bajista detectada en indicadores',
  };
  
  // Fallback mejorado: usa el mensaje de la alerta si está disponible
  if (!descriptions[signalType]) {
    // Si hay mensaje, extraer la parte relevante
    if (alert.message) {
      // Intentar extraer descripción del mensaje (después del emoji)
      const messageMatch = alert.message.match(/[🔴📈📉📊⚡🎯💡]\s*([^-]+)/);
      if (messageMatch) {
        return messageMatch[1].trim();
      }
    }
    // Si no hay mensaje útil, formatear el tipo
    return `${signalType.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}`;
  }
  
  return descriptions[signalType];
};

/**
 * Determines the trading recommendation based on sentiment scores - ALGORITMO AGRESIVO
 */
const determineRecommendation = (
  bullishScore: number, 
  bearishScore: number, 
  neutralScore: number,
  bullishSignals: TechnicalSignal[],
  bearishSignals: TechnicalSignal[]
): { action: ConsolidatedRecommendation; level: 'STRONG' | 'MODERATE' | 'WEAK' | 'NEUTRAL' } => {
  
  // ALGORITMO AGRESIVO: Buscar señales fuertes específicas primero
  
  // Señales de VENTA FUERTE
  const hasStrongSellSignals = bearishSignals.some(signal => 
    (signal.type.includes('RSI_Overbought') && signal.weight >= 0.8) ||
    (signal.type.includes('BollingerBands_Upper') && signal.weight >= 0.7) ||
    (signal.type.includes('Resistance_Break') && signal.weight >= 1.2)
  );
  
  // Señales de COMPRA FUERTE
  const hasStrongBuySignals = bullishSignals.some(signal => 
    (signal.type.includes('RSI_Oversold') && signal.weight >= 0.8) ||
    (signal.type.includes('BollingerBands_Lower') && signal.weight >= 0.7) ||
    (signal.type.includes('Support_Break') && signal.weight >= 1.2) ||
    (signal.type.includes('MACD_Bullish') && signal.weight >= 1.2)
  );
  
  // DECISIONES AGRESIVAS ESPECÍFICAS
  if (hasStrongSellSignals && bearishScore >= 50) {
    return bearishScore >= 70 ? 
      { action: 'STRONG_SELL', level: 'STRONG' } : 
      { action: 'SELL', level: 'MODERATE' };
  }
  
  if (hasStrongBuySignals && bullishScore >= 50) {
    return bullishScore >= 70 ? 
      { action: 'STRONG_BUY', level: 'STRONG' } : 
      { action: 'BUY', level: 'MODERATE' };
  }
  
  // Lógica tradicional para casos menos claros
  const netScore = bullishScore - bearishScore;
  
  // 👈 AJUSTADO: Umbrales MÁS BAJOS para respetar señales del backend
  if (netScore >= 35) return { action: 'STRONG_BUY', level: 'STRONG' };
  if (netScore >= 10) return { action: 'BUY', level: 'MODERATE' };  // 👈 Bajado de 15 a 10
  if (netScore >= 1) return { action: 'WEAK_BUY', level: 'WEAK' };   // 👈 Bajado de 5 a 1
  
  // ✅ WATCH solo para señales muy equilibradas (rango estrecho)
  // Si netScore está entre -1 y 1 pero hay dirección predominante, dar recomendación
  if (netScore >= -1) {
    // Si hay al menos algo de ventaja alcista, sugerir WEAK_BUY
    if (bullishScore > bearishScore) return { action: 'WEAK_BUY', level: 'WEAK' };
    // Si hay ventaja bajista, sugerir WEAK_SELL
    if (bearishScore > bullishScore) return { action: 'WEAK_SELL', level: 'WEAK' };
    // Solo WATCH si están completamente equilibradas
    return { action: 'WATCH', level: 'NEUTRAL' };
  }
  
  if (netScore >= -10) return { action: 'WEAK_SELL', level: 'WEAK' };
  if (netScore >= -35) return { action: 'SELL', level: 'MODERATE' };
  return { action: 'STRONG_SELL', level: 'STRONG' };
};

/**
 * Calculates confidence score based on signal consistency and strength
 */
const calculateConfidenceScore = (
  bullishScore: number, 
  bearishScore: number, 
  totalWeight: number, 
  alertCount: number
): number => {
  // Factors affecting confidence:
  // 1. Signal consistency (40%) - direccionalidad clara
  // 2. Total signal strength (40%) - calidad de señales
  // 3. Signal count (20%) - cantidad de confirmaciones
  
  // 1. Consistencia: qué tan clara es la dirección (0-1)
  const scoreDifference = Math.abs(bullishScore - bearishScore);
  const consistencyFactor = Math.min(scoreDifference / 100, 1);
  
  // 2. Fuerza: calidad de las señales (0-1)
  // 👈 AJUSTADO: Cap 2.0 para valorar señales premium individuales como Bollinger Divergence
  // Bollinger Divergence (1.8) solo = 90% strength factor
  // RSI(0.8) + MACD(1.2) = 100% strength factor
  const strengthFactor = Math.min(totalWeight / 2.0, 1);
  
  // 3. Cantidad: más señales = más confirmación (0-1)
  // 👈 AJUSTADO: 1 señal fuerte = 70%, 2=85%, 3+=100%
  // Para Bollinger Divergence: 1 alerta premium es suficiente
  const countFactor = alertCount >= 3 ? 1.0 :
                      alertCount === 2 ? 0.85 :
                      totalWeight >= 1.5 ? 0.70 :  // 👈 Bonus para señales premium
                      0.50;
  
  // Pesos optimizados para señales reales
  const confidence = (
    consistencyFactor * 0.35 +  // 35% = direccionalidad (reducido)
    strengthFactor * 0.50 +     // 50% = calidad de señales (👈 AUMENTADO!)
    countFactor * 0.15          // 15% = confirmaciones (reducido)
  ) * 100;
  
  // 👈 AJUSTADO: Rango 35-100% (más permisivo para alertas del backend)
  return Math.round(Math.max(Math.min(confidence, 100), 35));
};

/**
 * Calculates risk level based on recommendation strength and confidence
 */
const calculateRiskLevel = (
  recommendation: { action: ConsolidatedRecommendation; level: string },
  confidenceScore: number,
  alertCount: number
): RiskLevel => {
  const baseRiskFactors: Record<ConsolidatedRecommendation, number> = {
    'STRONG_BUY': 0.3,
    'BUY': 0.4,  
    'WEAK_BUY': 0.5,
    'WATCH': 0.2,
    'WEAK_SELL': 0.5,
    'SELL': 0.4,
    'STRONG_SELL': 0.3,
  };
  
  const baseRisk = baseRiskFactors[recommendation.action];
  const confidenceRisk = (100 - confidenceScore) / 200; // Low confidence = higher risk
  const signalRisk = alertCount < 3 ? 0.15 : 0; // Few signals = higher risk
  
  const totalRisk = baseRisk + confidenceRisk + signalRisk;
  
  // 👈 AJUSTADO: Umbrales más permisivos para considerar bajo riesgo
  // Con 72% confianza + BUY = LOW risk
  if (totalRisk <= 0.35) return 'LOW';       // 👈 Aumentado de 0.3 a 0.35
  if (totalRisk <= 0.65) return 'MODERATE';  // 👈 Aumentado de 0.6 a 0.65
  if (totalRisk <= 0.85) return 'HIGH';      // 👈 Aumentado de 0.8 a 0.85
  return 'EXTREME';
};

/**
 * Determines priority level for the consolidated alert
 */
const determinePriority = (
  recommendation: { action: ConsolidatedRecommendation; level: string },
  confidenceScore: number
): Priority => {
  // Strong recommendations with high confidence get top priority
  if (recommendation.level === 'STRONG' && confidenceScore >= 75) return 1;
  
  // Moderate recommendations with good confidence get medium priority  
  if (recommendation.level !== 'NEUTRAL' && confidenceScore >= 55) return 2;
  
  // Everything else gets low priority
  return 3;
};

/**
 * Generates the primary reason for the recommendation
 */
const generatePrimaryReason = (
  recommendation: { action: ConsolidatedRecommendation; level: string },
  bullishSignals: TechnicalSignal[],
  bearishSignals: TechnicalSignal[]
): string => {
  // Find the strongest signal
  const allSignals = [...bullishSignals, ...bearishSignals]
    .filter(signal => signal.weight >= 1.0)
    .sort((a, b) => b.weight - a.weight);
  
  if (allSignals.length > 0) {
    return allSignals[0].description;
  }
  
  // Fallback to general reasoning
  if (recommendation.action.includes('BUY')) {
    return bullishSignals.length > 0 
      ? bullishSignals[0].description 
      : 'Confluencia de señales técnicas alcistas';
  }
  
  if (recommendation.action.includes('SELL')) {
    return bearishSignals.length > 0 
      ? bearishSignals[0].description 
      : 'Confluencia de señales técnicas bajistas';
  }
  
  return 'Señales mixtas requieren observación cuidadosa';
};

/**
 * Generates comprehensive technical summary
 */
const generateTechnicalSummary = (
  symbol: string,
  recommendation: { action: ConsolidatedRecommendation; level: string },
  confidenceScore: number
): string => {
  // 👈 AJUSTADO: 70%+ es confianza alta, 50-69% es moderada
  const confidenceText = confidenceScore >= 70 ? 'alta' : 
                        confidenceScore >= 50 ? 'moderada' : 'baja';
  
  const actionTexts: Record<ConsolidatedRecommendation, string> = {
    'STRONG_BUY': 'compra fuerte',
    'BUY': 'compra moderada',
    'WEAK_BUY': 'compra débil',
    'WATCH': 'observación',
    'WEAK_SELL': 'venta débil', 
    'SELL': 'venta moderada',
    'STRONG_SELL': 'venta fuerte',
  };
  
  return `${symbol} presenta señales consolidadas para ${actionTexts[recommendation.action]} con confianza ${confidenceText} basada en análisis técnico multi-indicador.`;
};

/**
 * Determines appropriate timeframe for the recommendation
 */
const determineTimeFrame = (alerts: Alert[]): TimeFrame => {
  // Analyze alert types to determine timeframe
  const hasShortTerm = alerts.some(a => 
    typeof a.type === 'string' && (
      a.type.includes('4H') || 
      a.type.includes('1H') || 
      a.type.includes('Intraday')
    )
  );
  
  const hasMediumTerm = alerts.some(a => 
    typeof a.type === 'string' && (
      a.type.includes('Daily') || 
      a.type.includes('8H')
    )
  );
  
  const hasLongTerm = alerts.some(a => 
    typeof a.type === 'string' && (
      a.type.includes('Weekly') || 
      a.type.includes('Monthly')
    )
  );
  
  if (hasLongTerm) return 'Long Term (10-30 days)';
  if (hasMediumTerm) return 'Medium Term (5-15 days)';
  if (hasShortTerm) return 'Short Term (1-5 days)';
  
  // Default to medium term for swing trading
  return 'Medium Term (5-15 days)';
};

/**
 * Genera una acción de trading específica y clara para el trader
 */
const generateTradingAction = (
  symbol: string,
  recommendation: { action: ConsolidatedRecommendation; level: string },
  confidenceScore: number,
  riskLevel: RiskLevel,
  bullishSignals: TechnicalSignal[],
  bearishSignals: TechnicalSignal[],
  alerts: Alert[]
): TradingAction => {
  
  // Determinar la urgencia basada en confianza y señales
  const urgency = determineUrgency(recommendation, confidenceScore, bullishSignals, bearishSignals);
  
  // Generar texto de acción específico
  const actionText = generateActionText(recommendation, urgency, bullishSignals, bearishSignals);
  
  // Determinar timing
  const timing = generateTiming(urgency, recommendation);
  
  // Calcular niveles de precio usando datos reales de las alertas
  const priceData = generatePriceLevels(symbol, recommendation, riskLevel, alerts);
  
  // Tamaño de posición basado en riesgo
  const positionSize = generatePositionSize(riskLevel, confidenceScore);
  
  // Generar instrucciones paso a paso
  const stepByStepInstructions = generateStepByStepInstructions(
    symbol, 
    recommendation, 
    priceData, 
    positionSize, 
    confidenceScore
  );
  
  return {
    actionText,
    urgency,
    timing,
    entryPrice: priceData.entryPrice,
    stopLoss: priceData.stopLoss,
    takeProfit: priceData.takeProfit,
    positionSize,
    stepByStepInstructions
  };
};

/**
 * Determina el nivel de urgencia de la acción
 */
const determineUrgency = (
  recommendation: { action: ConsolidatedRecommendation; level: string },
  confidenceScore: number,
  bullishSignals: TechnicalSignal[],
  bearishSignals: TechnicalSignal[]
): 'INMEDIATA' | 'ALTA' | 'MEDIA' | 'BAJA' => {
  
  // Señales de alta urgencia
  const hasBreakoutSignals = [...bullishSignals, ...bearishSignals].some(signal => 
    signal.type.includes('Break') || 
    signal.type.includes('Resistance') || 
    signal.type.includes('Support')
  );
  
  const hasRSIExtremes = [...bullishSignals, ...bearishSignals].some(signal => 
    signal.type.includes('RSI') && signal.weight >= 0.8
  );
  
  // Urgencia inmediata
  if (recommendation.level === 'STRONG' && confidenceScore >= 80 && hasBreakoutSignals) {
    return 'INMEDIATA';
  }
  
  // Urgencia alta
  if ((recommendation.level === 'STRONG' && confidenceScore >= 70) || 
      (confidenceScore >= 75 && hasRSIExtremes)) {
    return 'ALTA';
  }
  
  // Urgencia media
  if (recommendation.level === 'MODERATE' && confidenceScore >= 60) {
    return 'MEDIA';
  }
  
  // Urgencia baja
  return 'BAJA';
};

/**
 * Genera el texto de acción específico
 */
const generateActionText = (
  recommendation: { action: ConsolidatedRecommendation; level: string },
  urgency: 'INMEDIATA' | 'ALTA' | 'MEDIA' | 'BAJA',
  bullishSignals: TechnicalSignal[],
  bearishSignals: TechnicalSignal[]
): string => {
  
  const hasRSIOversold = bullishSignals.some(s => s.type.includes('RSI_Oversold'));
  const hasRSIOverbought = bearishSignals.some(s => s.type.includes('RSI_Overbought'));
  const hasMACDBullish = bullishSignals.some(s => s.type.includes('MACD_Bullish'));
  const hasBollingerLower = bullishSignals.some(s => s.type.includes('BollingerBands_Lower'));
  const hasBollingerUpper = bearishSignals.some(s => s.type.includes('BollingerBands_Upper'));
  
  switch (recommendation.action) {
    case 'STRONG_BUY':
      if (urgency === 'INMEDIATA') {
        return hasRSIOversold ? 'COMPRA AHORA - RSI Sobreventa' : 'COMPRA INMEDIATA - Señal Fuerte';
      }
      return 'COMPRA FUERTE RECOMENDADA';
      
    case 'BUY':
      if (hasBollingerLower) return 'COMPRA en Soporte Bollinger';
      if (hasMACDBullish) return 'COMPRA - MACD Confirmado';
      if (urgency === 'ALTA') return 'COMPRA HOY';
      return 'COMPRA RECOMENDADA';
      
    case 'WEAK_BUY':
      return urgency === 'MEDIA' ? 'Considera COMPRA Gradual' : 'COMPRA con Precaución';
      
    case 'WATCH':
      return 'ESPERA - Observa Confirmación';
      
    case 'WEAK_SELL':
      return 'Considera VENTA Parcial';
      
    case 'SELL':
      if (hasBollingerUpper) return 'VENDE en Resistencia';
      if (urgency === 'ALTA') return 'VENDE HOY';
      return 'VENTA RECOMENDADA';
      
    case 'STRONG_SELL':
      if (urgency === 'INMEDIATA') {
        return hasRSIOverbought ? 'VENDE AHORA - RSI Sobrecompra' : 'VENTA INMEDIATA';
      }
      return 'VENTA FUERTE - Salir de Posición';
      
    default:
      return 'ANALIZAR MÁS';
  }
};

/**
 * Genera el timing de la acción
 */
const generateTiming = (
  urgency: 'INMEDIATA' | 'ALTA' | 'MEDIA' | 'BAJA',
  recommendation: { action: ConsolidatedRecommendation; level: string }
): string => {
  
  switch (urgency) {
    case 'INMEDIATA':
      return 'Ahora mismo';
    case 'ALTA':
      return recommendation.action.includes('BUY') ? 'Hoy o mañana' : 'En las próximas horas';
    case 'MEDIA':
      return 'Esta semana';
    case 'BAJA':
      return 'Próximos 7-10 días';
    default:
      return 'Cuando veas confirmación';
  }
};

/**
 * Genera niveles de precio usando datos reales de las alertas técnicas
 */
const generatePriceLevels = (
  symbol: string,
  recommendation: { action: ConsolidatedRecommendation; level: string },
  riskLevel: RiskLevel,
  alerts: Alert[]
): { entryPrice?: number; stopLoss?: number; takeProfit?: number } => {
  
  if (recommendation.action === 'WATCH') {
    return {}; // No hay niveles para WATCH
  }
  
  // Extraer precio base de las alertas reales
  const currentPrice = extractCurrentPrice(alerts);
  if (!currentPrice) {
    return {}; // Sin datos de precio no podemos calcular niveles
  }
  
  // Extraer niveles técnicos reales de las alertas
  const technicalLevels = extractTechnicalLevels(alerts, currentPrice);
  
  // Calcular porcentajes dinámicos basados en volatilidad y riesgo
  const { stopLossPercent, takeProfitPercent } = calculateDynamicPercentages(
    riskLevel,
    alerts,
    technicalLevels
  );
  
  if (recommendation.action.includes('BUY')) {
    return {
      entryPrice: Number(currentPrice.toFixed(2)),
      stopLoss: technicalLevels.supportLevel || Number((currentPrice * (1 - stopLossPercent)).toFixed(2)),
      takeProfit: technicalLevels.resistanceLevel || Number((currentPrice * (1 + takeProfitPercent)).toFixed(2))
    };
  } else if (recommendation.action.includes('SELL')) {
    return {
      entryPrice: Number(currentPrice.toFixed(2)),
      stopLoss: technicalLevels.resistanceLevel || Number((currentPrice * (1 + stopLossPercent)).toFixed(2)),
      takeProfit: technicalLevels.supportLevel || Number((currentPrice * (1 - takeProfitPercent)).toFixed(2))
    };
  }
  
  return {};
};

/**
 * Genera el tamaño de posición recomendado
 */
const generatePositionSize = (
  riskLevel: RiskLevel,
  confidenceScore: number
): string => {
  
  // Basado en Kelly Criterion y gestión de riesgo
  if (confidenceScore >= 80 && riskLevel === 'LOW') {
    return 'Posición Normal (3-5%)';
  }
  
  if (confidenceScore >= 70 && (riskLevel === 'LOW' || riskLevel === 'MODERATE')) {
    return 'Posición Moderada (2-3%)';
  }
  
  if (confidenceScore >= 60) {
    return 'Posición Pequeña (1-2%)';
  }
  
  if (riskLevel === 'HIGH' || riskLevel === 'EXTREME') {
    return 'Posición Mínima (0.5-1%)';
  }
  
  return 'Posición de Prueba (0.5%)';
};

/**
 * Genera instrucciones paso a paso específicas para el trader
 */
const generateStepByStepInstructions = (
  symbol: string,
  recommendation: { action: ConsolidatedRecommendation; level: string },
  priceData: { entryPrice?: number; stopLoss?: number; takeProfit?: number },
  positionSize: string,
  confidenceScore: number
): StepInstruction[] => {
  
  const instructions: StepInstruction[] = [];
  
  if (recommendation.action.includes('BUY')) {
    // Instrucciones para COMPRA
    instructions.push({
      step: 1,
      action: `Abrir posición LARGA en ${symbol}`,
      details: `Ejecutar orden de compra en ${symbol}`,
      importance: 'CRITICAL'
    });
    
    if (priceData.entryPrice) {
      instructions.push({
        step: 2,
        action: `Precio de entrada: $${priceData.entryPrice}`,
        details: `Usar orden limitada a $${priceData.entryPrice} o mejor`,
        importance: 'HIGH'
      });
    }
    
    if (priceData.stopLoss) {
      instructions.push({
        step: 3,
        action: `Colocar Stop Loss: $${priceData.stopLoss}`,
        details: `Stop loss a $${priceData.stopLoss} (${((1 - priceData.stopLoss/priceData.entryPrice!) * 100).toFixed(1)}% riesgo)`,
        importance: 'CRITICAL'
      });
    }
    
    if (priceData.takeProfit) {
      instructions.push({
        step: 4,
        action: `Target objetivo: $${priceData.takeProfit}`,
        details: `Take profit en $${priceData.takeProfit} (${((priceData.takeProfit/priceData.entryPrice! - 1) * 100).toFixed(1)}% ganancia)`,
        importance: 'HIGH'
      });
    }
    
    instructions.push({
      step: 5,
      action: `Tamaño de posición: ${positionSize}`,
      details: `Usar solo ${positionSize} del capital total disponible`,
      importance: 'HIGH'
    });
    
  } else if (recommendation.action.includes('SELL')) {
    // Instrucciones para VENTA
    instructions.push({
      step: 1,
      action: `Cerrar posición LARGA o abrir CORTA en ${symbol}`,
      details: `Ejecutar orden de venta en ${symbol}`,
      importance: 'CRITICAL'
    });
    
    if (priceData.entryPrice) {
      instructions.push({
        step: 2,
        action: `Precio objetivo: $${priceData.entryPrice}`,
        details: `Usar orden limitada a $${priceData.entryPrice} o mejor`,
        importance: 'HIGH'
      });
    }
    
    if (priceData.stopLoss) {
      instructions.push({
        step: 3,
        action: `Colocar Stop Loss: $${priceData.stopLoss}`,
        details: `Stop loss a $${priceData.stopLoss} para limitar pérdidas`,
        importance: 'CRITICAL'
      });
    }
    
    instructions.push({
      step: 4,
      action: `Tamaño de posición: ${positionSize}`,
      details: `Vender ${positionSize} de la posición actual`,
      importance: 'HIGH'
    });
    
  } else {
    // Instrucciones para WATCH
    instructions.push({
      step: 1,
      action: `Monitorear ${symbol} de cerca`,
      details: `No abrir posición todavía - señales mixtas`,
      importance: 'MEDIUM'
    });
    
    instructions.push({
      step: 2,
      action: 'Esperar confirmación adicional',
      details: `Confianza actual: ${confidenceScore}% - Esperar mayor claridad`,
      importance: 'HIGH'
    });
    
    if (priceData.entryPrice) {
      instructions.push({
        step: 3,
        action: `Nivel de entrada potencial: $${priceData.entryPrice}`,
        details: `Si las señales se aclaran, considerar entrada cerca de $${priceData.entryPrice}`,
        importance: 'INFO'
      });
    }
  }
  
  // Instrucción final de gestión de riesgo
  instructions.push({
    step: instructions.length + 1,
    action: 'Revisar gestión de riesgo',
    details: 'Nunca arriesgar más del 2% del capital en una sola operación',
    importance: 'CRITICAL'
  });
  
  return instructions;
};

/**
 * Extrae datos técnicos específicos de las alertas para traders profesionales
 */
const extractTechnicalIndicatorData = (alerts: Alert[]): Record<string, any> => {
  const technicalData: Record<string, any> = {};
  
  alerts.forEach(alert => {
    const signalType = extractSignalType(alert.type);
    
    // Extraer valores específicos basados en el tipo de indicador
    switch (true) {
      case signalType.includes('RSI'):
        const rsiValue = alert.value || generateMockRSI(signalType);
        technicalData.RSI = {
          value: Math.round(rsiValue),
          level: signalType.includes('Overbought') ? 'Sobrecompra' : 
                 signalType.includes('Oversold') ? 'Sobreventa' : 'Normal',
          interpretation: signalType.includes('Overbought') ? 
            'Precio puede corregir a la baja' : 
            signalType.includes('Oversold') ? 
            'Precio puede rebotar al alza' : 'Zona neutral'
        };
        break;
        
      case signalType.includes('MACD'):
        technicalData.MACD = {
          signal: signalType.includes('Bullish') ? 'Alcista' : 'Bajista',
          crossover: signalType.includes('Bullish') ? 'MACD > Signal' : 'MACD < Signal',
          interpretation: signalType.includes('Bullish') ? 
            'Momentum alcista confirmado' : 'Momentum bajista confirmado'
        };
        break;
        
      case signalType.includes('BollingerBands'):
        technicalData.BollingerBands = {
          position: signalType.includes('Upper') ? 'Banda Superior' : 
                   signalType.includes('Lower') ? 'Banda Inferior' : 'Centro',
          squeeze: signalType.includes('Squeeze'),
          interpretation: signalType.includes('Upper') ? 
            'Posible resistencia - considerar venta' : 
            signalType.includes('Lower') ? 
            'Posible soporte - considerar compra' : 'Volatilidad normal'
        };
        break;
        
      case signalType.includes('Volume'):
        technicalData.Volume = {
          level: signalType.includes('Spike') ? 'Alto' : 'Bajo',
          multiplier: alert.value ? `${alert.value}x promedio` : 
                     signalType.includes('Spike') ? '2.5x promedio' : '0.7x promedio',
          interpretation: signalType.includes('Spike') ? 
            'Interés institucional fuerte' : 'Baja participación del mercado'
        };
        break;
        
      case signalType.includes('Support') || signalType.includes('Resistance'):
        const level = signalType.includes('Support') ? 'Soporte' : 'Resistencia';
        const breaking = signalType.includes('Break');
        technicalData[level] = {
          status: breaking ? 'Roto' : 'Intacto',
          level: alert.value || estimateBasePriceBySymbol(alert.symbol || 'UNKNOWN'),
          interpretation: breaking ? 
            `${level} roto - cambio de tendencia posible` : 
            `${level} manteniéndose - tendencia continúa`
        };
        break;
    }
  });
  
  return technicalData;
};

/**
 * Genera valores mock para RSI cuando no hay datos reales
 */
const generateMockRSI = (signalType: string): number => {
  if (signalType.includes('Overbought')) return Math.random() * 20 + 70; // 70-90
  if (signalType.includes('Oversold')) return Math.random() * 20 + 10;   // 10-30
  return Math.random() * 40 + 30; // 30-70 (neutral)
};

/**
 * Extrae el precio actual de las alertas reales
 */
const extractCurrentPrice = (alerts: Alert[]): number | null => {
  // PRIORIDAD 1: Buscar en indicators.currentPrice (más confiable)
  for (const alert of alerts) {
    if (alert.indicators?.currentPrice && alert.indicators.currentPrice > 1) {
      return alert.indicators.currentPrice;
    }
  }
  
  // PRIORIDAD 2: Buscar alertas con datos de precio válido
  for (const alert of alerts) {
    if (alert.value && alert.value > 0) {
      // Si el valor es un RSI (0-100), no es un precio
      if (String(alert.type).includes('RSI') && alert.value <= 100) {
        continue;
      }
      
      // Si el valor es MACD (usualmente menor a 50), no es un precio
      if (String(alert.type).includes('MACD') && alert.value < 50) {
        continue;
      }
      
      // Si el valor es ADX (0-100), no es un precio
      if (String(alert.type).includes('ADX') && alert.value <= 100) {
        continue;
      }
      
      // Si el valor es un ratio de volumen (usualmente menor a 10), no es un precio
      if (String(alert.type).includes('Volume') && alert.value < 10) {
        continue;
      }
      
      // Si es un precio válido (mayor a $1)
      if (alert.value >= 1) {
        return alert.value;
      }
    }
    
    // PRIORIDAD 3: Extraer precio del mensaje si está disponible
    const priceMatch = alert.message.match(/\$([0-9]+\.?[0-9]+)/g);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0].replace('$', ''));
      if (price >= 10) { // Precio razonable para acciones
        return price;
      }
    }
  }
  
  // FALLBACK: Precio base estimado por símbolo
  return estimateBasePriceBySymbol(alerts[0]?.symbol || 'UNKNOWN');
};

/**
 * Extrae niveles técnicos reales de las alertas
 */
const extractTechnicalLevels = (alerts: Alert[], currentPrice: number): {
  supportLevel?: number;
  resistanceLevel?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
} => {
  const levels = {
    supportLevel: undefined as number | undefined,
    resistanceLevel: undefined as number | undefined,
    bollingerUpper: undefined as number | undefined,
    bollingerLower: undefined as number | undefined
  };
  
  for (const alert of alerts) {
    const alertType = String(alert.type).toLowerCase();
    
    // Buscar niveles de soporte y resistencia
    if (alertType.includes('support') && alert.value) {
      levels.supportLevel = alert.value;
    }
    
    if (alertType.includes('resistance') && alert.value) {
      levels.resistanceLevel = alert.value;
    }
    
    // Buscar bandas de Bollinger
    if (alertType.includes('bollinger')) {
      if (alertType.includes('upper') && alert.value) {
        levels.bollingerUpper = alert.value;
      }
      if (alertType.includes('lower') && alert.value) {
        levels.bollingerLower = alert.value;
      }
    }
    
    // Extraer niveles del mensaje
    const supportMatch = alert.message.match(/soporte[:\s]*\$?([0-9]+\.?[0-9]*)/i);
    if (supportMatch && !levels.supportLevel) {
      levels.supportLevel = parseFloat(supportMatch[1]);
    }
    
    const resistanceMatch = alert.message.match(/resistencia[:\s]*\$?([0-9]+\.?[0-9]*)/i);
    if (resistanceMatch && !levels.resistanceLevel) {
      levels.resistanceLevel = parseFloat(resistanceMatch[1]);
    }
  }
  
  // Si no hay niveles, calcular basado en precio actual
  if (!levels.supportLevel) {
    levels.supportLevel = Number((currentPrice * 0.97).toFixed(2)); // 3% abajo
  }
  
  if (!levels.resistanceLevel) {
    levels.resistanceLevel = Number((currentPrice * 1.03).toFixed(2)); // 3% arriba
  }
  
  return levels;
};

/**
 * Calcula porcentajes dinámicos basados en volatilidad y análisis técnico
 */
const calculateDynamicPercentages = (
  riskLevel: RiskLevel,
  alerts: Alert[],
  technicalLevels: { supportLevel?: number; resistanceLevel?: number }
): { stopLossPercent: number; takeProfitPercent: number } => {
  
  // Detectar volatilidad basada en tipos de alertas
  const hasVolatilitySignals = alerts.some(alert => 
    String(alert.type).includes('Volume_Spike') || 
    String(alert.type).includes('BollingerBands') ||
    alert.message.toLowerCase().includes('volatil')
  );
  
  // Base percentages ajustados por riesgo
  let baseStopLoss: number;
  let baseTakeProfit: number;
  
  switch (riskLevel) {
    case 'LOW':
      baseStopLoss = hasVolatilitySignals ? 0.04 : 0.025;  // 2.5-4%
      baseTakeProfit = hasVolatilitySignals ? 0.08 : 0.05; // 5-8%
      break;
    case 'MODERATE':
      baseStopLoss = hasVolatilitySignals ? 0.06 : 0.04;   // 4-6%
      baseTakeProfit = hasVolatilitySignals ? 0.12 : 0.08; // 8-12%
      break;
    case 'HIGH':
      baseStopLoss = hasVolatilitySignals ? 0.08 : 0.06;   // 6-8%
      baseTakeProfit = hasVolatilitySignals ? 0.16 : 0.12; // 12-16%
      break;
    default: // EXTREME
      baseStopLoss = hasVolatilitySignals ? 0.12 : 0.08;   // 8-12%
      baseTakeProfit = hasVolatilitySignals ? 0.24 : 0.16; // 16-24%
  }
  
  return {
    stopLossPercent: baseStopLoss,
    takeProfitPercent: baseTakeProfit
  };
};

/**
 * Estima precio base por símbolo (fallback cuando no hay datos)
 */
const estimateBasePriceBySymbol = (symbol: string): number => {
  const priceEstimates: Record<string, number> = {
    'AAPL': 175,
    'MSFT': 350,
    'GOOGL': 2800,
    'AMZN': 3200,
    'TSLA': 250,
    'NVDA': 450,
    'META': 320,
    'AMD': 140,
    'NFLX': 380,
    'CRM': 220
  };
  
  return priceEstimates[symbol.toUpperCase()] || 100; // Default $100
};
