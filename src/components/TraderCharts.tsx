import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { TradeHistoryItem, SymbolWinRate } from '../types';

interface TraderChartsProps {
  trades: TradeHistoryItem[];
  bestSymbols: SymbolWinRate[];
}

export default function TraderCharts({ trades, bestSymbols }: TraderChartsProps) {
  // Calcular P&L acumulado en el tiempo
  const plData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    // Ordenar trades por fecha de salida
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
    );
    
    let cumulativePL = 0;
    return sortedTrades.map((trade) => {
      cumulativePL += trade.profitLoss || 0;
      return {
        date: new Date(trade.exitDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        pnl: parseFloat(cumulativePL.toFixed(2)),
        symbol: trade.symbol,
        outcome: trade.outcome
      };
    });
  }, [trades]);

  // Preparar datos de win rate por símbolo
  const winRateData = useMemo(() => {
    return bestSymbols.slice(0, 8).map(s => ({
      symbol: s.symbol,
      winRate: parseFloat(s.winRate.toFixed(1)),
      count: s.count
    }));
  }, [bestSymbols]);

  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* P&L Acumulado */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            📈 P&L Acumulado
          </h3>
          <p className="text-sm text-slate-500">Evolución de ganancias/pérdidas en el tiempo</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={plData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'pnl') {
                  return [`$${value}`, 'P&L Acumulado'];
                }
                return [value, name];
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="pnl" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate por Símbolo */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            📊 Win Rate por Símbolo
          </h3>
          <p className="text-sm text-slate-500">Tasa de éxito por activo (top símbolos)</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={winRateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="symbol" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'winRate') {
                  return [`${value}%`, 'Win Rate'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
              {winRateData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.winRate >= 70 ? '#10b981' : 
                    entry.winRate >= 50 ? '#3b82f6' : 
                    entry.winRate >= 30 ? '#f59e0b' : 
                    '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
