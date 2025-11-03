import { useState, useEffect, useCallback } from 'react';
import { tradeTrackingService } from '../services/tradeTrackingService';
import type { TradeHistoryItem, TradeStatsSummary, PaginationInfo } from '../types';

export const useTradeHistory = (symbol?: string, from?: string, to?: string) => {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [stats, setStats] = useState<TradeStatsSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Normalizar parámetros para evitar re-renders innecesarios
  const normalizedSymbol = symbol || undefined;
  const normalizedFrom = from || undefined;
  const normalizedTo = to || undefined;

  // Fetch stats solo al inicio o cuando se hace refresh completo
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await tradeTrackingService.getStatsSummary();
      setStats(statsData);
    } catch (statsError) {
      console.error('Error fetching stats:', statsError);
    }
  }, []);

  // Fetch trades solo (para paginación) - no cambia loading para no ocultar todo
  const fetchTrades = useCallback(async (page: number, pageSize: number) => {
    try {
      setError(null);
      const response = await tradeTrackingService.getHistory(normalizedSymbol, normalizedFrom, normalizedTo, page, pageSize);
      setTrades(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar trades');
      console.error('Error fetching trades:', err);
    }
  }, [normalizedSymbol, normalizedFrom, normalizedTo]);

  // Fetch completo (trades + stats) - solo para inicialización o refresh
  const fetchAll = useCallback(async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const [response] = await Promise.all([
        tradeTrackingService.getHistory(normalizedSymbol, normalizedFrom, normalizedTo, page, pageSize),
        fetchStats()
      ]);
      
      setTrades(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
      console.error('Error fetching trade history:', err);
    } finally {
      setLoading(false);
    }
  }, [normalizedSymbol, normalizedFrom, normalizedTo, fetchStats]);

  // Cargar datos cuando cambien los filtros de fecha
  useEffect(() => {
    fetchAll(1, 10);
  }, [fetchAll]);

  const goToPage = useCallback((page: number) => {
    // Solo fetch trades, no stats
    fetchTrades(page, pagination.pageSize);
  }, [fetchTrades, pagination.pageSize]);

  const changePageSize = useCallback((pageSize: number) => {
    // Solo fetch trades, no stats
    fetchTrades(1, pageSize);
  }, [fetchTrades]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchTrades(pagination.currentPage + 1, pagination.pageSize);
    }
  }, [pagination, fetchTrades]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      fetchTrades(pagination.currentPage - 1, pagination.pageSize);
    }
  }, [pagination, fetchTrades]);

  // Refresh completo (trades + stats)
  const refresh = useCallback(() => {
    fetchAll(pagination.currentPage, pagination.pageSize);
  }, [fetchAll, pagination.currentPage, pagination.pageSize]);

  return {
    trades,
    stats,
    pagination,
    loading,
    error,
    goToPage,
    changePageSize,
    nextPage,
    previousPage,
    refresh,
    refetch: refresh
  };
};
