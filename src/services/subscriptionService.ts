import { API_CONFIG } from '../config/api';
import { apiClient } from '../utils/apiClient';
import type { SubscriptionTier, CurrentSubscription, ChangeTierRequest } from '../types';

export const subscriptionService = {
  async getAllTiers(): Promise<SubscriptionTier[]> {
    return apiClient.get(API_CONFIG.ENDPOINTS.SUBSCRIPTION_TIERS);
  },

  async getCurrentTier(): Promise<CurrentSubscription> {
    return apiClient.get(API_CONFIG.ENDPOINTS.SUBSCRIPTION_CURRENT);
  },

  async changeTier(newTierId: string): Promise<{ message: string }> {
    return apiClient.post(API_CONFIG.ENDPOINTS.SUBSCRIPTION_CHANGE, { newTierId });
  },

  async canTrackTrades(): Promise<{ canTrack: boolean }> {
    return apiClient.get(API_CONFIG.ENDPOINTS.SUBSCRIPTION_CAN_TRACK);
  },

  async canReceiveAlerts(): Promise<{ canReceive: boolean }> {
    return apiClient.get(API_CONFIG.ENDPOINTS.SUBSCRIPTION_CAN_RECEIVE_ALERTS);
  },
};
