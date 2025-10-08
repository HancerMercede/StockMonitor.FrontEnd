import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, Area, AreaChart } from 'recharts';
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
      {/* P&L Acumulado - Modernizado */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                P&L Acumulado
              </span>
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              plData.length > 0 && plData[plData.length - 1].pnl >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {plData.length > 0 ? `$${plData[plData.length - 1].pnl.toFixed(2)}` : '$0.00'}
            </div>
          </div>
          <p className="text-sm text-slate-600">Evolución de ganancias/pérdidas en el tiempo</p>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={plData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" strokeOpacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              stroke="#cbd5e1"
              axisLine={{ stroke: '#e0e7ff' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              stroke="#cbd5e1"
              axisLine={{ stroke: '#e0e7ff' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #e0e7ff', 
                borderRadius: '12px',
                fontSize: '13px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'pnl') {
                  return [`$${value}`, 'P&L Acumulado'];
                }
                return [value, name];
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}
              cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorPnl)"
              dot={{ fill: '#3b82f6', r: 3, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate por Símbolo - Modernizado */}
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Win Rate por Símbolo
              </span>
            </h3>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Top {winRateData.length}
            </div>
          </div>
          <p className="text-sm text-slate-600">Tasa de éxito por activo (mejores símbolos)</p>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={winRateData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" strokeOpacity={0.5} />
            <XAxis 
              dataKey="symbol" 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              stroke="#cbd5e1"
              axisLine={{ stroke: '#f3e8ff' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              stroke="#cbd5e1"
              axisLine={{ stroke: '#f3e8ff' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #f3e8ff', 
                borderRadius: '12px',
                fontSize: '13px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'winRate') {
                  return [`${value}%`, 'Win Rate'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `${label}`}
              cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
            />
            <Bar dataKey="winRate" radius={[12, 12, 0, 0]} maxBarSize={60}>
              {winRateData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={
                    entry.winRate >= 70 ? 'url(#colorGreen)' : 
                    entry.winRate >= 50 ? 'url(#colorBlue)' : 
                    entry.winRate >= 30 ? 'url(#colorYellow)' : 
                    'url(#colorRed)'
                  }
                />
              ))}
            </Bar>
            {/* Gradientes para las barras */}
            <defs>
              <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                <stop offset="100%" stopColor="#d97706" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
