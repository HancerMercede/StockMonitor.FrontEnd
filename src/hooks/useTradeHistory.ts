import { useState, useEffect, useCallback } from 'react';
import { tradeTrackingService } from '../services/tradeTrackingService';
import type { TradeHistoryItem, TradeStatsSummary } from '../types';

export const useTradeHistory = (symbol?: string, from?: string, to?: string) => {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [stats, setStats] = useState<TradeStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trades y stats por separado para mejor manejo de errores
      try {
        const tradesData = await tradeTrackingService.getHistory(symbol, from, to);
        setTrades(tradesData);
      } catch (tradeError) {
        console.error('Error fetching trades:', tradeError);
      }

      try {
        const statsData = await tradeTrackingService.getStatsSummary();
        setStats(statsData);
      } catch (statsError) {
        console.error('Error fetching stats:', statsError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
      console.error('Error fetching trade history:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    trades,
    stats,
    loading,
    error,
    refresh,
    refetch: refresh
  };
};
