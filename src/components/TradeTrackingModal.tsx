import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { tradeTrackingService } from '../services/tradeTrackingService';
import type { ConsolidatedAlert } from '../types';

interface Props {
  alert: ConsolidatedAlert;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TradeTrackingModal({ alert, isOpen, onClose, onSuccess }: Props) {
  const [outcome, setOutcome] = useState<'WINNER' | 'LOSER'>('WINNER');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 16));
  const [entryPrice, setEntryPrice] = useState(alert.tradingAction.entryPrice?.toString() || '');
  const [exitPrice, setExitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convertir fechas locales a UTC ISO string para PostgreSQL
      const entryDateUtc = new Date(entryDate).toISOString();
      const exitDateUtc = new Date(exitDate).toISOString();
      
      // userId ya no es necesario - el backend lo obtiene del token JWT
      await tradeTrackingService.trackTrade({
        alertId: alert.id,
        symbol: alert.symbol,
        outcome,
        entryDate: entryDateUtc,
        exitDate: exitDateUtc,
        entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
        exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
        notes: notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registrar Trade</h2>
            <p className="text-sm text-gray-600 mt-1">
              {alert.symbol} • {alert.recommendation}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Resultado del Trade
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('WINNER')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  outcome === 'WINNER'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className={`w-5 h-5 ${outcome === 'WINNER' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${outcome === 'WINNER' ? 'text-green-700' : 'text-gray-600'}`}>
                    Ganador
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOutcome('LOSER')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  outcome === 'LOSER'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <TrendingDown className={`w-5 h-5 ${outcome === 'LOSER' ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${outcome === 'LOSER' ? 'text-red-700' : 'text-gray-600'}`}>
                    Perdedor
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Entrada
              </label>
              <input
                type="datetime-local"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Salida
              </label>
              <input
                type="datetime-local"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Entrada
              </label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="175.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Salida
              </label>
              <input
                type="number"
                step="0.01"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="180.25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalles adicionales sobre este trade..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
            >
              {loading ? 'Guardando...' : 'Registrar Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
