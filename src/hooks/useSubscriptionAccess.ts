import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para verificar permisos de acceso según el plan de suscripción
 * 
 * Las restricciones se obtienen directamente desde la base de datos:
 * - FREE: ❌ Historial de alertas, ❌ Análisis técnico avanzado, ❌ Registro de trades, ❌ ML Score
 * - PRO: ❌ Historial de alertas, ❌ Análisis técnico avanzado, ✅ Registro de trades (hasta 100/mes), ❌ ML Score
 * - PREMIUM: ✅ Acceso completo, ✅ ML Score
 */
export function useSubscriptionAccess() {
  const { subscription } = useAuth();
  
  const access = useMemo(() => {
    const planName = subscription?.name || 'Free';
    
    // Leer permisos directamente desde la suscripción (vienen de la DB)
    const hasAccessToHistory = subscription?.hasAccessToAlertHistory ?? false;
    const hasAccessToTechnicalAnalysis = subscription?.hasAccessToTechnicalAnalysis ?? false;
    
    // FREE no puede registrar trades (maxTrackingsPerMonth = 0)
    // PRO y PREMIUM sí pueden (maxTrackingsPerMonth > 0 o -1 para ilimitado)
    const canTrackTrades = (subscription?.maxTrackingsPerMonth ?? 0) !== 0;
    
    // ML Score: Solo PREMIUM
    const hasAccessToMLScore = planName === 'Premium';
    
    return {
      // Permisos de acceso (desde DB)
      hasAccessToHistory,
      hasAccessToTechnicalAnalysis,
      canTrackTrades,
      hasAccessToMLScore,
      
      // Información del plan
      planName,
      isPremium: planName === 'Premium',
      isPro: planName === 'Pro',
      isFree: planName === 'Free',
      
      // Información para mensajes de upgrade
      requiredPlanForHistory: 'Premium' as const,
      requiredPlanForTechnicalAnalysis: 'Premium' as const,
      requiredPlanForTrades: 'Pro' as const,
      requiredPlanForMLScore: 'Premium' as const,
    };
  }, [subscription]);
  
  return access;
}
