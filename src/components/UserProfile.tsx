import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Award, TrendingUp, TrendingDown, DollarSign, Target, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import { apiClient } from '../utils/apiClient';
import { tradeTrackingService } from '../services/tradeTrackingService';
import toast from 'react-hot-toast';
import WatchlistManager from './WatchlistManager';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  subscriptionTier: string;
  createdAt: string;
  lastLoginAt: string;
}

interface TradeStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  profitableTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const { canTrackTrades, planName } = useSubscriptionAccess();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        apiClient.get<UserProfileData>('/api/user/profile'),
        apiClient.get<TradeStats>('/api/user/stats'),
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setEditForm({ username: profileData.username, email: profileData.email });
    } catch (error) {
      toast.error('Error al cargar el perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/api/user/profile', editForm);
      toast.success('Perfil actualizado exitosamente');
      setEditing(false);
      loadProfileData();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar perfil');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
      }}>
        <div className="text-white text-center">
          <p>Error al cargar el perfil</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
    }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
                <p className="text-gray-600">{profile.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Award className={`w-4 h-4 ${
                    subscription?.name === 'Premium' ? 'text-purple-600' :
                    subscription?.name === 'Pro' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    subscription?.name === 'Premium' ? 'bg-purple-100 text-purple-700' :
                    subscription?.name === 'Pro' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {subscription?.name || profile.subscriptionTier || 'Free'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Guardar Cambios
              </button>
            </form>
          )}

          {/* Account Info */}
          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Miembro desde</p>
                <p className="font-semibold text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Último acceso</p>
                <p className="font-semibold text-gray-900">
                  {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist Manager */}
        <div className="mb-6">
          <WatchlistManager />
        </div>

        {/* Trading Stats - Solo mostrar si el usuario puede registrar trades (NO Free) */}
        {canTrackTrades && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas de Trading</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-blue-600 font-medium">Total Trades</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalTrades}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-green-600 font-medium">Ganadores</p>
              <p className="text-3xl font-bold text-green-900">{stats.profitableTrades}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm text-red-600 font-medium">Perdedores</p>
              <p className="text-3xl font-bold text-red-900">{stats.losingTrades}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-purple-600 font-medium">Win Rate</p>
              <p className="text-3xl font-bold text-purple-900">{stats.winRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Profit/Loss Total</p>
                  <p className={`text-4xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${stats.totalProfit.toFixed(2)}
                  </p>
                </div>
                <DollarSign className={`w-16 h-16 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Trades Abiertos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openTrades}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Trades Cerrados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closedTrades}</p>
            </div>
          </div>
        </div>
        )}
        
        {/* Mensaje de upgrade para usuarios Free */}
        {!canTrackTrades && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-lg p-8 border-2 border-blue-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Registro de Trades</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                El registro y seguimiento de trades está disponible a partir del plan <span className="font-semibold text-green-600">Pro</span>.
                Actualiza tu plan para llevar un control profesional de tus operaciones.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🚀 Ver Planes Pro y Premium
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-200">
                <p className="text-sm text-gray-500 mb-3">Con el plan Pro obtendrás:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <div className="flex items-center space-x-2 text-left">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-700">Registro de hasta 100 trades/mes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-left">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-700">Estadísticas completas de trading</span>
                  </div>
                  <div className="flex items-center space-x-2 text-left">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-700">Análisis de Win Rate</span>
                  </div>
                  <div className="flex items-center space-x-2 text-left">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-700">Seguimiento de P&L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
