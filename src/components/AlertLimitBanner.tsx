import React from 'react';
import { Crown, AlertTriangle, TrendingUp } from 'lucide-react';
import type { UserAlertStats } from '../types';

interface AlertLimitBannerProps {
  stats: UserAlertStats;
}

export default function AlertLimitBanner({ stats }: AlertLimitBannerProps) {
  const { alertsToday, maxAlertsPerDay, canReceiveMore, planName } = stats;
  
  const isUnlimited = maxAlertsPerDay < 0;
  const percentage = isUnlimited ? 0 : (alertsToday / maxAlertsPerDay) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = !isUnlimited && alertsToday >= maxAlertsPerDay;
  
  // Si es plan Premium (ilimitado)
  if (isUnlimited) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-600">PLAN {planName.toUpperCase()}</p>
              <p className="text-xs text-gray-600">Alertas ilimitadas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              ✨ Sin límites
            </p>
            <p className="text-xs text-gray-500">{alertsToday} alertas hoy</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Para planes Free y Pro
  return (
    <div className={`rounded-xl p-4 mb-6 border-2 transition-all ${
      isAtLimit
        ? 'bg-red-50 border-red-300 shadow-lg'
        : isNearLimit
        ? 'bg-yellow-50 border-yellow-300 shadow-md'
        : 'bg-blue-50 border-blue-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isAtLimit ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : isNearLimit ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          ) : (
            <TrendingUp className="w-5 h-5 text-blue-600" />
          )}
          <span className="text-sm font-semibold text-gray-700">
            Alertas de Hoy
          </span>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${
            isAtLimit ? 'text-red-600' :
            isNearLimit ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {alertsToday} / {maxAlertsPerDay}
          </span>
          <p className="text-xs text-gray-500">Plan {planName}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Messages */}
      {isAtLimit && (
        <div className="flex items-start space-x-2 p-3 bg-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">Límite alcanzado</p>
            <p className="text-xs mt-1">
              Has recibido todas las alertas disponibles hoy.{' '}
              <a href="/subscriptions" className="underline font-semibold hover:text-red-900">
                Actualiza tu plan
              </a>{' '}
              para recibir más alertas.
            </p>
          </div>
        </div>
      )}
      
      {isNearLimit && !isAtLimit && (
        <div className="flex items-start space-x-2 p-3 bg-yellow-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Te estás acercando al límite</p>
            <p className="text-xs mt-1">
              Te quedan {maxAlertsPerDay - alertsToday} alertas disponibles hoy.
              {planName === 'Free' && (
                <span>
                  {' '}Considera <a href="/subscriptions" className="underline font-semibold hover:text-yellow-900">
                    actualizar a Pro
                  </a> para más alertas.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
      
      {!isNearLimit && !isAtLimit && (
        <p className="text-xs text-gray-600 text-center">
          Te quedan <span className="font-semibold text-blue-600">{maxAlertsPerDay - alertsToday} alertas</span> disponibles hoy
        </p>
      )}
    </div>
  );
}
