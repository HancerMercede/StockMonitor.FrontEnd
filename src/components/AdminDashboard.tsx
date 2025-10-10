import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';
import type { SystemOverview, UsersGrowthStats, WinRateBySymbol } from '../types';
import {
  Users,
  DollarSign,
  TrendingUp,
  Bell,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Activity,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [usersGrowth, setUsersGrowth] = useState<UsersGrowthStats | null>(null);
  const [winRateStats, setWinRateStats] = useState<WinRateBySymbol | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const loadData = async (showToast = false) => {
    try {
      setRefreshing(showToast);
      const [overviewData, growthData, winRateData] = await Promise.all([
        adminService.getSystemOverview(),
        adminService.getUsersGrowthStats(selectedPeriod),
        adminService.getWinRateBySymbol(selectedPeriod),
      ]);
      
      setOverview(overviewData);
      setUsersGrowth(growthData);
      setWinRateStats(winRateData);
      
      if (showToast) {
        toast.success('✅ Datos actualizados');
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const handleRefresh = () => {
    loadData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error cargando datos del dashboard</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Volver al Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-400">Panel de administración del sistema</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Usuarios"
            value={overview.users.total.toString()}
            subtitle={`${overview.users.active} activos (${overview.users.activePercentage.toFixed(1)}%)`}
            color="blue"
          />

          {/* Revenue Card */}
          <MetricCard
            icon={<DollarSign className="w-6 h-6" />}
            title="MRR"
            value={`$${overview.revenue.mrr.toFixed(2)}`}
            subtitle={`$${overview.revenue.projectedAnnual.toFixed(2)} anual`}
            color="green"
          />

          {/* Trades Card */}
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Win Rate"
            value={`${overview.trades.winRate.toFixed(1)}%`}
            subtitle={`${overview.trades.total} trades (${overview.trades.period})`}
            color="purple"
          />

          {/* Alerts Card */}
          <MetricCard
            icon={<Bell className="w-6 h-6" />}
            title="Alertas"
            value={overview.alerts.totalGenerated.toString()}
            subtitle={`Calidad promedio: ${overview.alerts.avgQualityScore.toFixed(1)}`}
            color="orange"
          />
        </div>

        {/* Users by Tier */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Usuarios por Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(overview.users.byTier).map(([tier, count]) => (
              <div
                key={tier}
                className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30"
              >
                <div className="text-sm text-gray-400 mb-1">{tier}</div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((count / overview.users.total) * 100).toFixed(1)}% del total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Details */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Detalles de Ingresos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueDetailCard
              label="Suscriptores Pro"
              value={overview.revenue.proSubscribers.toString()}
              subtitle="Plan mensual"
            />
            <RevenueDetailCard
              label="Suscriptores Premium"
              value={overview.revenue.premiumSubscribers.toString()}
              subtitle="Plan premium"
            />
            {overview.revenue.activeStripeSubscriptions !== undefined && (
              <RevenueDetailCard
                label="Suscripciones Activas"
                value={overview.revenue.activeStripeSubscriptions.toString()}
                subtitle="En Stripe"
              />
            )}
            {overview.revenue.churnLast30Days !== undefined && (
              <RevenueDetailCard
                label="Cancelaciones (30d)"
                value={overview.revenue.churnLast30Days.toString()}
                subtitle="Último mes"
                isNegative
              />
            )}
          </div>
        </div>

        {/* Trade Performance */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Performance de Trades ({overview.trades.period})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm text-green-400 mb-1">Ganadores</div>
              <div className="text-2xl font-bold text-green-400">{overview.trades.winners}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-sm text-red-400 mb-1">Perdedores</div>
              <div className="text-2xl font-bold text-red-400">{overview.trades.losers}</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-blue-400 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-400">{overview.trades.winRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Top Symbols by Win Rate */}
          {winRateStats && winRateStats.data.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Top Símbolos por Win Rate</h3>
              <div className="space-y-2">
                {winRateStats.data.slice(0, 5).map((symbol) => (
                  <div
                    key={symbol.symbol}
                    className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-400">{symbol.symbol}</span>
                      <span className="text-sm text-gray-400">
                        {symbol.totalTrades} trades
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        <span className="text-green-400">{symbol.winners}W</span>
                        {' / '}
                        <span className="text-red-400">{symbol.losers}L</span>
                      </span>
                      <span className={`font-bold ${
                        symbol.winRate >= 60 ? 'text-green-400' :
                        symbol.winRate >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {symbol.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Users Growth Chart */}
        {usersGrowth && usersGrowth.data.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Crecimiento de Usuarios ({usersGrowth.period})
            </h2>
            <div className="text-sm text-gray-400 mb-4">
              Total de nuevos usuarios: <span className="text-white font-bold">{usersGrowth.totalNewUsers}</span>
            </div>
            <div className="space-y-2">
              {usersGrowth.data.slice(-10).map((day) => (
                <div
                  key={day.date}
                  className="flex items-center gap-4 bg-gray-700/30 rounded-lg p-3"
                >
                  <span className="text-sm text-gray-400 w-24">{day.date}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(day.newUsers / Math.max(...usersGrowth.data.map(d => d.newUsers))) * 100}%` }}
                      />
                      <span className="text-sm font-semibold">{day.newUsers} nuevos</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Total: {day.cumulative}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert Performance */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            Performance de Alertas ({overview.alerts.period})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Generadas</div>
              <div className="text-2xl font-bold">{overview.alerts.totalGenerated}</div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Calidad Promedio</div>
              <div className="text-2xl font-bold text-green-400">{overview.alerts.avgQualityScore.toFixed(1)}</div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">ML Score Promedio</div>
              <div className="text-2xl font-bold text-purple-400">{overview.alerts.avgMLScore.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {overview.alerts.withMLScore} con ML score
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Última actualización: {new Date(overview.timestamp).toLocaleString('es-ES')}
        </div>
      </div>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`${colorClasses[color]}`}>{icon}</div>
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{subtitle}</div>
    </div>
  );
};

interface RevenueDetailCardProps {
  label: string;
  value: string;
  subtitle: string;
  isNegative?: boolean;
}

const RevenueDetailCard: React.FC<RevenueDetailCardProps> = ({ 
  label, 
  value, 
  subtitle, 
  isNegative = false 
}) => {
  return (
    <div className="bg-gray-700/30 rounded-lg p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${isNegative ? 'text-red-400' : ''}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
};

export default AdminDashboard;
