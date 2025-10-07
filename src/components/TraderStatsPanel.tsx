import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Award, Target, Clock, BarChart3, Edit2, Zap, Activity } from 'lucide-react';
import { useTradeHistory } from '../hooks/useTradeHistory';
import EditTradeModal from './EditTradeModal';
import TraderCharts from './TraderCharts';

interface Props {
  onRefetchReady?: (refetch: () => void) => void;
}

export default function TraderStatsPanel({ onRefetchReady }: Props = {}) {
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'quarter' | 'all'>('all');
  const [editingTrade, setEditingTrade] = useState<any>(null);
  const { trades, stats, loading, error, refetch } = useTradeHistory();
  
  // Notificar al padre cuando refetch esté disponible
  React.useEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refetch);
    }
  }, [refetch, onRefetchReady]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
        <p className="font-semibold">Error al cargar estadísticas</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const winRate = stats ? stats.winRate : 0;
  const totalTrades = stats ? stats.total : 0;
  const winners = stats ? stats.winners : 0;
  const losers = stats ? stats.losers : 0;
  
  // Métricas avanzadas
  const totalPL = stats?.totalProfitLoss ?? 0;
  const avgWin = stats?.averageWin ?? 0;
  const avgLoss = stats?.averageLoss ?? 0;
  const profitFactor = stats?.profitFactor ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">📊 Mis Estadísticas de Trading</h1>
          <p className="text-white/90 font-medium mt-1">
            Performance y análisis de tus trades registrados
          </p>
        </div>
      </div>

      {/* Stats Cards - Fila 1 */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Trades */}
        <div className="bg-white rounded-xl p-5 border-2 border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold">
              Total Trades
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalTrades}</div>
          <div className="text-xs text-slate-500 mt-1">Trades registrados</div>
        </div>

        {/* Winners */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-700 uppercase tracking-wide font-semibold">
              Ganadores
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-black text-green-700">{winners}</div>
          <div className="text-xs text-green-600 mt-1">
            {totalTrades > 0 ? ((winners / totalTrades) * 100).toFixed(1) : 0}% del total
          </div>
        </div>

        {/* Losers */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-red-700 uppercase tracking-wide font-semibold">
              Perdedores
            </div>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700">{losers}</div>
          <div className="text-xs text-red-600 mt-1">
            {totalTrades > 0 ? ((losers / totalTrades) * 100).toFixed(1) : 0}% del total
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-blue-700 uppercase tracking-wide font-semibold">
              Win Rate
            </div>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700">{winRate.toFixed(1)}%</div>
          <div className="text-xs text-blue-600 mt-1">Tasa de éxito</div>
        </div>
      </div>

      {/* Stats Cards - Fila 2: Métricas Avanzadas */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className={`rounded-xl p-5 border-2 ${
          totalPL > 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
            : totalPL < 0 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm uppercase tracking-wide font-semibold ${
              totalPL > 0 ? 'text-green-700' : totalPL < 0 ? 'text-red-700' : 'text-slate-500'
            }`}>
              P&L Total
            </div>
            <DollarSign className={`w-5 h-5 ${
              totalPL > 0 ? 'text-green-600' : totalPL < 0 ? 'text-red-600' : 'text-slate-400'
            }`} />
          </div>
          <div className={`text-3xl font-black ${
            totalPL > 0 ? 'text-green-700' : totalPL < 0 ? 'text-red-700' : 'text-slate-900'
          }`}>
            {totalPL > 0 ? '+' : ''}${totalPL.toFixed(2)}
          </div>
          <div className={`text-xs mt-1 ${
            totalPL > 0 ? 'text-green-600' : totalPL < 0 ? 'text-red-600' : 'text-slate-500'
          }`}>
            Acumulado total
          </div>
        </div>

        {/* Average Win */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border-2 border-emerald-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-emerald-700 uppercase tracking-wide font-semibold">
              Avg Win
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">
            ${avgWin.toFixed(2)}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Ganancia promedio</div>
        </div>

        {/* Average Loss */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-orange-700 uppercase tracking-wide font-semibold">
              Avg Loss
            </div>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-black text-orange-700">
            ${Math.abs(avgLoss).toFixed(2)}
          </div>
          <div className="text-xs text-orange-600 mt-1">Pérdida promedio</div>
        </div>

        {/* Profit Factor & Streak */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-purple-700 uppercase tracking-wide font-semibold">
              Profit Factor
            </div>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-700">
            {profitFactor.toFixed(2)}x
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {currentStreak !== 0 && (
              <span className={currentStreak > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {currentStreak > 0 ? '🔥 ' : '⚠️ '}
                {Math.abs(currentStreak)} {currentStreak > 0 ? 'wins' : 'losses'} seguidas
              </span>
            )}
            {currentStreak === 0 && 'Sin racha activa'}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      {stats && trades.length > 0 && (
        <TraderCharts trades={trades} bestSymbols={stats.bestSymbols} />
      )}

      {/* Best & Worst Symbols */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          {/* Best Symbols */}
          <div className="bg-white rounded-xl p-5 border-2 border-green-200">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-900">🏆 Mejores Símbolos</h3>
            </div>
            <div className="space-y-2">
              {stats.bestSymbols.length > 0 ? (
                stats.bestSymbols.map((symbol) => (
                  <div key={symbol.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{symbol.symbol}</span>
                      <span className="text-xs text-slate-500 ml-2">({symbol.count} trades)</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {symbol.winRate.toFixed(1)}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No hay datos suficientes</p>
              )}
            </div>
          </div>

          {/* Worst Symbols */}
          <div className="bg-white rounded-xl p-5 border-2 border-red-200">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900">📉 Símbolos a Mejorar</h3>
            </div>
            <div className="space-y-2">
              {stats.worstSymbols.length > 0 ? (
                stats.worstSymbols.map((symbol) => (
                  <div key={symbol.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{symbol.symbol}</span>
                      <span className="text-xs text-slate-500 ml-2">({symbol.count} trades)</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {symbol.winRate.toFixed(1)}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No hay datos suficientes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avg Days Winner */}
      {stats && stats.avgDaysWinner > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-300">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-purple-900">⏱️ Tiempo Promedio en Ganadores</h3>
              <p className="text-2xl font-black text-purple-700 mt-1">
                {stats.avgDaysWinner.toFixed(1)} días
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Duración promedio de trades ganadores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trades Timeline */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">📝 Historial de Trades</h2>
          <span className="text-sm text-slate-500">{trades.length} trades</span>
        </div>

        <div className="space-y-3">
          {trades.length > 0 ? (
            trades.map((trade) => (
              <div
                key={trade.id}
                className="border-2 border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  {/* Symbol & Outcome */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        trade.outcome === 'Winner'
                          ? 'bg-green-100 border-2 border-green-300'
                          : 'bg-red-100 border-2 border-red-300'
                      }`}
                    >
                      {trade.outcome === 'Winner' ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{trade.symbol}</h3>
                      <p
                        className={`text-sm font-semibold ${
                          trade.outcome === 'Winner' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {trade.outcome}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-center">
                    <div className="text-xs text-slate-600 font-medium">Entrada</div>
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(trade.entryDate).toLocaleDateString('es-ES')}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-slate-600 font-medium">Salida</div>
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(trade.exitDate).toLocaleDateString('es-ES')}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="text-center">
                    <div className="text-xs text-slate-600 font-medium">Precios</div>
                    <div className="text-sm font-bold text-slate-900">
                      ${trade.entryPrice?.toFixed(2)} → ${trade.exitPrice?.toFixed(2)}
                    </div>
                  </div>

                  {/* P&L */}
                  <div className="text-right">
                    <div className="text-xs text-slate-600 font-medium mb-1">P&L</div>
                    {trade.profitLoss !== null && (
                      <div
                        className={`text-xl font-black ${
                          (trade.profitLoss || 0) > 0
                            ? 'text-green-600'
                            : (trade.profitLoss || 0) < 0
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {(trade.profitLoss || 0) > 0 ? '+' : ''}$
                        {trade.profitLoss?.toFixed(2)}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">{trade.daysHeld} días</div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingTrade(trade)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Editar trade"
                  >
                    <Edit2 className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Notes */}
                {trade.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Notas:</span> {trade.notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No hay trades registrados aún
              </h3>
              <p className="text-slate-600">
                Comienza a registrar tus trades para ver tus estadísticas aquí
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Trade Modal */}
      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSuccess={() => {
            setEditingTrade(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
