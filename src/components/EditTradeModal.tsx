import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

interface EditTradeModalProps {
  trade: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTradeModal({ trade, onClose, onSuccess }: EditTradeModalProps) {
  const [formData, setFormData] = useState({
    outcome: trade.outcome || '',
    entryPrice: trade.entryPrice || '',
    exitPrice: trade.exitPrice || '',
    notes: trade.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {};
      
      // Solo enviar campos modificados
      if (formData.outcome !== trade.outcome) payload.outcome = formData.outcome.toUpperCase();
      if (parseFloat(formData.entryPrice) !== trade.entryPrice) {
        payload.entryPrice = parseFloat(formData.entryPrice);
      }
      if (parseFloat(formData.exitPrice) !== trade.exitPrice) {
        payload.exitPrice = parseFloat(formData.exitPrice);
      }
      if (formData.notes !== (trade.notes || '')) payload.notes = formData.notes;

      await apiClient.put(`/api/trades/${trade.id}`, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-black text-slate-900">✏️ Editar Trade</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Symbol (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Símbolo
            </label>
            <input
              type="text"
              value={trade.symbol}
              className="w-full px-4 py-2 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Resultado
            </label>
            <select
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
              required
            >
              <option value="">Selecciona...</option>
              <option value="WINNER">Winner</option>
              <option value="LOSER">Loser</option>
            </select>
          </div>

          {/* Entry Date (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de Entrada
            </label>
            <input
              type="text"
              value={new Date(trade.entryDate).toLocaleString('es-ES', { 
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
              })}
              className="w-full px-4 py-2 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Exit Date (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de Salida
            </label>
            <input
              type="text"
              value={new Date(trade.exitDate).toLocaleString('es-ES', { 
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
              })}
              className="w-full px-4 py-2 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Precio de Entrada
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.entryPrice}
              onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
            />
          </div>

          {/* Exit Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Precio de Salida
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.exitPrice}
              onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
