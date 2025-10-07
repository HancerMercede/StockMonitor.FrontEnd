import { useState, useEffect, useCallback, useRef } from 'react';
import type { Alert, DashboardStatus, AlertStats } from '../types';
import { useSignalR } from './useSignalR';

// Mock data con formato real del backend
const mockAlerts: Alert[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: '4', // RSI_Overbought
    message: '🔴 AAPL: RSI Overbought at 73.45 - Potential Sell Signal',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '2',
    symbol: 'AAPL',
    type: '6', // MACD_Bullish
    message: '📈 AAPL: MACD Bullish Signal - MACD: 2.4567 | TF_LONG_BULLISH (M4:BULLISH, H8:BULLISH, D1:BULLISH)',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '3',
    symbol: 'AAPL',
    type: '26', // Trend_Strong
    message: '📊 Strong Uptrend AAPL: ADX 28.76 | TF Confluence: STRONG_BULLISH (M4:BULLISH, H8:BULLISH, D1:BULLISH)',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '4',
    symbol: 'AAPL',
    type: '15', // Volume_Spike
    message: '📊 AAPL: High Volume Activity - RVOL: 3.25',
    priority: 'Medium',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '5',
    symbol: 'TSLA',
    type: '3', // RSI_Oversold
    message: '🟢 TSLA: RSI Oversold at 26.83 - Potential Buy Signal',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '6',
    symbol: 'TSLA',
    type: '6', // MACD_Bullish
    message: '📈 TSLA: MACD Bullish Signal - MACD: 1.8934',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '7',
    symbol: 'NVDA',
    type: '4', // RSI_Overbought
    message: '🔴 NVDA: RSI Overbought at 81.23 - Potential Sell Signal',
    priority: 'High',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
  },
  {
    id: '8',
    symbol: 'NVDA',
    type: '15', // Volume_Spike
    message: '📊 NVDA: High Volume Activity - RVOL: 4.67',
    priority: 'Medium',
    timestamp: new Date().toISOString(),
    source: 'StockMonitorAgent',
    isRead: false
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
  bySymbol: {
    'TSLA': 8,
    'AAPL': 6,
    'MSFT': 4,
    'NVDA': 10
  },
  byType: {
    'rsi_oversold': 12,
    'price_movement': 8,
    'volume_spike': 5,
    'macd_bullish': 3
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

export const useAlerts = (): UseAlertsReturn => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const fallbackIntervalRef = useRef<number | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Callbacks para SignalR
  const handleNewAlert = useCallback((newAlert: Alert) => {
    setAlerts(prevAlerts => {
      const exists = prevAlerts.some(alert => alert.id === newAlert.id);
      if (exists) return prevAlerts;
      return [newAlert, ...prevAlerts].slice(0, 50);
    });

    // Actualizar stats automáticamente
    setStats(prevStats => {
      if (!prevStats) return prevStats;
      
      return {
        ...prevStats,
        today: prevStats.today + 1,
        totalStored: prevStats.totalStored + 1,
        bySymbol: {
          ...prevStats.bySymbol,
          [newAlert.symbol]: (prevStats.bySymbol[newAlert.symbol] || 0) + 1
        },
        byType: {
          ...prevStats.byType,
          [newAlert.type]: (prevStats.byType[newAlert.type] || 0) + 1
        }
      };
    });
  }, []);

  const handleStatusUpdate = useCallback((newStatus: DashboardStatus) => {
    setStatus(newStatus);
  }, []);

  // Usar SignalR
  const { 
    isConnected: signalRConnected, 
    isConnecting: signalRConnecting, 
    error: signalRError 
  } = useSignalR(handleNewAlert, handleStatusUpdate);

  // Funciones fetch eliminadas e integradas en refreshData para evitar dependencias circulares

  const refreshData = useCallback(async () => {
    const now = Date.now();
    
    // Evitar múltiples llamadas muy rápidas
    if (now - lastFetchRef.current < 1000) return;
    
    lastFetchRef.current = now;
    
    if (!initialLoadComplete) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch directo sin dependencias para evitar loops
      const [alertsRes, statusRes, statsRes] = await Promise.all([
        fetch('/api/alert/recent'),
        fetch('/api/alert/status'),
        fetch('/api/alert/stats')
      ]);
      
      // Procesar alertas
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData && alertsData.length > 0 ? alertsData : mockAlerts);
      } else {
        setAlerts(mockAlerts);
      }
      
      // Procesar status
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      } else {
        setStatus(mockStatus);
      }
      
      // Procesar stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats(mockStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      setAlerts(mockAlerts);
      setStatus(mockStatus);
      setStats(mockStats);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [initialLoadComplete]); // Solo depender de initialLoadComplete

  // Configurar fallback polling cuando SignalR no está conectado
  const setupFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      window.clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    
    if (!signalRConnected && !signalRConnecting) {
      fallbackIntervalRef.current = window.setInterval(() => {
        // Crear función simple para evitar dependencias circulares
        const fetchData = async () => {
          try {
            const [alertsRes, statusRes, statsRes] = await Promise.all([
              fetch('/api/alert/recent'),
              fetch('/api/alert/status'),
              fetch('/api/alert/stats')
            ]);
            
            if (alertsRes.ok) {
              const alertsData = await alertsRes.json();
              if (alertsData && alertsData.length > 0) {
                setAlerts(alertsData);
              }
            }
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              setStatus(statusData);
            }
            
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats(statsData);
            }
            
          } catch (err) {
            // Silent fail
          }
        };
        
        fetchData();
      }, 600000); // 10 minutos (sincronizado con backend MonitoringIntervalMinutes)
    }
  }, [signalRConnected, signalRConnecting]);

  // Carga inicial
  useEffect(() => {
    refreshData();
  }, []);

  // Configurar fallback polling basado en estado de SignalR
  useEffect(() => {
    // Debounce para evitar múltiples cambios rápidos
    const timer = setTimeout(() => {
      setupFallbackPolling();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      if (fallbackIntervalRef.current) {
        window.clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [signalRConnected, signalRConnecting]); // Cambiar dependencias

  // Manejar errores de SignalR
  useEffect(() => {
    if (signalRError) {
      setError(`SignalR: ${signalRError}`);
    }
  }, [signalRError]);

  return {
    alerts,
    status,
    stats,
    loading,
    error,
    refresh: refreshData,
    signalRConnected,
    signalRConnecting
  };
};
