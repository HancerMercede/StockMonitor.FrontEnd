// Environment-based configuration
const isDevelopment = import.meta.env.DEV;

// Base URLs
export const API_CONFIG = {
  // Backend API
  BASE_URL: isDevelopment 
    ? 'https://localhost:7150/api'
    : import.meta.env.VITE_API_URL || 'https://api.stockmonitor.com/api',
  
  // SignalR Hub
  SIGNALR_URL: isDevelopment
    ? 'https://localhost:7150/hubs/alerts'
    : import.meta.env.VITE_SIGNALR_URL || 'https://api.stockmonitor.com/hubs/alerts',
  
  // Timeout settings
  TIMEOUT: 10000,
  
  // Frontend Routes
  ROUTES: {
    SUBSCRIPTION_SUCCESS: '/subscription/success',
    SUBSCRIPTION_MANAGE: '/subscription',
  },
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VALIDATE_TOKEN: '/auth/validate',
    SESSION: (userId: string) => `/user/${userId}/session`,
    
    // User
    USER: (id: string) => `/user/${id}`,
    
    // Watchlist (el userId viene del JWT token)
    WATCHLIST_MY: '/watchlist/my',
    WATCHLIST_ADD: '/watchlist/add',
    WATCHLIST_REMOVE: (id: string) => `/watchlist/${id}`,
    WATCHLIST_CAN_ADD: '/watchlist/can-add',
    WATCHLIST_SYMBOLS: '/watchlist/symbols',
    
    // Alerts
    ALERT_RECENT: '/alert/recent',
    ALERT_STATUS: '/alert/status',
    ALERT_STATS: '/alert/stats',
    ALERT_HISTORY: '/alert/history',
    ACTIVE_ALERTS: '/alert/active',
    USER_ALERTS: (userId: string, limit = 50) => `/alert/user/${userId}?limit=${limit}`,
    UNREAD_ALERTS: (userId: string) => `/alert/user/${userId}/unread`,
    MARK_AS_READ: (userId: string, alertId: string) => `/alert/user/${userId}/alert/${alertId}/read`,
    DISMISS_ALERT: (userId: string, alertId: string) => `/alert/user/${userId}/alert/${alertId}/dismiss`,
    TEST_ALERT: '/alert/test',
    
    // Statistics
    STATS: '/stats',
    USER_STATS: (userId: string) => `/stats/user/${userId}`,
    
    // Trade Tracking
    TRACK_TRADE: '/trades/track',
    TRADE_HISTORY: '/trades/history',
    TRADE_STATS_SUMMARY: '/trades/stats/summary',
    
    // Subscriptions
    SUBSCRIPTION_TIERS: '/subscriptions/tiers',
    SUBSCRIPTION_CURRENT: '/subscriptions/current',
    SUBSCRIPTION_CHANGE: '/subscriptions/change',
    SUBSCRIPTION_CAN_TRACK: '/subscriptions/can-track',
    SUBSCRIPTION_CAN_RECEIVE_ALERTS: '/subscriptions/can-receive-alerts',
    
    // User Alerts (con límites por plan)
    USER_ALERTS_MY: (limit = 50) => `/user-alerts?limit=${limit}`,
    USER_ALERTS_UNREAD: '/user-alerts/unread',
    USER_ALERTS_STATS: '/user-alerts/stats',
    USER_ALERTS_MARK_READ: (alertId: string) => `/user-alerts/${alertId}/read`,
    USER_ALERTS_TOGGLE_STAR: (alertId: string) => `/user-alerts/${alertId}/star`,
    USER_ALERTS_WATCHLIST: (limit = 50) => `/user-alerts/watchlist-alerts?limit=${limit}`,
    
    // Stripe Payments
    STRIPE_CHECKOUT: '/payments/checkout',
    STRIPE_SUBSCRIPTION_ACTIVE: '/payments/subscriptions/active',
    STRIPE_SUBSCRIPTION_CANCEL: '/payments/subscriptions/cancel',
    
    // Admin Dashboard
    ADMIN_OVERVIEW: '/admin/overview',
    ADMIN_USERS_GROWTH: (days = 30) => `/admin/stats/users-growth?days=${days}`,
    ADMIN_WIN_RATE_BY_SYMBOL: (days = 30) => `/admin/stats/win-rate-by-symbol?days=${days}`,
    ADMIN_STRIPE_SUBSCRIPTIONS: (status?: string) => 
      status ? `/admin/stripe/subscriptions?status=${status}` : '/admin/stripe/subscriptions',
    ADMIN_REVENUE_METRICS: (days = 30) => `/admin/stripe/revenue-metrics?days=${days}`,
    ADMIN_CHANGE_USER_TIER: (userId: string) => `/admin/users/${userId}/change-tier`,
    ADMIN_USER_DETAILS: (userId: string) => `/admin/users/${userId}/details`,
  }
};

// Export individual configs for easy access
export const { BASE_URL, SIGNALR_URL, TIMEOUT, ROUTES, ENDPOINTS } = API_CONFIG;
