import { useState, useMemo } from 'react';
import type { Alert, ConsolidatedAlert } from '../types';

export interface AlertFilters {
  searchQuery: string;
  priority: 'all' | 'high' | 'medium' | 'low';
  alertType: 'all' | string;
  readStatus: 'all' | 'read' | 'unread';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

const defaultFilters: AlertFilters = {
  searchQuery: '',
  priority: 'all',
  alertType: 'all',
  readStatus: 'all',
  dateRange: 'all',
};

export const useAlertFilters = <T extends Alert | ConsolidatedAlert>(alerts: T[]) => {
  const [filters, setFilters] = useState<AlertFilters>(defaultFilters);

  // Extract unique alert types from alerts
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    alerts.forEach(alert => {
      if ('type' in alert && alert.type) {
        // Convertir a string si no lo es
        const typeStr = typeof alert.type === 'string' ? alert.type : String(alert.type);
        types.add(typeStr);
      }
    });
    return Array.from(types).sort();
  }, [alerts]);

  // Apply filters to alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Search query filter (symbol)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const symbol = alert.symbol.toLowerCase();
        if (!symbol.includes(query)) return false;
      }

      // Priority filter
      if (filters.priority !== 'all') {
        const alertPriority = 'priority' in alert 
          ? (typeof alert.priority === 'number' 
              ? (alert.priority === 1 ? 'high' : alert.priority === 2 ? 'medium' : 'low')
              : alert.priority?.toLowerCase())
          : '';
        if (alertPriority !== filters.priority) return false;
      }

      // Alert type filter
      if (filters.alertType !== 'all') {
        const alertType = 'type' in alert 
          ? (typeof alert.type === 'string' ? alert.type : String(alert.type))
          : '';
        if (alertType !== filters.alertType) return false;
      }

      // Read status filter
      if (filters.readStatus !== 'all') {
        const isRead = 'isRead' in alert ? alert.isRead : false;
        if (filters.readStatus === 'read' && !isRead) return false;
        if (filters.readStatus === 'unread' && isRead) return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const alertDate = new Date('timestamp' in alert ? alert.timestamp : alert.lastUpdate);
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        switch (filters.dateRange) {
          case 'today':
            if (now.getTime() - alertDate.getTime() > dayMs) return false;
            break;
          case 'week':
            if (now.getTime() - alertDate.getTime() > 7 * dayMs) return false;
            break;
          case 'month':
            if (now.getTime() - alertDate.getTime() > 30 * dayMs) return false;
            break;
        }
      }

      return true;
    });
  }, [alerts, filters]);

  const updateFilter = <K extends keyof AlertFilters>(
    key: K,
    value: AlertFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.priority !== 'all' ||
      filters.alertType !== 'all' ||
      filters.readStatus !== 'all' ||
      filters.dateRange !== 'all'
    );
  }, [filters]);

  return {
    filters,
    filteredAlerts,
    availableTypes,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    totalCount: alerts.length,
    filteredCount: filteredAlerts.length,
  };
};
