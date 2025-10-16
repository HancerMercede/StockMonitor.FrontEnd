import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

interface EditTradeModalProps {
  trade: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTradeModal({ trade, onClose, onSuccess }: EditTradeModalProps) {
  const [formData, setFormData] = useState({
    outcome: trade.outcome || '',
    entryDate: new Date(trade.entryDate).toISOString().slice(0, 16),
    exitDate: new Date(trade.exitDate).toISOString().slice(0, 16),
    entryPrice: trade.entryPrice || '',
    exitPrice: trade.exitPrice || '',
    notes: trade.notes || '',
  });
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(trade.screenshotBase64 || null);
  const [imagePreview, setImagePreview] = useState<string | null>(trade.screenshotBase64 || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setScreenshotBase64(base64String);
      setImagePreview(base64String);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setScreenshotBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {};
      
      // Solo enviar campos modificados
      if (formData.outcome !== trade.outcome) payload.outcome = formData.outcome.toUpperCase();
      
      const originalEntryDate = new Date(trade.entryDate).toISOString().slice(0, 16);
      const originalExitDate = new Date(trade.exitDate).toISOString().slice(0, 16);
      if (formData.entryDate !== originalEntryDate) {
        payload.entryDate = new Date(formData.entryDate).toISOString();
      }
      if (formData.exitDate !== originalExitDate) {
        payload.exitDate = new Date(formData.exitDate).toISOString();
      }
      
      if (parseFloat(formData.entryPrice) !== trade.entryPrice) {
        payload.entryPrice = parseFloat(formData.entryPrice);
      }
      if (parseFloat(formData.exitPrice) !== trade.exitPrice) {
        payload.exitPrice = parseFloat(formData.exitPrice);
      }
      if (formData.notes !== (trade.notes || '')) payload.notes = formData.notes;
      if (screenshotBase64 !== (trade.screenshotBase64 || null)) {
        payload.screenshotBase64 = screenshotBase64;
      }

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
              Estado del Trade
            </label>
            <select
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
              required
            >
              <option value="">Selecciona...</option>
              <option value="OPEN">Abierto</option>
              <option value="WINNER">Winner</option>
              <option value="LOSER">Loser</option>
            </select>
          </div>

          {/* Entry Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de Entrada
            </label>
            <input
              type="datetime-local"
              value={formData.entryDate}
              onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
              required
            />
          </div>

          {/* Exit Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de Salida
            </label>
            <input
              type="datetime-local"
              value={formData.exitDate}
              onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900"
              required
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

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Screenshot del Trade (opcional)
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                >
                  <Upload className="w-5 h-5" />
                  <span>Seleccionar imagen</span>
                </button>
                <p className="text-xs text-slate-500 mt-2">PNG, JPG o GIF (máx. 5MB)</p>
              </div>
            ) : (
              <div className="relative border-2 border-slate-300 rounded-lg p-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={loading}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
