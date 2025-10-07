import React, { useState, useEffect } from 'react';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import type { SubscriptionTier, CurrentSubscription } from '../types';

export default function SubscriptionPlans() {
  const { refreshSubscription } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentTier, setCurrentTier] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [tiersData, currentData] = await Promise.all([
        subscriptionService.getAllTiers(),
        subscriptionService.getCurrentTier(),
      ]);
      setTiers(tiersData);
      setCurrentTier(currentData);
    } catch (err) {
      setError('Error al cargar planes de suscripción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTier = async (tierId: string) => {
    try {
      setChanging(tierId);
      setError('');
      await subscriptionService.changeTier(tierId);
      // Actualizar datos locales y del contexto global
      await Promise.all([
        loadSubscriptionData(),
        refreshSubscription()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar plan');
    } finally {
      setChanging(null);
    }
  };

  const getTierIcon = (name: string) => {
    switch (name) {
      case 'Free':
        return <Shield className="w-8 h-8" />;
      case 'Pro':
        return <Zap className="w-8 h-8" />;
      case 'Premium':
        return <Crown className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getTierColor = (name: string) => {
    switch (name) {
      case 'Free':
        return 'bg-gray-500';
      case 'Pro':
        return 'bg-blue-600';
      case 'Premium':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Cargando planes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Elige tu Plan
        </h1>
        <p className="text-lg text-gray-600">
          Mejora tu experiencia con más funcionalidades y límites superiores
        </p>
      </div>

      {/* Current Plan Banner */}
      {currentTier && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-1">TU PLAN ACTUAL</p>
              <h3 className="text-2xl font-bold text-gray-900">{currentTier.name}</h3>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Trades este mes: <span className="font-semibold text-gray-900">
                  {currentTier.usage.tradesThisMonth}
                  {currentTier.maxTrackingsPerMonth > 0 ? ` / ${currentTier.maxTrackingsPerMonth}` : ' / ∞'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Alertas hoy: <span className="font-semibold text-gray-900">
                  {currentTier.usage.alertsToday}
                  {currentTier.maxAlertsPerDay > 0 ? ` / ${currentTier.maxAlertsPerDay}` : ' / ∞'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isCurrentPlan = currentTier?.id === tier.id;
          const isPremium = tier.name === 'Premium';

          return (
            <div
              key={tier.id}
              className={`relative rounded-xl p-6 border-2 transition-all duration-200 flex flex-col ${
                isPremium
                  ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                  : isCurrentPlan
                  ? 'border-blue-300 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-lg'
              }`}
            >
              {isPremium && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}

              {/* Icon & Name */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`${getTierColor(tier.name)} text-white p-2.5 rounded-lg`}>
                  {getTierIcon(tier.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  {isCurrentPlan && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      PLAN ACTUAL
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline mb-2">
                  <span className={`font-bold ${
                    isPremium ? 'text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'text-4xl text-gray-900'
                  }`}>
                    ${tier.price.toFixed(0)}
                  </span>
                  <span className="text-gray-500 text-base ml-1">/mes</span>
                </div>
                <p className="text-sm text-gray-600">{tier.description}</p>
              </div>

              {/* Limits */}
              <div className="mb-5 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-700 space-y-1.5">
                  <div>
                    📊 <strong>Trades:</strong>{' '}
                    {tier.maxTrackingsPerMonth < 0 ? 'Ilimitados' : `${tier.maxTrackingsPerMonth}/mes`}
                  </div>
                  <div>
                    🔔 <strong>Alertas:</strong>{' '}
                    {tier.maxAlertsPerDay < 0 ? 'Ilimitadas' : `${tier.maxAlertsPerDay}/día`}
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => !isCurrentPlan && handleChangeTier(tier.id)}
                disabled={isCurrentPlan || changing === tier.id}
                className={`w-full py-3 rounded-lg font-semibold text-base transition-all ${
                  isCurrentPlan
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isPremium
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                } ${changing === tier.id ? 'opacity-50 cursor-wait' : ''}`}
              >
                {changing === tier.id
                  ? '⏳ Procesando...'
                  : isCurrentPlan
                  ? '✓ Plan Actual'
                  : tier.price === 0
                  ? 'Cambiar a Free'
                  : `🚀 Actualizar a ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-10 text-center text-sm text-gray-500">
        <p>Los cambios de plan se aplican inmediatamente. Puedes cambiar de plan en cualquier momento.</p>
      </div>
    </div>
  );
}
