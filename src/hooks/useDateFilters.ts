import { useState, useMemo } from 'react';

interface DateFilterOption {
  value: string;
  label: string;
  from?: string;
  to?: string;
}

// Función para obtener el rango de fechas de una semana específica
const getWeekRange = (year: number, month: number, weekNumber: number) => {
  const firstDay = new Date(year, month - 1, 1);
  const startOfMonth = new Date(firstDay);
  startOfMonth.setDate(1);
  
  // Ajustar al primer lunes de la semana
  const dayOfWeek = startOfMonth.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  startOfMonth.setDate(startOfMonth.getDate() + daysToMonday);
  
  // Calcular la semana específica
  const weekStart = new Date(startOfMonth);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return { start: weekStart, end: weekEnd };
};

// Función para generar opciones de filtros de fecha
const generateDateFilterOptions = (): DateFilterOption[] => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  const options: DateFilterOption[] = [
    { value: 'all', label: '📅 Todas las fechas' },
  ];
  
  // === FILTROS RÁPIDOS ===
  
  // Últimos 7 días
  const last7Days = new Date(currentDate);
  last7Days.setDate(currentDate.getDate() - 7);
  last7Days.setHours(0, 0, 0, 0);
  options.push({
    value: 'last-7-days',
    label: '🔥 Últimos 7 días',
    from: last7Days.toISOString(),
    to: new Date(currentDate.setHours(23, 59, 59, 999)).toISOString()
  });
  
  // Últimos 30 días
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  last30Days.setHours(0, 0, 0, 0);
  const currentDateEnd = new Date();
  currentDateEnd.setHours(23, 59, 59, 999);
  options.push({
    value: 'last-30-days',
    label: '📊 Últimos 30 días',
    from: last30Days.toISOString(),
    to: currentDateEnd.toISOString()
  });
  
  // Este mes
  const thisMonthStart = new Date(currentYear, new Date().getMonth(), 1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthEnd = new Date();
  thisMonthEnd.setHours(23, 59, 59, 999);
  options.push({
    value: 'this-month',
    label: '📆 Este mes',
    from: thisMonthStart.toISOString(),
    to: thisMonthEnd.toISOString()
  });
  
  // Mes pasado
  const lastMonthStart = new Date(currentYear, new Date().getMonth() - 1, 1);
  lastMonthStart.setHours(0, 0, 0, 0);
  const lastMonthEnd = new Date(currentYear, new Date().getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);
  const lastMonthName = lastMonthStart.toLocaleDateString('es-ES', { month: 'long' });
  options.push({
    value: 'last-month',
    label: `📈 Mes pasado (${lastMonthName})`,
    from: lastMonthStart.toISOString(),
    to: lastMonthEnd.toISOString()
  });
  
  // Este trimestre
  const currentQuarter = Math.floor(new Date().getMonth() / 3);
  const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
  quarterStart.setHours(0, 0, 0, 0);
  const quarterEnd = new Date();
  quarterEnd.setHours(23, 59, 59, 999);
  options.push({
    value: 'this-quarter',
    label: '📉 Este trimestre',
    from: quarterStart.toISOString(),
    to: quarterEnd.toISOString()
  });
  
  // Este año
  const yearStart = new Date(currentYear, 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearEnd = new Date();
  yearEnd.setHours(23, 59, 59, 999);
  options.push({
    value: 'this-year',
    label: '🎯 Este año',
    from: yearStart.toISOString(),
    to: yearEnd.toISOString()
  });
  
  // === SEPARADOR ===
  options.push({
    value: 'separator',
    label: '──────────────────'
  });
  
  // === FILTROS POR SEMANA ===
  
  // Generar opciones para los últimos 3 meses
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const targetDate = new Date(currentYear, currentDate.getMonth() - monthOffset, 1);
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();
    const monthName = targetDate.toLocaleDateString('es-ES', { month: 'long' });
    
    // Calcular número de semanas en el mes
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeksInMonth = Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);
    
    for (let week = 1; week <= weeksInMonth; week++) {
      const weekRange = getWeekRange(year, month, week);
      
      // Solo agregar si la semana no es futura
      if (weekRange.start <= new Date()) {
        const startDay = weekRange.start.getDate();
        const endDay = weekRange.end.getDate();
        
        const weekStart = new Date(weekRange.start);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekRange.end);
        weekEnd.setHours(23, 59, 59, 999);
        
        options.push({
          value: `${year}-${month.toString().padStart(2, '0')}-w${week}`,
          label: `   Semana ${week} de ${monthName} (${startDay}-${endDay})`,
          from: weekStart.toISOString(),
          to: weekEnd.toISOString()
        });
      }
    }
  }
  
  return options;
};

export const useDateFilters = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Generar opciones de filtros de fecha (memoizado)
  const filterOptions = useMemo(() => generateDateFilterOptions(), []);
  
  // Obtener fechas de filtro basadas en la opción seleccionada
  const dateRange = useMemo(() => {
    const selectedOption = filterOptions.find(option => option.value === selectedFilter);
    if (selectedOption && selectedOption.from && selectedOption.to) {
      return { from: selectedOption.from, to: selectedOption.to };
    }
    return { from: undefined, to: undefined };
  }, [selectedFilter, filterOptions]);
  
  return {
    selectedFilter,
    setSelectedFilter,
    filterOptions,
    dateRange
  };
};
