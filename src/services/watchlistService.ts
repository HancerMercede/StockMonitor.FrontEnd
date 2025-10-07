import { apiClient } from '../utils/apiClient';
import { ENDPOINTS } from '../config/api';

export interface WatchlistItem {
  id: string;
  symbol: string;
  notes?: string;
  addedAt: string;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  currentCount: number;
  maxAllowed: number; // -1 = unlimited
  canAddMore: boolean;
}

export interface AddToWatchlistRequest {
  symbol: string;
  notes?: string;
}

class WatchlistService {
  /**
   * Obtener watchlist del usuario actual
   */
  async getMyWatchlist(): Promise<WatchlistResponse> {
    return apiClient.get<WatchlistResponse>(ENDPOINTS.WATCHLIST_MY);
  }

  /**
   * Agregar símbolo al watchlist
   */
  async addSymbol(request: AddToWatchlistRequest): Promise<{ message: string; item: WatchlistItem }> {
    return apiClient.post(ENDPOINTS.WATCHLIST_ADD, request);
  }

  /**
   * Eliminar símbolo del watchlist
   */
  async removeSymbol(id: string): Promise<{ message: string }> {
    return apiClient.delete(ENDPOINTS.WATCHLIST_REMOVE(id));
  }

  /**
   * Verificar si puede agregar más símbolos
   */
  async canAddMore(): Promise<{ canAdd: boolean }> {
    return apiClient.get(ENDPOINTS.WATCHLIST_CAN_ADD);
  }

  /**
   * Obtener solo los símbolos (sin detalles)
   */
  async getSymbols(): Promise<string[]> {
    return apiClient.get<string[]>(ENDPOINTS.WATCHLIST_SYMBOLS);
  }
}

export const watchlistService = new WatchlistService();
