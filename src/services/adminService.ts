import { BASE_URL, ENDPOINTS } from '../config/api';
import { authService } from './authService';
import type {
  SystemOverview,
  UsersGrowthStats,
  WinRateBySymbol,
  StripeSubscriptionsResponse,
  RevenueMetricsDetailed,
  ChangeTierAdminRequest,
  AdminUserDetails,
} from '../types';

class AdminService {
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders(),
    };
  }

  /**
   * GET /api/admin/overview
   * Obtiene el overview general del sistema con métricas clave
   */
  async getSystemOverview(): Promise<SystemOverview> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_OVERVIEW}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get system overview' }));
      throw new Error(error.message || 'Failed to get system overview');
    }

    return response.json();
  }

  /**
   * GET /api/admin/stats/users-growth?days=30
   * Obtiene estadísticas de crecimiento de usuarios
   */
  async getUsersGrowthStats(days: number = 30): Promise<UsersGrowthStats> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_USERS_GROWTH(days)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get users growth stats' }));
      throw new Error(error.message || 'Failed to get users growth stats');
    }

    return response.json();
  }

  /**
   * GET /api/admin/stats/win-rate-by-symbol?days=30
   * Obtiene win rate por símbolo
   */
  async getWinRateBySymbol(days: number = 30): Promise<WinRateBySymbol> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_WIN_RATE_BY_SYMBOL(days)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get win rate stats' }));
      throw new Error(error.message || 'Failed to get win rate stats');
    }

    return response.json();
  }

  /**
   * GET /api/admin/stripe/subscriptions?status=active
   * Lista todas las suscripciones de Stripe con detalles
   */
  async getStripeSubscriptions(status?: string): Promise<StripeSubscriptionsResponse> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_STRIPE_SUBSCRIPTIONS(status)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get Stripe subscriptions' }));
      throw new Error(error.message || 'Failed to get Stripe subscriptions');
    }

    return response.json();
  }

  /**
   * GET /api/admin/stripe/revenue-metrics?days=30
   * Obtiene métricas detalladas de ingresos de Stripe
   */
  async getRevenueMetrics(days: number = 30): Promise<RevenueMetricsDetailed> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_REVENUE_METRICS(days)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get revenue metrics' }));
      throw new Error(error.message || 'Failed to get revenue metrics');
    }

    return response.json();
  }

  /**
   * POST /api/admin/users/{userId}/change-tier
   * Cambia manualmente el tier de un usuario (admin override)
   */
  async changeUserTier(userId: string, data: ChangeTierAdminRequest): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_CHANGE_USER_TIER(userId)}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to change user tier' }));
      throw new Error(error.message || 'Failed to change user tier');
    }

    return response.json();
  }

  /**
   * GET /api/admin/users/{userId}/details
   * Obtiene detalles completos de un usuario incluyendo suscripción Stripe
   */
  async getUserDetails(userId: string): Promise<AdminUserDetails> {
    const response = await fetch(`${BASE_URL}${ENDPOINTS.ADMIN_USER_DETAILS(userId)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get user details' }));
      throw new Error(error.message || 'Failed to get user details');
    }

    return response.json();
  }
}

export const adminService = new AdminService();
