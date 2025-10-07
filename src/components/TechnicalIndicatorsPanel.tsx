import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Volume2, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TechnicalIndicators {
  currentPrice?: number;
  rsi?: number;
  macd?: {
    macd?: number;
    signal?: number;
    histogram?: number;
    trend?: string;
  };
  bollingerBands?: {
    upperBand?: number;
    middleBand?: number;
    lowerBand?: number;
    position?: string;
  };
  trend?: {
    adx?: number;
    trendStrength?: string;
    trendDirection?: string;
  };
  volume?: {
    relativeVolume?: number;
    volumeSignal?: string;
  };
  movingAverages?: {
    sma20?: number;
    sma50?: number;
    overallTrend?: string;
  };
}

interface TechnicalIndicatorsPanelProps {
  indicators?: TechnicalIndicators;
  compact?: boolean;
}

const TechnicalIndicatorsPanel: React.FC<TechnicalIndicatorsPanelProps> = memo(({ 
  indicators, 
  compact = false 
}) => {
  if (!indicators) return null;

  const getRSIColor = (rsi?: number): string => {
    if (!rsi) return 'text-gray-500';
    if (rsi <= 30) return 'text-green-600';
    if (rsi >= 70) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getRSIBgColor = (rsi?: number): string => {
    if (!rsi) return 'bg-gray-100';
    if (rsi <= 30) return 'bg-green-100';
    if (rsi >= 70) return 'bg-red-100';
    return 'bg-yellow-100';
  };

  const getRSILabel = (rsi?: number): string => {
    if (!rsi) return 'N/A';
    if (rsi <= 30) return 'OVERSOLD';
    if (rsi >= 70) return 'OVERBOUGHT';
    return 'NEUTRAL';
  };

  const getMACDIcon = (trend?: string) => {
    if (trend?.toUpperCase() === 'BULLISH') return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (trend?.toUpperCase() === 'BEARISH') return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getMACDColor = (trend?: string): string => {
    if (trend?.toUpperCase() === 'BULLISH') return 'text-green-600';
    if (trend?.toUpperCase() === 'BEARISH') return 'text-red-600';
    return 'text-gray-600';
  };

  const getBBPositionColor = (position?: string): string => {
    if (position?.toUpperCase().includes('LOWER')) return 'text-green-600 bg-green-100';
    if (position?.toUpperCase().includes('UPPER')) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTrendIcon = (direction?: string) => {
    if (direction?.toUpperCase() === 'BULLISH') return <TrendingUp className="w-4 h-4" />;
    if (direction?.toUpperCase() === 'BEARISH') return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getTrendColor = (strength?: string): string => {
    if (strength?.toUpperCase() === 'STRONG') return 'text-blue-600 bg-blue-100';
    if (strength?.toUpperCase() === 'WEAK') return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getVolumeColor = (signal?: string): string => {
    if (signal?.toUpperCase() === 'HIGH') return 'text-orange-600 bg-orange-100';
    if (signal?.toUpperCase() === 'LOW') return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Versión compacta para vista detallada
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* RSI */}
        {indicators.rsi !== undefined && (
          <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${getRSIBgColor(indicators.rsi)}`}>
            <span className="font-semibold text-gray-700">RSI</span>
            <span className={`font-bold ${getRSIColor(indicators.rsi)}`}>
              {Math.round(indicators.rsi)}
            </span>
          </div>
        )}

        {/* MACD */}
        {indicators.macd?.trend && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-gray-100">
            <span className="font-semibold text-gray-700">MACD</span>
            <div className="flex items-center space-x-1">
              {getMACDIcon(indicators.macd.trend)}
              <span className={`font-bold ${getMACDColor(indicators.macd.trend)}`}>
                {indicators.macd.trend.substring(0, 4).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Trend */}
        {indicators.trend?.trendStrength && (
          <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${getTrendColor(indicators.trend.trendStrength)}`}>
            <span className="font-semibold text-gray-700">Trend</span>
            <div className="flex items-center space-x-1">
              {getTrendIcon(indicators.trend.trendDirection)}
              <span className="font-bold">
                {indicators.trend.trendStrength.substring(0, 4).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Volume */}
        {indicators.volume?.volumeSignal && (
          <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${getVolumeColor(indicators.volume.volumeSignal)}`}>
            <span className="font-semibold text-gray-700">Vol</span>
            <span className="font-bold">
              {indicators.volume.relativeVolume ? `${indicators.volume.relativeVolume.toFixed(1)}x` : indicators.volume.volumeSignal}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Versión completa para vista consolidada
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-2">
        <BarChart3 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-bold text-gray-700">Technical Indicators</span>
      </div>

      {/* RSI Gauge */}
      {indicators.rsi !== undefined && (
        <div className={`p-3 rounded-xl border-2 ${getRSIBgColor(indicators.rsi)} border-opacity-50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">RSI (Relative Strength Index)</span>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getRSIBgColor(indicators.rsi)} ${getRSIColor(indicators.rsi)}`}>
              {getRSILabel(indicators.rsi)}
            </span>
          </div>
          
          {/* RSI Bar */}
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                indicators.rsi <= 30 ? 'bg-green-500' :
                indicators.rsi >= 70 ? 'bg-red-500' :
                'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(indicators.rsi, 100)}%` }}
            />
            {/* Markers */}
            <div className="absolute left-[30%] top-0 w-0.5 h-full bg-gray-400" />
            <div className="absolute left-[70%] top-0 w-0.5 h-full bg-gray-400" />
          </div>
          
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600">0</span>
            <span className={`text-sm font-black ${getRSIColor(indicators.rsi)}`}>
              {Math.round(indicators.rsi)}
            </span>
            <span className="text-xs text-gray-600">100</span>
          </div>
        </div>
      )}

      {/* MACD */}
      {indicators.macd && (
        <div className="p-3 rounded-xl border-2 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">MACD (Moving Average Convergence Divergence)</span>
            <div className="flex items-center space-x-1">
              {getMACDIcon(indicators.macd.trend)}
              <span className={`text-xs font-bold ${getMACDColor(indicators.macd.trend)}`}>
                {indicators.macd.trend || 'NEUTRAL'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-gray-600">MACD</div>
              <div className="font-bold text-gray-900">{indicators.macd.macd?.toFixed(2) || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-600">Signal</div>
              <div className="font-bold text-gray-900">{indicators.macd.signal?.toFixed(2) || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-600">Histogram</div>
              <div className={`font-bold ${(indicators.macd.histogram || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {indicators.macd.histogram?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bollinger Bands + Trend + Volume en Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bollinger Bands */}
        {indicators.bollingerBands?.position && (
          <div className={`p-3 rounded-xl border-2 ${getBBPositionColor(indicators.bollingerBands.position)}`}>
            <div className="text-xs font-bold text-gray-700 mb-1">Bollinger Bands</div>
            <div className="text-sm font-black">
              {indicators.bollingerBands.position}
            </div>
            {indicators.currentPrice && indicators.bollingerBands.lowerBand && indicators.bollingerBands.upperBand && (
              <div className="text-xs text-gray-600 mt-1">
                {((indicators.currentPrice - indicators.bollingerBands.lowerBand) / 
                  (indicators.bollingerBands.upperBand - indicators.bollingerBands.lowerBand) * 100).toFixed(0)}% width
              </div>
            )}
          </div>
        )}

        {/* Trend Strength */}
        {indicators.trend?.trendStrength && (
          <div className={`p-3 rounded-xl border-2 ${getTrendColor(indicators.trend.trendStrength)}`}>
            <div className="text-xs font-bold text-gray-700 mb-1">Trend</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(indicators.trend.trendDirection)}
              <span className="text-sm font-black">{indicators.trend.trendStrength}</span>
            </div>
            {indicators.trend.adx && (
              <div className="text-xs text-gray-600 mt-1">ADX: {Math.round(indicators.trend.adx)}</div>
            )}
          </div>
        )}

        {/* Volume */}
        {indicators.volume && (
          <div className={`p-3 rounded-xl border-2 ${getVolumeColor(indicators.volume.volumeSignal)}`}>
            <div className="flex items-center space-x-1 mb-1">
              <Volume2 className="w-3 h-3 text-gray-700" />
              <span className="text-xs font-bold text-gray-700">Volume</span>
            </div>
            <div className="text-sm font-black">
              {indicators.volume.relativeVolume ? `${indicators.volume.relativeVolume.toFixed(1)}x` : indicators.volume.volumeSignal || 'NORMAL'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {indicators.volume.volumeSignal || 'Average'}
            </div>
          </div>
        )}

        {/* Moving Average Trend */}
        {indicators.movingAverages?.overallTrend && (
          <div className="p-3 rounded-xl border-2 bg-purple-100 border-purple-200">
            <div className="text-xs font-bold text-gray-700 mb-1">MA Trend</div>
            <div className="text-sm font-black text-purple-700">
              {indicators.movingAverages.overallTrend}
            </div>
            {indicators.movingAverages.sma20 && indicators.movingAverages.sma50 && (
              <div className="text-xs text-gray-600 mt-1">
                SMA20 {indicators.movingAverages.sma20 > indicators.movingAverages.sma50 ? '>' : '<'} SMA50
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si los indicadores cambiaron
  // Comparación profunda de indicadores clave
  const prevInd = prevProps.indicators;
  const nextInd = nextProps.indicators;
  
  if (!prevInd && !nextInd) return true; // Ambos null, no cambiar
  if (!prevInd || !nextInd) return false; // Uno null, cambiar
  
  return (
    prevInd.rsi === nextInd.rsi &&
    prevInd.macd?.trend === nextInd.macd?.trend &&
    prevInd.macd?.histogram === nextInd.macd?.histogram &&
    prevInd.currentPrice === nextInd.currentPrice &&
    prevInd.bollingerBands?.position === nextInd.bollingerBands?.position &&
    prevInd.trend?.trendStrength === nextInd.trend?.trendStrength &&
    prevInd.volume?.relativeVolume === nextInd.volume?.relativeVolume &&
    prevProps.compact === nextProps.compact
  );
});

TechnicalIndicatorsPanel.displayName = 'TechnicalIndicatorsPanel';

export default TechnicalIndicatorsPanel;
