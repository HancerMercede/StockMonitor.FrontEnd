import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { tradeTrackingService } from '../services/tradeTrackingService';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddManualTradeModal({ onClose, onSuccess }: Props) {
  const [symbol, setSymbol] = useState('');
  const [outcome, setOutcome] = useState<'WINNER' | 'LOSER'>('WINNER');
  const [entryDate, setEntryDate] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setScreenshotBase64(base64String);
      setImagePreview(base64String);
      setError(null);
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
    setError(null);

    if (!symbol.trim()) {
      setError('El símbolo es requerido');
      return;
    }

    if (!entryDate || !exitDate) {
      setError('Las fechas son requeridas');
      return;
    }

    if (new Date(exitDate) < new Date(entryDate)) {
      setError('La fecha de salida debe ser posterior a la fecha de entrada');
      return;
    }

    const entryPriceNum = entryPrice ? parseFloat(entryPrice) : null;
    const exitPriceNum = exitPrice ? parseFloat(exitPrice) : null;

    if (entryPrice && isNaN(entryPriceNum!)) {
      setError('Precio de entrada inválido');
      return;
    }

    if (exitPrice && isNaN(exitPriceNum!)) {
      setError('Precio de salida inválido');
      return;
    }

    setLoading(true);

    try {
      await tradeTrackingService.trackTrade({
        symbol: symbol.toUpperCase(),
        outcome,
        entryDate: new Date(entryDate).toISOString(),
        exitDate: new Date(exitDate).toISOString(),
        entryPrice: entryPriceNum,
        exitPrice: exitPriceNum,
        notes: notes || undefined,
        screenshotBase64: screenshotBase64 || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al registrar el trade');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📝 Agregar Trade Manual</h2>
            <p className="text-sm text-gray-600 mt-1">Registra un trade independiente del sistema de alertas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Symbol */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Símbolo *
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Ej: AAPL, TSLA, NVDA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-gray-900 bg-white"
              required
              disabled={loading}
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Resultado del Trade
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('WINNER')}
                disabled={loading}
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
                disabled={loading}
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
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Salida
              </label>
              <input
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
                disabled={loading}
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
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                disabled={loading}
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
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
                disabled={loading}
              />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Screenshot del Trade (opcional)
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                <p className="text-xs text-gray-500 mt-2">PNG, JPG o GIF (máx. 5MB)</p>
              </div>
            ) : (
              <div className="relative border-2 border-gray-300 rounded-lg p-4">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Estrategia, razón de entrada/salida, lecciones aprendidas..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white placeholder-gray-400"
              disabled={loading}
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Guardando...</span>
                </span>
              ) : (
                '✅ Registrar Trade'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
