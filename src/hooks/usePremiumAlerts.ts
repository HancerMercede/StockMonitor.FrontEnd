import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';

export interface PremiumAlert {
  id: string;
  symbol: string;
  type: string;
  message: string;
  timestamp: string;
  currentPrice?: number;
  changePercent?: number;
  volume?: number;
  volumeMultiplier?: number;
  rsiValue?: number;
  macdValue?: number;
  macdSignal?: number;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  adxValue?: number;
  smaValue?: number;
  emaValue?: number;
  priority: string;
  confluence?: string;
  qualityScore: number;
  source: string;
  createdAt: string;
}

export const usePremiumAlerts = (from?: string, to?: string, symbol?: string) => {
  const [alerts, setAlerts] = useState<PremiumAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (symbol) params.append('symbol', symbol);
      
      const endpoint = `/alert/history${params.toString() ? `?${params}` : ''}`;
      const data = await apiClient.get<PremiumAlert[]>(endpoint);

      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alertas premium');
      console.error('Error fetching premium alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to, symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    alerts,
    loading,
    error,
    refresh
  };
};
