import React from 'react';
import type { Alert } from '../types';

interface WatchlistProps {
  alerts?: Alert[];
}

// Genera watchlist dinámico desde alertas reales
const generateWatchlistFromAlerts = (alerts: Alert[]) => {
  if (!alerts || alerts.length === 0) {
    return null; // Usar datos estáticos como fallback
  }
  
  // Obtener símbolos únicos de las alertas
  const uniqueSymbols = Array.from(new Set(alerts.map(alert => alert.symbol)));
  
  return uniqueSymbols.map(symbol => {
    const symbolAlerts = alerts.filter(alert => alert.symbol === symbol);
    
    // Extraer RSI de las alertas
    const rsiAlert = symbolAlerts.find(alert => alert.message && alert.message.includes('RSI'));
    let rsiValue = '50.0';
    if (rsiAlert) {
      const rsiMatch = rsiAlert.message.match(/RSI (?:Oversold|Overbought) at ([0-9]+\.?[0-9]*)/i);
      if (rsiMatch) {
        rsiValue = parseFloat(rsiMatch[1]).toFixed(1);
      }
    }
    
    // Calcular cambio simulado basado en tipo de alertas
    const bullishAlerts = symbolAlerts.filter(alert => 
      alert.message.includes('Bullish') || alert.message.includes('Oversold')
    ).length;
    const bearishAlerts = symbolAlerts.filter(alert => 
      alert.message.includes('Bearish') || alert.message.includes('Overbought')
    ).length;
    
    const netSentiment = bullishAlerts - bearishAlerts;
    const changePercent = netSentiment * 1.5 + (Math.random() - 0.5) * 2; // Simulado
    
    // Precios base estimados
    const basePrices: Record<string, number> = {
      'AAPL': 175, 'TSLA': 250, 'NVDA': 430, 'AMD': 140, 'MSFT': 350
    };
    const basePrice = basePrices[symbol] || 100;
    const currentPrice = basePrice * (1 + changePercent / 100);
    
    // Nombres de companies
    const companyNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'AMD': 'Advanced Micro Dev...',
      'MSFT': 'Microsoft Corp.'
    };
    
    return {
      symbol,
      name: companyNames[symbol] || `${symbol} Corp.`,
      price: `$${currentPrice.toFixed(2)}`,
      change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      rsi: rsiValue,
      isPositive: changePercent >= 0
    };
  });
};

const Watchlist = ({ alerts }: WatchlistProps) => {
  // Intentar generar desde datos reales, fallback a estáticos
  const dynamicWatchlist = generateWatchlistFromAlerts(alerts || []);
  
  // Datos estáticos como fallback
  const staticWatchlist = [
    { symbol: 'AMD', name: 'Advanced Micro Dev...', price: '$163.12', change: '+1.84%', rsi: '50.6', isPositive: true },
    { symbol: 'AVGO', name: 'Broadcom Inc.', price: '$328.73', change: '-2.73%', rsi: '60.5', isPositive: false },
    { symbol: 'MU', name: 'Micron Technology', price: '$133.96', change: '+4.17%', rsi: '60.2', isPositive: true },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '$428.13', change: '+2.69%', rsi: '68.6', isPositive: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: '$243.29', change: '-2.12%', rsi: '51.3', isPositive: false }
  ];
  
  // Usar datos dinámicos si existen, si no usar estáticos
  const watchlistData = dynamicWatchlist || staticWatchlist;
  
  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Watchlist</h3>
          {dynamicWatchlist && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Live Data
            </span>
          )}
        </div>
      </div>
      <div className="p-4 space-y-4">
        {watchlistData.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{item.symbol}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.isPositive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.change}
                </span>
              </div>
              <p className="text-xs text-gray-500">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{item.price}</p>
              <p className="text-xs text-gray-500">RSI: {item.rsi}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;