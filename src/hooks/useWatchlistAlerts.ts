import { useQuery } from '@tanstack/react-query';
import { userAlertService } from '../services/userAlertService';
import { useAuth } from '../contexts/AuthContext';
import type { UserAlert } from '../types';

interface WatchlistAlertsData {
  alerts: UserAlert[];
  watchlistSymbols: string[];
  totalInWatchlist: number;
  message?: string;
}

interface UseWatchlistAlertsReturn {
  watchlistAlerts: UserAlert[];
  watchlistSymbols: string[];
  totalInWatchlist: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personalizado para gestionar las alertas del watchlist del usuario
 * Consume el endpoint de alertas personalizadas filtradas por watchlist
 * Usa TanStack Query con keepPreviousData para evitar parpadeos
 */
export const useWatchlistAlerts = (limit: number = 50): UseWatchlistAlertsReturn => {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error, refetch } = useQuery<WatchlistAlertsData>({
    queryKey: ['watchlistAlerts', limit],
    queryFn: () => userAlertService.getWatchlistAlerts(limit),
    // ✅ Solo hacer la petición si está autenticado
    enabled: isAuthenticated,
    // Mantener datos anteriores mientras se actualiza (evita parpadeo)
    placeholderData: (previousData) => previousData,
    // Refetch cada 30 segundos
    refetchInterval: 30000,
    // Mantener datos frescos por 20 segundos
    staleTime: 20000,
    // Cache por 5 minutos
    gcTime: 5 * 60 * 1000,
  });

  return {
    watchlistAlerts: data?.alerts || [],
    watchlistSymbols: data?.watchlistSymbols || [],
    totalInWatchlist: data?.totalInWatchlist || 0,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar alertas del watchlist') : null,
    refetch: async () => { await refetch(); }
  };
};
