// Simple alert structure matching backend DashboardAlert
export interface Alert {
  id: string;
  symbol: string;
  type: string;
  message: string;
  timestamp: string;
  priority: string;
  source: string;
  isRead: boolean;
  value?: number;
  confidence?: number;
  qualityScore?: number;  // Quality score del backend (0-100)
  
  // ML Signal Scoring Fields
  mlConfidenceScore?: number;    // 0-100 score de calidad
  mlQualityRating?: 'A' | 'B' | 'C' | 'D';  // Calificación de calidad
  mlRecommendation?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';  // Recomendación ML
  mlReasons?: string[];          // Array de razones del score
  
  indicators?: {
    currentPrice?: number;
    rsi?: number;
    macd?: {
      macd?: number;
      signal?: number;
      histogram?: number;
      trend?: string;
    };
    bollingerBands?: {
      upperBand?: number;
      middleBand?: number;
      lowerBand?: number;
      position?: string;
    };
    trend?: {
      adx?: number;
      trendStrength?: string;
      trendDirection?: string;
    };
    volume?: {
      relativeVolume?: number;
      volumeSignal?: string;
    };
    movingAverages?: {
      sma20?: number;
      sma50?: number;
      overallTrend?: string;
    };
  };
}

// Dashboard status from backend
export interface DashboardStatus {
  status: string;
  timestamp: string;
  alertsToday: number;
  totalAlerts: number;
  isMonitoring: boolean;
}

// Alert stats from backend
export interface AlertStats {
  today: number;
  yesterday: number;
  bySymbol: Record<string, number>;
  byType: Record<string, number>;
  totalStored: number;
}

// Consolidated Alert Types
export type ConsolidatedRecommendation = 
  | 'STRONG_BUY' 
  | 'BUY' 
  | 'WEAK_BUY' 
  | 'WATCH' 
  | 'WEAK_SELL' 
  | 'SELL' 
  | 'STRONG_SELL';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type Priority = 1 | 2 | 3; // 1=Alta, 2=Media, 3=Baja
export type TimeFrame = 'Short Term (1-5 days)' | 'Medium Term (5-15 days)' | 'Long Term (10-30 days)';

export interface TechnicalSignal {
  type: string;
  description: string;
  weight: number;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface StepInstruction {
  step: number;
  action: string;
  details: string;
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
}

export interface TradingAction {
  actionText: string;           // 'COMPRA AHORA', 'VENDE HOY', 'ESPERA RETROCESO'
  urgency: 'INMEDIATA' | 'ALTA' | 'MEDIA' | 'BAJA';
  timing: string;              // 'Hoy', 'Esta semana', 'Próximos días'
  entryPrice?: number;         // Precio de entrada sugerido
  stopLoss?: number;           // Stop loss sugerido
  takeProfit?: number;         // Take profit sugerido
  positionSize?: string;       // '2-3%', 'Posición pequeña'
  stepByStepInstructions?: StepInstruction[];  // Instrucciones paso a paso
}

export interface ConsolidatedAlert {
  id: string;
  symbol: string;
  recommendation: ConsolidatedRecommendation;
  recommendationLevel: 'STRONG' | 'MODERATE' | 'WEAK' | 'NEUTRAL';
  riskLevel: RiskLevel;
  confidenceScore: number; // 0-100
  
  // TRADING ACTION - LA INFORMACIÓN MÁS IMPORTANTE
  tradingAction: TradingAction;
  
  // DATOS TÉCNICOS ESPECÍFICOS PARA TRADERS PROFESIONALES
  technicalIndicatorData: Record<string, any>;
  
  // Scoring breakdown
  bullishScore: number;
  bearishScore: number;
  neutralScore: number;
  
  // Categorized signals
  bullishSignals: TechnicalSignal[];
  bearishSignals: TechnicalSignal[];
  neutralSignals: TechnicalSignal[];
  
  // Analysis summary
  primaryReason: string;
  technicalSummary: string;
  timeFrame: TimeFrame;
  
  // Metadata
  alertCount: number;
  lastUpdate: number;
  priority: Priority;
  
  // News Sentiment Analysis (DistilBERT)
  newsSentimentScore?: number;  // -1 to +1 (bearish to bullish)
  newsSentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  bullishPercent?: number;  // % of bullish articles
  bearishPercent?: number;  // % of bearish articles
  neutralPercent?: number;  // % of neutral articles
  newsHeadlines?: string[];  // Top headlines
  confluenceType?: 'CONFLUENCIA' | 'DIVERGENCIA';
  confluenceMessage?: string;
  totalNewsAnalyzed?: number;
  newsSentimentUpdatedAt?: string;
  
  // Raw data for reference
  rawAlerts: Alert[];
}

// Signal weighting configuration
export interface SignalWeight {
  weight: number;    // 0.1 - 2.0
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  priority: 'low' | 'medium' | 'high';
}

// Trade Tracking Types
export interface TrackTradeRequest {
  userId: string;
  alertId?: string;
  symbol: string;
  outcome: 'WINNER' | 'LOSER';
  entryDate: string; // ISO
  exitDate: string;  // ISO
  entryPrice?: number;
  exitPrice?: number;
  notes?: string;
}

export interface TradeHistoryItem {
  id: string;
  alertId?: string;
  symbol: string;
  outcome: string;
  entryDate: string;
  exitDate: string;
  entryPrice?: number;
  exitPrice?: number;
  daysHeld: number;
  profitLoss?: number;
  notes?: string;
  createdAt: string;
}

export interface SymbolWinRate {
  symbol: string;
  winRate: number;
  count: number;
}

export interface TradeStatsSummary {
  userId: string;
  total: number;
  winners: number;
  losers: number;
  winRate: number;
  avgDaysWinner: number;
  bestSymbols: SymbolWinRate[];
  worstSymbols: SymbolWinRate[];
  // Métricas avanzadas
  totalProfitLoss: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  currentStreak: number; // Positivo = winning streak, negativo = losing streak
}

// Subscription Types
export interface SubscriptionTier {
  id: string;
  name: 'Free' | 'Pro' | 'Premium';
  description: string;
  price: number;
  maxTrackingsPerMonth: number; // -1 = unlimited
  maxAlertsPerDay: number; // -1 = unlimited
  features: string[];
  isActive: boolean;
  // Access restrictions
  hasAccessToAlertHistory: boolean;
  hasAccessToTechnicalAnalysis: boolean;
}

export interface CurrentSubscription extends SubscriptionTier {
  usage: {
    tradesThisMonth: number;
    alertsToday: number;
    canTrackMore: boolean;
    canReceiveMore: boolean;
  };
}

export interface ChangeTierRequest {
  newTierId: string;
}

// User Alert Types (Sistema de límites por plan)
export interface UserAlert {
  id: string;
  userId: string;
  premiumAlertId: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  premiumAlert?: Alert; // Alert con datos completos
}

export interface UserAlertStats {
  alertsToday: number;
  maxAlertsPerDay: number;
  canReceiveMore: boolean;
  planName: string;
  usage: {
    tradesThisMonth: number;
    alertsToday: number;
    canTrackMore: boolean;
    canReceiveMore: boolean;
  };
}

// Stripe Payment Types
export interface CreateCheckoutRequest {
  tierId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface ActiveSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
  subscription: ActiveSubscription | null;
}

// ========== ADMIN DASHBOARD TYPES ==========

export interface UserMetrics {
  total: number;
  active: number;
  inactive: number;
  activePercentage: number;
  byTier: Record<string, number>;
}

export interface RevenueMetrics {
  mrr: number;
  projectedAnnual: number;
  proSubscribers: number;
  premiumSubscribers: number;
  activeStripeSubscriptions?: number;
  churnLast30Days?: number;
}

export interface TradeMetrics {
  period: string;
  total: number;
  winners: number;
  losers: number;
  winRate: number;
}

export interface AlertMetrics {
  period: string;
  totalGenerated: number;
  avgQualityScore: number;
  avgMLScore: number;
  withMLScore: number;
}

export interface SystemOverview {
  users: UserMetrics;
  revenue: RevenueMetrics;
  trades: TradeMetrics;
  alerts: AlertMetrics;
  timestamp: string;
}

export interface DailyGrowthData {
  date: string;
  newUsers: number;
  cumulative: number;
}

export interface UsersGrowthStats {
  period: string;
  data: DailyGrowthData[];
  totalNewUsers: number;
}

export interface SymbolStats {
  symbol: string;
  totalTrades: number;
  winners: number;
  losers: number;
  winRate: number;
}

export interface WinRateBySymbol {
  period: string;
  data: SymbolStats[];
}

export interface AdminStripeSubscription {
  subscriptionId: string;
  stripeSubscriptionId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  tier: {
    id: string;
    name: string;
    price: number;
  };
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  canceledAt?: string;
  endedAt?: string;
}

export interface StripeSubscriptionsResponse {
  total: number;
  subscriptions: AdminStripeSubscription[];
}

export interface RevenueMetricsDetailed {
  period: string;
  mrr: {
    current: number;
    projectedAnnual: number;
  };
  subscriptions: {
    active: number;
    new_: number;
    canceled: number;
    churnRate: number;
  };
  growth: {
    netNew: number;
    growthRate: number;
  };
}

export interface ChangeTierAdminRequest {
  tierId: string;
}

export interface AdminUserDetails {
  user: {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
    tierName: string;
    createdAt: string;
  };
  stripe: {
    hasCustomer: boolean;
    customerId?: string;
    hasActiveSubscription: boolean;
    subscription?: {
      id: string;
      status: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
    };
  };
  activity: {
    totalTrades: number;
    watchlistSymbols: number;
  };
}
