import React from 'react';
import { Search, Filter, X, Calendar, Tag, Eye, AlertCircle } from 'lucide-react';
import type { AlertFilters } from '../hooks/useAlertFilters';

interface SearchAndFiltersProps {
  filters: AlertFilters;
  availableTypes: string[];
  onUpdateFilter: <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  filters,
  availableTypes,
  onUpdateFilter,
  onResetFilters,
  hasActiveFilters,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 mb-4 border border-slate-200">
      {/* Search Bar */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por símbolo (AAPL, TSLA, etc.)"
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilter('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onUpdateFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Priority Filter */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={filters.priority}
            onChange={(e) => onUpdateFilter('priority', e.target.value as AlertFilters['priority'])}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">🔥 Alta</option>
            <option value="medium">⚡ Media</option>
            <option value="low">📊 Baja</option>
          </select>
        </div>

        {/* Alert Type Filter */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Tag className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={filters.alertType}
            onChange={(e) => onUpdateFilter('alertType', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Todos los tipos</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {typeof type === 'string' ? type.replace(/_/g, ' ') : String(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Read Status Filter */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Eye className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={filters.readStatus}
            onChange={(e) => onUpdateFilter('readStatus', e.target.value as AlertFilters['readStatus'])}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="unread">No leídas</option>
            <option value="read">Leídas</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Calendar className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={filters.dateRange}
            onChange={(e) => onUpdateFilter('dateRange', e.target.value as AlertFilters['dateRange'])}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Todo el tiempo</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Mostrando <span className="font-bold text-blue-600">{filteredCount}</span> de{' '}
              <span className="font-bold text-gray-900">{totalCount}</span> alertas
            </span>
            {filteredCount === 0 && (
              <span className="text-orange-600 font-medium">
                No se encontraron resultados
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;
