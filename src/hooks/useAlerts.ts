import { useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Alert, DashboardStatus, AlertStats, ConsolidatedAlert } from '../types';
import { useSignalR } from '../contexts/SignalRContext';
import { interpretAlert } from '../utils/alertInterpreter';
import { useConsolidatedAlerts } from './useConsolidatedAlerts';
import { apiClient } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

// Mock data con señales técnicas completas
const mockAlerts: Alert[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'RSI_Oversold',
    message: '🔴 AAPL: RSI Oversold at 28.43 - Strong Buy Signal',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 28.43,
    indicators: {
      currentPrice: 186.20,
      rsi: 28.43,
      macd: { macd: 2.15, signal: 1.30, histogram: 0.85, trend: 'Bullish' },
      bollingerBands: { upperBand: 192.50, middleBand: 186.20, lowerBand: 179.90, position: 'Lower' },
      trend: { adx: 32.5, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 1.89, volumeSignal: 'High' },
      movingAverages: { sma20: 184.50, sma50: 180.25, overallTrend: 'Bullish' }
    }
  },
  {
    id: '2',
    symbol: 'AAPL',
    type: 'MACD_Bullish',
    message: '📈 AAPL: MACD Bullish Signal - MACD: 2.15 crossed above signal',
    priority: 'High',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 2.15,
    indicators: {
      currentPrice: 186.20,
      rsi: 28.43,
      macd: { macd: 2.15, signal: 1.30, histogram: 0.85, trend: 'Bullish' },
      bollingerBands: { upperBand: 192.50, middleBand: 186.20, lowerBand: 179.90, position: 'Lower' },
      trend: { adx: 32.5, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 1.89, volumeSignal: 'High' },
      movingAverages: { sma20: 184.50, sma50: 180.25, overallTrend: 'Bullish' }
    }
  },
  {
    id: '3',
    symbol: 'AAPL',
    type: 'BollingerBands_Lower',
    message: '🎯 AAPL: Price touching Lower Bollinger Band at $179.90 - Support Level',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 179.90,
    indicators: {
      currentPrice: 186.20,
      rsi: 28.43,
      macd: { macd: 2.15, signal: 1.30, histogram: 0.85, trend: 'Bullish' },
      bollingerBands: { upperBand: 192.50, middleBand: 186.20, lowerBand: 179.90, position: 'Lower' },
      trend: { adx: 32.5, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 1.89, volumeSignal: 'High' },
      movingAverages: { sma20: 184.50, sma50: 180.25, overallTrend: 'Bullish' }
    }
  },
  {
    id: '4',
    symbol: 'AAPL',
    type: 'Volume_Spike',
    message: '⚡ AAPL: High Volume Activity - RVOL: 1.89x average',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 1.89,
    indicators: {
      currentPrice: 186.20,
      rsi: 28.43,
      macd: { macd: 2.15, signal: 1.30, histogram: 0.85, trend: 'Bullish' },
      bollingerBands: { upperBand: 192.50, middleBand: 186.20, lowerBand: 179.90, position: 'Lower' },
      trend: { adx: 32.5, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 1.89, volumeSignal: 'High' },
      movingAverages: { sma20: 184.50, sma50: 180.25, overallTrend: 'Bullish' }
    }
  },
  {
    id: '5',
    symbol: 'AAPL',
    type: 'ADX_Strong',
    message: '💪 AAPL: Strong Uptrend - ADX: 32.5 indicates powerful trend',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 480000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 32.5,
    indicators: {
      currentPrice: 186.20,
      rsi: 28.43,
      macd: { macd: 2.15, signal: 1.30, histogram: 0.85, trend: 'Bullish' },
      bollingerBands: { upperBand: 192.50, middleBand: 186.20, lowerBand: 179.90, position: 'Lower' },
      trend: { adx: 32.5, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 1.89, volumeSignal: 'High' },
      movingAverages: { sma20: 184.50, sma50: 180.25, overallTrend: 'Bullish' }
    }
  },
  // TSLA - Señal de VENTA (Overbought)
  {
    id: '6',
    symbol: 'TSLA',
    type: 'RSI_Overbought',
    message: '🔴 TSLA: RSI Overbought at 76.82 - Strong Sell Signal',
    priority: 'High',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 76.82,
    indicators: {
      currentPrice: 242.50,
      rsi: 76.82,
      macd: { macd: -1.85, signal: -0.95, histogram: -0.90, trend: 'Bearish' },
      bollingerBands: { upperBand: 248.30, middleBand: 242.50, lowerBand: 236.70, position: 'Upper' },
      trend: { adx: 28.3, trendStrength: 'Moderate', trendDirection: 'Down' },
      volume: { relativeVolume: 1.45, volumeSignal: 'Elevated' },
      movingAverages: { sma20: 245.80, sma50: 248.20, overallTrend: 'Bearish' }
    }
  },
  {
    id: '7',
    symbol: 'TSLA',
    type: 'MACD_Bearish',
    message: '📉 TSLA: MACD Bearish Signal - MACD: -1.85 crossed below signal',
    priority: 'High',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: -1.85,
    indicators: {
      currentPrice: 242.50,
      rsi: 76.82,
      macd: { macd: -1.85, signal: -0.95, histogram: -0.90, trend: 'Bearish' },
      bollingerBands: { upperBand: 248.30, middleBand: 242.50, lowerBand: 236.70, position: 'Upper' },
      trend: { adx: 28.3, trendStrength: 'Moderate', trendDirection: 'Down' },
      volume: { relativeVolume: 1.45, volumeSignal: 'Elevated' },
      movingAverages: { sma20: 245.80, sma50: 248.20, overallTrend: 'Bearish' }
    }
  },
  {
    id: '8',
    symbol: 'TSLA',
    type: 'BollingerBands_Upper',
    message: '🎯 TSLA: Price touching Upper Bollinger Band at $248.30 - Resistance Level',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 248.30,
    indicators: {
      currentPrice: 242.50,
      rsi: 76.82,
      macd: { macd: -1.85, signal: -0.95, histogram: -0.90, trend: 'Bearish' },
      bollingerBands: { upperBand: 248.30, middleBand: 242.50, lowerBand: 236.70, position: 'Upper' },
      trend: { adx: 28.3, trendStrength: 'Moderate', trendDirection: 'Down' },
      volume: { relativeVolume: 1.45, volumeSignal: 'Elevated' },
      movingAverages: { sma20: 245.80, sma50: 248.20, overallTrend: 'Bearish' }
    }
  },
  // NVDA - Señales MIXTAS (WATCH - Observar)
  {
    id: '9',
    symbol: 'NVDA',
    type: 'BollingerBands_Squeeze',
    message: '⚡ NVDA: Bollinger Bands Squeeze - Low Volatility, Breakout Incoming',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 0,
    indicators: {
      currentPrice: 128.75,
      rsi: 52.30,
      macd: { macd: 0.25, signal: 0.22, histogram: 0.03, trend: 'Neutral' },
      bollingerBands: { upperBand: 131.20, middleBand: 128.75, lowerBand: 126.30, position: 'Middle' },
      trend: { adx: 18.5, trendStrength: 'Weak', trendDirection: 'Neutral' },
      volume: { relativeVolume: 0.85, volumeSignal: 'Low' },
      movingAverages: { sma20: 128.90, sma50: 128.65, overallTrend: 'Neutral' }
    }
  },
  {
    id: '10',
    symbol: 'NVDA',
    type: 'Volume_Spike',
    message: '📊 NVDA: Unusual Volume Activity - RVOL: 0.85x (Below Average)',
    priority: 'Low',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 0.85,
    indicators: {
      currentPrice: 128.75,
      rsi: 52.30,
      macd: { macd: 0.25, signal: 0.22, histogram: 0.03, trend: 'Neutral' },
      bollingerBands: { upperBand: 131.20, middleBand: 128.75, lowerBand: 126.30, position: 'Middle' },
      trend: { adx: 18.5, trendStrength: 'Weak', trendDirection: 'Neutral' },
      volume: { relativeVolume: 0.85, volumeSignal: 'Low' },
      movingAverages: { sma20: 128.90, sma50: 128.65, overallTrend: 'Neutral' }
    }
  },
  {
    id: '11',
    symbol: 'NVDA',
    type: 'Momentum_Bullish',
    message: '💡 NVDA: Slight Bullish Momentum Detected - Weak Signal',
    priority: 'Low',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 0,
    indicators: {
      currentPrice: 128.75,
      rsi: 52.30,
      macd: { macd: 0.25, signal: 0.22, histogram: 0.03, trend: 'Neutral' },
      bollingerBands: { upperBand: 131.20, middleBand: 128.75, lowerBand: 126.30, position: 'Middle' },
      trend: { adx: 18.5, trendStrength: 'Weak', trendDirection: 'Neutral' },
      volume: { relativeVolume: 0.85, volumeSignal: 'Low' },
      movingAverages: { sma20: 128.90, sma50: 128.65, overallTrend: 'Neutral' }
    }
  },
  // IBIT - iShares Bitcoin Trust (Bitcoin ETF) - Señal de COMPRA FUERTE
  {
    id: '12',
    symbol: 'IBIT',
    type: 'RSI_Oversold',
    message: '🔥 IBIT: RSI Oversold at 24.65 - Strong Buy Signal on Bitcoin ETF',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 24.65,
    indicators: {
      currentPrice: 43.85,
      rsi: 24.65,
      macd: { macd: 1.82, signal: 0.95, histogram: 0.87, trend: 'Bullish' },
      bollingerBands: { upperBand: 47.20, middleBand: 43.85, lowerBand: 40.50, position: 'Lower' },
      trend: { adx: 35.8, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 2.45, volumeSignal: 'Very High' },
      movingAverages: { sma20: 42.30, sma50: 41.15, overallTrend: 'Bullish' }
    }
  },
  {
    id: '13',
    symbol: 'IBIT',
    type: 'MACD_Bullish',
    message: '📈 IBIT: MACD Bullish Crossover - Strong Momentum on Bitcoin ETF',
    priority: 'High',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 1.82,
    indicators: {
      currentPrice: 43.85,
      rsi: 24.65,
      macd: { macd: 1.82, signal: 0.95, histogram: 0.87, trend: 'Bullish' },
      bollingerBands: { upperBand: 47.20, middleBand: 43.85, lowerBand: 40.50, position: 'Lower' },
      trend: { adx: 35.8, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 2.45, volumeSignal: 'Very High' },
      movingAverages: { sma20: 42.30, sma50: 41.15, overallTrend: 'Bullish' }
    }
  },
  {
    id: '14',
    symbol: 'IBIT',
    type: 'Volume_Spike',
    message: '⚡ IBIT: Massive Volume Spike - RVOL: 2.45x average - Institutional Interest',
    priority: 'High',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 2.45,
    indicators: {
      currentPrice: 43.85,
      rsi: 24.65,
      macd: { macd: 1.82, signal: 0.95, histogram: 0.87, trend: 'Bullish' },
      bollingerBands: { upperBand: 47.20, middleBand: 43.85, lowerBand: 40.50, position: 'Lower' },
      trend: { adx: 35.8, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 2.45, volumeSignal: 'Very High' },
      movingAverages: { sma20: 42.30, sma50: 41.15, overallTrend: 'Bullish' }
    }
  },
  {
    id: '15',
    symbol: 'IBIT',
    type: 'BollingerBands_Lower',
    message: '🎯 IBIT: Price at Lower Bollinger Band $40.50 - Strong Support Level',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 270000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 40.50,
    indicators: {
      currentPrice: 43.85,
      rsi: 24.65,
      macd: { macd: 1.82, signal: 0.95, histogram: 0.87, trend: 'Bullish' },
      bollingerBands: { upperBand: 47.20, middleBand: 43.85, lowerBand: 40.50, position: 'Lower' },
      trend: { adx: 35.8, trendStrength: 'Strong', trendDirection: 'Up' },
      volume: { relativeVolume: 2.45, volumeSignal: 'Very High' },
      movingAverages: { sma20: 42.30, sma50: 41.15, overallTrend: 'Bullish' }
    }
  },
  // ABTC - Ark 21Shares Bitcoin ETF - Señal de COMPRA MODERADA
  {
    id: '16',
    symbol: 'ABTC',
    type: 'RSI_Oversold',
    message: '🔵 ABTC: RSI Oversold at 32.20 - Buy Signal on Ark Bitcoin ETF',
    priority: 'High',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 32.20,
    indicators: {
      currentPrice: 68.45,
      rsi: 32.20,
      macd: { macd: 1.25, signal: 0.85, histogram: 0.40, trend: 'Bullish' },
      bollingerBands: { upperBand: 72.80, middleBand: 68.45, lowerBand: 64.10, position: 'Lower' },
      trend: { adx: 29.5, trendStrength: 'Moderate', trendDirection: 'Up' },
      volume: { relativeVolume: 1.85, volumeSignal: 'High' },
      movingAverages: { sma20: 66.90, sma50: 65.30, overallTrend: 'Bullish' }
    }
  },
  {
    id: '17',
    symbol: 'ABTC',
    type: 'MACD_Bullish',
    message: '📈 ABTC: MACD Bullish Signal - Momentum Building on Ark Bitcoin ETF',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 150000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 1.25,
    indicators: {
      currentPrice: 68.45,
      rsi: 32.20,
      macd: { macd: 1.25, signal: 0.85, histogram: 0.40, trend: 'Bullish' },
      bollingerBands: { upperBand: 72.80, middleBand: 68.45, lowerBand: 64.10, position: 'Lower' },
      trend: { adx: 29.5, trendStrength: 'Moderate', trendDirection: 'Up' },
      volume: { relativeVolume: 1.85, volumeSignal: 'High' },
      movingAverages: { sma20: 66.90, sma50: 65.30, overallTrend: 'Bullish' }
    }
  },
  {
    id: '18',
    symbol: 'ABTC',
    type: 'Volume_Spike',
    message: '⚡ ABTC: High Volume Activity - RVOL: 1.85x - Strong Interest in Bitcoin ETF',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 260000).toISOString(),
    source: 'StockMonitorAgent',
    isRead: false,
    value: 1.85,
    indicators: {
      currentPrice: 68.45,
      rsi: 32.20,
      macd: { macd: 1.25, signal: 0.85, histogram: 0.40, trend: 'Bullish' },
      bollingerBands: { upperBand: 72.80, middleBand: 68.45, lowerBand: 64.10, position: 'Lower' },
      trend: { adx: 29.5, trendStrength: 'Moderate', trendDirection: 'Up' },
      volume: { relativeVolume: 1.85, volumeSignal: 'High' },
      movingAverages: { sma20: 66.90, sma50: 65.30, overallTrend: 'Bullish' }
    }
  }
];

const mockStatus: DashboardStatus = {
  isMonitoring: true,
  status: 'Active',
  timestamp: new Date().toISOString(),
  alertsToday: 5,
  totalAlerts: 28
};

const mockStats: AlertStats = {
  today: 5,
  yesterday: 3,
  totalStored: 28,
  bySymbol: { 'TSLA': 8, 'AAPL': 6, 'MSFT': 4, 'NVDA': 10 },
  byType: { 'rsi_oversold': 12, 'price_movement': 8, 'volume_spike': 5, 'macd_bullish': 3 }
};

// Query keys
export const alertsKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertsKeys.all, 'list'] as const,
  list: () => [...alertsKeys.lists()] as const,
  status: () => [...alertsKeys.all, 'status'] as const,
  stats: () => [...alertsKeys.all, 'stats'] as const,
};

// Fetch functions
const fetchAlerts = async (): Promise<Alert[]> => {
  try {
    const data = await apiClient.get<Alert[]>('/api/alert/recent');
    return data && data.length > 0 ? data : mockAlerts;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return mockAlerts;
  }
};

const fetchStatus = async (): Promise<DashboardStatus> => {
  try {
    // Status y stats son públicos, no requieren auth
    const res = await fetch('/api/alert/status');
    if (!res.ok) return mockStatus;
    return await res.json();
  } catch (error) {
    return mockStatus;
  }
};

const fetchStats = async (): Promise<AlertStats> => {
  try {
    // Status y stats son públicos, no requieren auth
    const res = await fetch('/api/alert/stats');
    if (!res.ok) return mockStats;
    return await res.json();
  } catch (error) {
    return mockStats;
  }
};

interface UseAlertsReturn {
  alerts: Alert[];
  status: DashboardStatus | null;
  stats: AlertStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signalRConnected: boolean;
  signalRConnecting: boolean;
}

// Helper: Muestra toast para cambios en recomendaciones consolidadas
const showConsolidatedRecommendationToast = (alert: ConsolidatedAlert) => {
  const isBuy = alert.recommendation.includes('BUY');
  const isSell = alert.recommendation.includes('SELL');
  const isStrong = alert.recommendationLevel === 'STRONG';
  
  // Determinar icon y color
  const icon = isBuy ? '📈' : isSell ? '📉' : '👁️';
  const actionColor = isBuy ? '#10b981' : isSell ? '#ef4444' : '#f59e0b';
  
  // Texto de la acción
  const actionMap: Record<string, string> = {
    'STRONG_BUY': 'COMPRA FUERTE',
    'BUY': 'COMPRA',
    'WEAK_BUY': 'Compra Débil',
    'STRONG_SELL': 'VENTA FUERTE',
    'SELL': 'VENTA',
    'WEAK_SELL': 'Venta Débil',
    'WATCH': 'OBSERVAR'
  };
  
  const actionText = actionMap[alert.recommendation] || alert.recommendation;
  
  toast.success(
    `${icon} ${alert.symbol} - ${actionText} (${alert.confidenceScore}%)`,
    {
      duration: isStrong ? 10000 : 7000, // Más tiempo para señales fuertes
      style: {
        background: actionColor,
        color: '#fff',
        fontWeight: '600',
        fontSize: '15px',
        padding: '16px',
      },
      icon: icon,
      iconTheme: {
        primary: '#fff',
        secondary: actionColor,
      },
    }
  );
  
  // Sonido para cambios importantes
  if (isStrong || alert.confidenceScore >= 70) {
    playNotificationSound();
  }
};

// Helper: Reproduce sonido de notificación (navegador puede bloquearlo)
const playNotificationSound = () => {
  try {
    // Usando Web Audio API para un beep suave
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar sonido: frecuencia 800Hz, volumen bajo
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Navegador bloqueó el audio o no es compatible
    console.log('Audio notification blocked or not supported');
  }
};

// Helper: Solicitar y mostrar notificaciones del sistema operativo
const requestBrowserNotification = async (alert: Alert) => {
  try {
    // Solicitar permiso si aún no se ha pedido
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    // Si tenemos permiso, mostrar notificación del sistema
    if (Notification.permission === 'granted') {
      const notification = new Notification(`🔔 ${alert.symbol} - Alerta de Trading`, {
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: alert.symbol, // Agrupa notificaciones del mismo símbolo
        requireInteraction: false, // No requiere interacción para desaparecer
        silent: false,
      });
      
      // Opcional: Click en la notificación enfoca la ventana
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto-cerrar después de 8 segundos
      setTimeout(() => notification.close(), 8000);
    }
  } catch (error) {
    console.log('Browser notifications not supported or blocked:', error);
  }
};

export const useAlerts = (): UseAlertsReturn => {
  const queryClient = useQueryClient();
  
  // Track previous consolidated recommendations to detect changes
  const previousRecommendationsRef = useRef<Map<string, { 
    recommendation: string; 
    level: string; 
    confidence: number 
  }>>(new Map());

  // Verificar si el usuario está autenticado
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isAuthenticated = !!token;
  
  // 👍 MEJORA PROFESIONAL: Resetear queries cuando cambia autenticación
  const prevAuthRef = useRef(isAuthenticated);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Skip en el primer mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevAuthRef.current = isAuthenticated;
      return;
    }
    
    // Si cambió el estado de autenticación (login o logout)
    if (prevAuthRef.current !== isAuthenticated) {
      console.log('🔄 [useAlerts] Estado de auth cambió, limpiando datos antiguos...');
      
      if (!isAuthenticated) {
        // LOGOUT: Limpiar TODO
        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'alerts' });
        previousRecommendationsRef.current.clear();
        console.log('🧹 [useAlerts] Cache limpiado por logout');
      } else {
        // LOGIN: Solo resetear para refetch fresco
        queryClient.resetQueries({ predicate: (query) => query.queryKey[0] === 'alerts' });
        console.log('✨ [useAlerts] Cache reseteado por login');
      }
      
      prevAuthRef.current = isAuthenticated;
    }
  }, [isAuthenticated, queryClient]);
  // Queries con React Query - solo ejecutar si está autenticado
  const alertsQuery = useQuery({
    queryKey: alertsKeys.list(),
    queryFn: fetchAlerts,
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: isAuthenticated, // Solo ejecutar si está autenticado
    structuralSharing: true, // ✅ Reutiliza referencias de objetos que no cambiaron
  });
  
  // Get consolidated alerts to track recommendation changes
  const consolidatedAlerts = useConsolidatedAlerts(alertsQuery.data || []);
  
  // Monitor consolidated alerts for recommendation changes
  useEffect(() => {
    if (!consolidatedAlerts || consolidatedAlerts.length === 0) return;
    
    consolidatedAlerts.forEach((alert) => {
      const previous = previousRecommendationsRef.current.get(alert.symbol);
      const current = {
        recommendation: alert.recommendation,
        level: alert.recommendationLevel,
        confidence: alert.confidenceScore
      };
      
      // Si hay cambio significativo en la recomendación
      if (previous && previous.recommendation !== current.recommendation) {
        // Solo notificar cambios importantes
        const isSignificantChange = 
          // De WATCH a acción
          (previous.recommendation === 'WATCH' && 
           (current.recommendation.includes('BUY') || current.recommendation.includes('SELL'))) ||
          // Cambio de nivel (WEAK → STRONG, etc.)
          (previous.level !== current.level && current.confidence >= 60) ||
          // Cambio de dirección (BUY → SELL o viceversa)
          ((previous.recommendation.includes('BUY') && current.recommendation.includes('SELL')) ||
           (previous.recommendation.includes('SELL') && current.recommendation.includes('BUY')));
        
        // 🔇 Solo notificar si el usuario NO está viendo activamente el dashboard
        if (isSignificantChange && document.hidden) {
          showConsolidatedRecommendationToast(alert);
        }
      }
      
      // Actualizar referencia
      previousRecommendationsRef.current.set(alert.symbol, current);
    });
  }, [consolidatedAlerts]);

  const statusQuery = useQuery({
    queryKey: alertsKeys.status(),
    queryFn: fetchStatus,
    staleTime: 10 * 60 * 1000,
    structuralSharing: true,
  });

  const statsQuery = useQuery({
    queryKey: alertsKeys.stats(),
    queryFn: fetchStats,
    staleTime: 10 * 60 * 1000,
    structuralSharing: true,
  });
  
  // Callback cuando llega nueva alerta via SignalR
  const handleNewAlert = useCallback((newAlert: Alert) => {
    // ✅ Optimistic update: actualizar cache DIRECTAMENTE sin invalidar
    queryClient.setQueryData<Alert[]>(alertsKeys.list(), (old) => {
      if (!old) return [newAlert];
      const exists = old.some(alert => alert.id === newAlert.id);
      if (exists) return old;
      return [newAlert, ...old].slice(0, 100);  // Increased from 50 to 100 for better symbol coverage
    });

    // ✅ Actualizar stats DIRECTAMENTE sin invalidar (para evitar re-fetch)
    queryClient.setQueryData<AlertStats>(alertsKeys.stats(), (old) => {
      if (!old) return old; // Si no hay datos, no actualizar
      
      // Calcular nuevos valores
      const newToday = (old.today || 0) + 1;
      const newTotal = (old.totalStored || 0) + 1;
      const newSymbolCount = (old.bySymbol?.[newAlert.symbol] || 0) + 1;
      const newTypeCount = (old.byType?.[newAlert.type] || 0) + 1;
      
      // ✅ OPTIMIZACIÓN CRÍTICA: Solo actualizar si realmente cambió
      // Esto evita re-renders innecesarios cuando los valores son iguales
      if (
        old.today === newToday &&
        old.totalStored === newTotal &&
        old.bySymbol?.[newAlert.symbol] === newSymbolCount &&
        old.byType?.[newAlert.type] === newTypeCount
      ) {
        return old;  // ✅ Retornar la referencia anterior = NO re-render
      }
      
      return {
        ...old,
        today: newToday,
        totalStored: newTotal,
        bySymbol: {
          ...old.bySymbol,
          [newAlert.symbol]: newSymbolCount
        },
        byType: {
          ...old.byType,
          [newAlert.type]: newTypeCount
        }
      };
    });
    
    // 🔔 NOTIFICACIÓN SIMPLIFICADA: Solo mostrar símbolo y tipo de alerta
    // Las notificaciones consolidadas se manejan mejor en el dashboard
    // Solo notificar si el usuario NO está mirando activamente (documento hidden)
    if (document.hidden && newAlert.priority === 'High') {
      try {
        // Determinar acción básica del tipo de alerta
        const alertType = String(newAlert.type).toLowerCase();
        const isBullish = alertType.includes('bullish') || 
                         alertType.includes('oversold') || 
                         alertType.includes('lower') ||
                         alertType.includes('buy');
        const isBearish = alertType.includes('bearish') || 
                         alertType.includes('overbought') || 
                         alertType.includes('upper') ||
                         alertType.includes('sell');
        
        const icon = isBullish ? '📈' : isBearish ? '📉' : '🔔';
        const actionColor = isBullish ? '#10b981' : isBearish ? '#ef4444' : '#3b82f6';
        const actionText = isBullish ? 'Señal Alcista' : isBearish ? 'Señal Bajista' : 'Nueva Alerta';
        
        toast.success(
          `${icon} ${newAlert.symbol} - ${actionText}`,
          {
            duration: 6000,
            style: {
              background: actionColor,
              color: '#fff',
              fontWeight: '600',
            },
            icon: icon,
          }
        );
        
        playNotificationSound();
      } catch (error) {
        console.error('Error showing alert notification:', error);
      }
    }
    
    // Opcional: Browser Notification API para notificaciones del sistema
    // (fuera del navegador, en el sistema operativo)
    if (document.hidden && newAlert.priority === 'High' && 'Notification' in window) {
      requestBrowserNotification(newAlert);
    }
  }, [queryClient]);

  const handleStatusUpdate = useCallback((newStatus: DashboardStatus) => {
    // Update cache inmediatamente
    queryClient.setQueryData(alertsKeys.status(), newStatus);
  }, [queryClient]);

  // SignalR connection usando Context
  const { 
    isConnected: signalRConnected, 
    isConnecting: signalRConnecting, 
    error: signalRError,
    onNewAlert: subscribeToAlerts,
    onStatusUpdate: subscribeToStatus
  } = useSignalR();
  
  // Suscribirse a eventos de SignalR
  useEffect(() => {
    const unsubscribeAlerts = subscribeToAlerts(handleNewAlert);
    const unsubscribeStatus = subscribeToStatus(handleStatusUpdate);
    
    console.log('✅ [useAlerts] Suscrito a eventos SignalR');
    
    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      unsubscribeAlerts();
      unsubscribeStatus();
      console.log('🧹 [useAlerts] Desuscrito de eventos SignalR');
    };
  }, [subscribeToAlerts, subscribeToStatus, handleNewAlert, handleStatusUpdate]);
  
  // ✅ SOLUCIÓN: Refrescar alertas cuando el usuario vuelve a la pestaña
  // Esto asegura que las alertas consolidadas se recalculen correctamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Cuando el usuario vuelve a la pestaña (document.hidden = false)
      if (!document.hidden && isAuthenticated) {
        console.log('👁️ Usuario volvió - Refrescando alerts del servidor...');
        // Invalidar queries para forzar refetch fresco del servidor
        queryClient.invalidateQueries({ queryKey: alertsKeys.list() });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, isAuthenticated]);

  // Refresh manual - usa refetchQueries para mantener datos existentes
  const refresh = useCallback(async () => {
    // ✅ refetchQueries mantiene los datos actuales mientras hace el refetch
    // Esto preserva las alertas que llegaron por SignalR
    await Promise.all([
      queryClient.refetchQueries({ queryKey: alertsKeys.list() }),
      queryClient.refetchQueries({ queryKey: alertsKeys.status() }),
      queryClient.refetchQueries({ queryKey: alertsKeys.stats() }),
    ]);
  }, [queryClient]);

  // Estado combinado
  const loading = alertsQuery.isLoading || statusQuery.isLoading || statsQuery.isLoading;
  const error = alertsQuery.error?.message || statusQuery.error?.message || statsQuery.error?.message || signalRError || null;

  return {
    alerts: alertsQuery.data || [],
    status: statusQuery.data || null,
    stats: statsQuery.data || null,
    loading,
    error,
    refresh,
    signalRConnected,
    signalRConnecting,
  };
};
