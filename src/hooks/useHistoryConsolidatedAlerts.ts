import { useMemo } from 'react';
import type { Alert, ConsolidatedAlert } from '../types';
import { useConsolidatedAlerts } from './useConsolidatedAlerts';

/**
 * Hook especializado para AlertHistory que consolida alertas pero
 * respeta el qualityScore del backend en lugar de recalcular confidenceScore
 */
export const useHistoryConsolidatedAlerts = (alerts: Alert[]): ConsolidatedAlert[] => {
  // Primero consolidar usando la lógica existente
  const consolidatedAlerts = useConsolidatedAlerts(alerts);
  
  // Luego sobrescribir confidenceScore con qualityScore del backend si existe
  return useMemo(() => {
    return consolidatedAlerts.map(consolidatedAlert => {
      // Obtener las alertas originales de este símbolo
      const originalAlerts = alerts.filter(a => a.symbol === consolidatedAlert.symbol);
      
      // Calcular promedio de qualityScore del backend si existe
      const alertsWithQualityScore = originalAlerts.filter(a => a.qualityScore !== undefined);
      
      if (alertsWithQualityScore.length > 0) {
        const avgBackendQualityScore = 
          alertsWithQualityScore.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / 
          alertsWithQualityScore.length;
        
        // Sobrescribir confidenceScore con el qualityScore del backend
        return {
          ...consolidatedAlert,
          confidenceScore: Math.round(avgBackendQualityScore)
        };
      }
      
      // Si no hay qualityScore, mantener el calculado
      return consolidatedAlert;
    });
  }, [consolidatedAlerts, alerts]);
};
