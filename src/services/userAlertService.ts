import { API_CONFIG } from '../config/api';
import { apiClient } from '../utils/apiClient';
import type { UserAlert, UserAlertStats } from '../types';

export const userAlertService = {
  /**
   * Obtiene las alertas del usuario autenticado
   */
  async getMyAlerts(limit: number = 50): Promise<UserAlert[]> {
    return apiClient.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_ALERTS_MY(limit)}`);
  },

  /**
   * Obtiene las alertas no leídas
   */
  async getUnreadAlerts(): Promise<UserAlert[]> {
    return apiClient.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_ALERTS_UNREAD}`);
  },

  /**
   * Obtiene las estadísticas de uso de alertas
   */
  async getAlertStats(): Promise<UserAlertStats> {
    return apiClient.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_ALERTS_STATS}`);
  },

  /**
   * Marca una alerta como leída
   */
  async markAsRead(alertId: string): Promise<{ message: string }> {
    return apiClient.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_ALERTS_MARK_READ(alertId)}`, {});
  },

  /**
   * Marca/desmarca una alerta como favorita
   */
  async toggleStar(alertId: string): Promise<{ message: string }> {
    return apiClient.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_ALERTS_TOGGLE_STAR(alertId)}`, {});
  },

  /**
   * Obtiene las alertas de símbolos del watchlist del usuario (alertas personalizadas)
   */
  async getWatchlistAlerts(limit: number = 50): Promise<{ alerts: UserAlert[], watchlistSymbols: string[], totalInWatchlist: number, message?: string }> {
    return apiClient.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_ALERTS_WATCHLIST(limit)}`);
  },
};
