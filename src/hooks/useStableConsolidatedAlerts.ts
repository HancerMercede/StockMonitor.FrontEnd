import { useRef, useMemo } from 'react';
import type { Alert, ConsolidatedAlert } from '../types';

/**
 * Helper para crear una firma de las alertas de un símbolo
 * Esto permite detectar si realmente cambiaron las alertas
 */
const createAlertsSignature = (alerts: Alert[]): string => {
  return alerts
    .map(a => `${a.id}-${a.timestamp}`)
    .sort()
    .join('|');
};

/**
 * Hook optimizado que mantiene referencias estables de alertas consolidadas
 * Solo recalcula un símbolo si sus alertas cambiaron realmente
 */
export const useStableConsolidatedAlerts = (
  consolidatedAlerts: ConsolidatedAlert[]
): ConsolidatedAlert[] => {
  // Mantener referencia a las alertas consolidadas previas por símbolo
  const previousAlertsRef = useRef<Map<string, {
    consolidated: ConsolidatedAlert;
    signature: string;
  }>>(new Map());

  return useMemo(() => {
    const newMap = new Map<string, { consolidated: ConsolidatedAlert; signature: string }>();
    const result: ConsolidatedAlert[] = [];

    for (const newAlert of consolidatedAlerts) {
      const symbol = newAlert.symbol;
      const newSignature = createAlertsSignature(newAlert.rawAlerts);
      const previous = previousAlertsRef.current.get(symbol);

      // Si el símbolo existe y la firma es idéntica, reutilizar el objeto anterior
      if (previous && previous.signature === newSignature) {
        // ✅ REUTILIZAR REFERENCIA ANTERIOR (no re-render)
        newMap.set(symbol, previous);
        result.push(previous.consolidated);
      } else {
        // ✅ NUEVA ALERTA O CAMBIÓ → usar el nuevo objeto
        newMap.set(symbol, {
          consolidated: newAlert,
          signature: newSignature
        });
        result.push(newAlert);
      }
    }

    // Actualizar la referencia para la próxima ejecución
    previousAlertsRef.current = newMap;

    return result;
  }, [consolidatedAlerts]);
};
