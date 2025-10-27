import { API_CONFIG } from '../config/api';
import { apiClient } from '../utils/apiClient';
import type { TrackTradeRequest, PaginatedTradeHistory, TradeStatsSummary } from '../types';

export const tradeTrackingService = {
  async trackTrade(request: Omit<TrackTradeRequest, 'userId'>): Promise<{ id: string }> {
    return apiClient.post(API_CONFIG.ENDPOINTS.TRACK_TRADE, request);
  },

  async getHistory(
    symbol?: string, 
    from?: string, 
    to?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedTradeHistory> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const endpoint = `${API_CONFIG.ENDPOINTS.TRADE_HISTORY}?${params.toString()}`;
    return apiClient.get(endpoint);
  },

  async getStatsSummary(): Promise<TradeStatsSummary> {
    return apiClient.get(API_CONFIG.ENDPOINTS.TRADE_STATS_SUMMARY);
  },
};
