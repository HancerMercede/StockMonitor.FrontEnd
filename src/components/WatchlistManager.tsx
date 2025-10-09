import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, AlertCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { watchlistService } from '../services/watchlistService';
import type { WatchlistResponse } from '../services/watchlistService';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionModal from './SubscriptionModal';
import { alertsKeys } from '../hooks/useAlerts';

const WatchlistManager: React.FC = () => {
  const { subscription, refreshAlertStats } = useAuth();
  const queryClient = useQueryClient();
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Cargar watchlist
  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const data = await watchlistService.getMyWatchlist();
      setWatchlist(data);
    } catch (error: any) {
      toast.error(error.message || 'Error cargando watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // Agregar símbolo
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSymbol.trim()) {
      toast.error('El símbolo es requerido');
      return;
    }

    try {
      setAdding(true);
      await watchlistService.addSymbol({
        symbol: newSymbol.toUpperCase().trim(),
        notes: newNotes.trim() || undefined
      });
      
      toast.success(`${newSymbol.toUpperCase()} agregado al watchlist`);
      setNewSymbol('');
      setNewNotes('');
      await loadWatchlist();
      
      // ✅ Actualizar el contador de alertas en el dashboard
      await refreshAlertStats();
      
      // ✅ Invalidar caché de alertas para forzar refetch cuando el usuario vuelva al dashboard
      // Esto asegura que las nuevas alertas del símbolo agregado se muestren inmediatamente
      queryClient.invalidateQueries({ queryKey: alertsKeys.list() });
      console.log('🔄 Caché de alertas invalidado después de agregar símbolo');
    } catch (error: any) {
      toast.error(error.message || 'Error agregando símbolo');
    } finally {
      setAdding(false);
    }
  };

  // Eliminar símbolo
  const handleRemove = async (id: string, symbol: string) => {
    if (!confirm(`¿Eliminar ${symbol} del watchlist?`)) return;

    try {
      await watchlistService.removeSymbol(id);
      toast.success(`${symbol} eliminado`);
      await loadWatchlist();
      
      // ✅ Actualizar el contador de alertas en el dashboard
      await refreshAlertStats();
      
      // ✅ Invalidar caché de alertas para forzar refetch cuando el usuario vuelva al dashboard
      // Esto elimina las alertas del símbolo removido del dashboard
      queryClient.invalidateQueries({ queryKey: alertsKeys.list() });
      console.log('🔄 Caché de alertas invalidado después de eliminar símbolo');
    } catch (error: any) {
      toast.error(error.message || 'Error eliminando símbolo');
    }
  };

  // Calcular estado del límite
  const getLimitStatus = () => {
    if (!watchlist) return { color: 'gray', text: 'Cargando...' };
    
    const { currentCount, maxAllowed } = watchlist;
    
    if (maxAllowed === -1) {
      return { color: 'purple', text: 'Ilimitado' };
    }
    
    if (maxAllowed === 0) {
      return { color: 'red', text: 'No disponible (Upgrade requerido)' };
    }
    
    const percentage = (currentCount / maxAllowed) * 100;
    
    if (percentage >= 90) {
      return { color: 'red', text: `${currentCount}/${maxAllowed} (Límite alcanzado)` };
    }
    if (percentage >= 70) {
      return { color: 'yellow', text: `${currentCount}/${maxAllowed} (Cerca del límite)` };
    }
    return { color: 'green', text: `${currentCount}/${maxAllowed}` };
  };

  const limitStatus = getLimitStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Usuario Free sin acceso
  if (watchlist && watchlist.maxAllowed === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-8 h-8 text-orange-500" />
          <h3 className="text-xl font-bold text-gray-900">Watchlist Personalizado</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Los usuarios Free no pueden agregar símbolos personalizados al watchlist.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Upgrade a <span className="font-semibold text-blue-600">Pro</span> o{' '}
          <span className="font-semibold text-purple-600">Premium</span> para monitorear tus propios símbolos.
        </p>
        <button 
          onClick={() => setShowSubscriptionModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Ver Planes
        </button>

        {/* Subscription Modal */}
        <SubscriptionModal 
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Mi Watchlist</h3>
          <p className="text-sm text-gray-500 mt-1">
            Símbolos personalizados que deseas monitorear
          </p>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
          limitStatus.color === 'purple' ? 'bg-purple-100 text-purple-800' :
          limitStatus.color === 'green' ? 'bg-green-100 text-green-800' :
          limitStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {limitStatus.text}
        </div>
      </div>

      {/* Formulario para agregar */}
      {watchlist && watchlist.canAddMore && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="SÍMBOLO (ej: AAPL)"
                className="flex-1 px-4 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-semibold"
                maxLength={10}
                disabled={adding}
              />
              <button
                type="submit"
                disabled={adding || !newSymbol.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {adding ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Agregar</span>
                  </>
                )}
              </button>
            </div>
            
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notas opcionales (ej: Objetivo de precio $200)"
              className="px-4 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              maxLength={500}
              disabled={adding}
            />
          </div>
        </form>
      )}

      {/* Lista de símbolos */}
      {watchlist && watchlist.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No hay símbolos en tu watchlist</p>
          <p className="text-sm mt-2">Agrega símbolos para empezar a monitorear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist?.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-gray-900">{item.symbol}</span>
                  <span className="text-xs text-gray-500">
                    Agregado {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                )}
              </div>
              
              <button
                onClick={() => handleRemove(item.id, item.symbol)}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info del plan */}
      {subscription && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Plan actual: <span className="font-semibold">{subscription.name}</span>
            </span>
            {watchlist && watchlist.maxAllowed > 0 && !watchlist.canAddMore && (
              <span className="text-orange-600 font-medium">
                Límite alcanzado - Considera upgrade
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistManager;
