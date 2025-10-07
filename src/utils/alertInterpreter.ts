interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  reasoning: string;
  technicalBasis: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  targetPrice?: number;
  stopLoss?: number;
}

export const interpretAlert = (alert: any): TradingSignal => {
  const alertType = String(alert.type || '').toLowerCase();
  const message = String(alert.message || '').toLowerCase();
  const symbol = alert.symbol || 'Unknown';
  
  // Extract confluence info if available
  const confluenceMatch = message.match(/tf confluence: (\w+)/);
  const confluence = confluenceMatch ? confluenceMatch[1] : 'NEUTRAL';
  
  // RSI-based signals
  if (alertType.includes('rsi_oversold') || message.includes('rsi') && message.includes('below 30')) {
    return {
      action: 'BUY',
      strength: confluence === 'BULLISH' ? 'STRONG' : 'MODERATE',
      reasoning: `${symbol} is oversold with RSI below 30. Potential bounce opportunity.`,
      technicalBasis: ['RSI Oversold', 'Mean Reversion Setup'],
      riskLevel: confluence === 'BULLISH' ? 'MEDIUM' : 'HIGH',
      timeframe: 'Short to Medium Term (1-5 days)',
    };
  }
  
  if (alertType.includes('rsi_overbought') || message.includes('rsi') && message.includes('above 70')) {
    return {
      action: 'SELL',
      strength: confluence === 'BEARISH' ? 'STRONG' : 'MODERATE',
      reasoning: `${symbol} is overbought with RSI above 70. Consider taking profits or shorting.`,
      technicalBasis: ['RSI Overbought', 'Potential Reversal'],
      riskLevel: confluence === 'BEARISH' ? 'MEDIUM' : 'HIGH',
      timeframe: 'Short Term (1-3 days)',
    };
  }
  
  // MACD signals
  if (alertType.includes('macd_bullish') || message.includes('macd') && message.includes('bullish')) {
    return {
      action: 'BUY',
      strength: confluence === 'BULLISH' ? 'STRONG' : 'MODERATE',
      reasoning: `${symbol} shows bullish MACD crossover. Momentum is turning positive.`,
      technicalBasis: ['MACD Bullish Crossover', 'Momentum Shift'],
      riskLevel: 'MEDIUM',
      timeframe: 'Medium Term (5-15 days)',
    };
  }
  
  if (alertType.includes('macd_bearish') || message.includes('macd') && message.includes('bearish')) {
    return {
      action: 'SELL',
      strength: confluence === 'BEARISH' ? 'STRONG' : 'MODERATE',
      reasoning: `${symbol} shows bearish MACD crossover. Momentum is turning negative.`,
      technicalBasis: ['MACD Bearish Crossover', 'Momentum Decline'],
      riskLevel: 'MEDIUM',
      timeframe: 'Medium Term (5-15 days)',
    };
  }
  
  // Bollinger Bands
  if (message.includes('bollinger') && message.includes('bullish')) {
    return {
      action: 'BUY',
      strength: 'MODERATE',
      reasoning: `${symbol} shows bullish Bollinger Band divergence. Price may break higher.`,
      technicalBasis: ['Bollinger Band Squeeze', 'Volatility Breakout Setup'],
      riskLevel: 'MEDIUM',
      timeframe: 'Medium Term (3-10 days)',
    };
  }
  
  if (message.includes('bollinger') && message.includes('bearish')) {
    return {
      action: 'SELL',
      strength: 'MODERATE',
      reasoning: `${symbol} shows bearish Bollinger Band divergence. Price may break lower.`,
      technicalBasis: ['Bollinger Band Squeeze', 'Volatility Breakdown'],
      riskLevel: 'MEDIUM',
      timeframe: 'Medium Term (3-10 days)',
    };
  }
  
  // Volume signals
  if (alertType.includes('volume_spike') || message.includes('volume')) {
    const action = confluence === 'BULLISH' ? 'BUY' : confluence === 'BEARISH' ? 'SELL' : 'WATCH';
    return {
      action,
      strength: 'MODERATE',
      reasoning: `${symbol} has unusual volume activity. ${action === 'WATCH' ? 'Monitor for direction.' : 'Strong interest detected.'}`,
      technicalBasis: ['Volume Spike', 'Institutional Interest'],
      riskLevel: action === 'WATCH' ? 'MEDIUM' : 'LOW',
      timeframe: 'Short Term (1-3 days)',
    };
  }
  
  // Simple signals
  if (message.includes('simple signal buy') || message.includes('buy signal')) {
    return {
      action: 'BUY',
      strength: confluence === 'BULLISH' ? 'STRONG' : 'MODERATE',
      reasoning: `${symbol} technical analysis suggests buying opportunity.`,
      technicalBasis: ['Multiple Technical Indicators', 'Simple Signal Algorithm'],
      riskLevel: 'MEDIUM',
      timeframe: 'Medium Term (5-10 days)',
    };
  }
  
  if (message.includes('simple signal sell') || message.includes('sell signal')) {
    return {
      action: 'SELL',
      strength: confluence === 'BEARISH' ? 'STRONG' : 'MODERATE',
      reasoning: `${symbol} technical analysis suggests selling opportunity.`,
      technicalBasis: ['Multiple Technical Indicators', 'Simple Signal Algorithm'],
      riskLevel: 'MEDIUM',
      timeframe: 'Medium Term (5-10 days)',
    };
  }
  
  // Default case
  return {
    action: 'WATCH',
    strength: 'WEAK',
    reasoning: `${symbol} shows technical activity. Monitor for clearer signals.`,
    technicalBasis: ['Technical Alert Generated'],
    riskLevel: 'LOW',
    timeframe: 'Monitor',
  };
};

export const getActionColor = (action: string, strength: string) => {
  switch (action) {
    case 'BUY':
      return strength === 'STRONG' 
        ? 'bg-green-500 text-white' 
        : 'bg-green-100 text-green-800';
    case 'SELL':
      return strength === 'STRONG' 
        ? 'bg-red-500 text-white' 
        : 'bg-red-100 text-red-800';
    case 'WATCH':
      return 'bg-yellow-100 text-yellow-800';
    case 'HOLD':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return 'text-green-600';
    case 'MEDIUM':
      return 'text-yellow-600';
    case 'HIGH':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};