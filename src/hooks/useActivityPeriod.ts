
import { useState } from 'react';
import { addDays, addWeeks, addMonths, subWeeks, subMonths, format, startOfWeek, startOfMonth, startOfDay, endOfMonth, endOfWeek, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

export const useActivityPeriod = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState('week');
  const queryClient = useQueryClient();

  const getPeriodDates = () => {
    const start = (() => {
      switch (period) {
        case 'day':
          return startOfDay(currentDate);
        case 'month':
          return startOfMonth(currentDate);
        case 'week':
        default:
          return startOfWeek(currentDate, { locale: fr });
      }
    })();

    const end = (() => {
      switch (period) {
        case 'day':
          return endOfDay(currentDate);
        case 'month':
          return endOfMonth(currentDate);
        case 'week':
        default:
          return endOfWeek(currentDate, { locale: fr });
      }
    })();

    return { start, end };
  };

  const handleNavigateBack = () => {
    switch (period) {
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
    }
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const handleNavigateForward = () => {
    switch (period) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
    }
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day':
        return format(currentDate, 'dd MMMM yyyy', { locale: fr });
      case 'month': {
        const { start: periodStart, end: periodEnd } = getPeriodDates();
        return `${format(periodStart, 'd')} - ${format(periodEnd, 'd MMMM yyyy', { locale: fr })}`;
      }
      case 'week':
      default: {
        const { start: periodStart } = getPeriodDates();
        const weekEnd = addDays(periodStart, 6);
        return `${format(periodStart, 'dd')} - ${format(weekEnd, 'dd MMMM yyyy', { locale: fr })}`;
      }
    }
  };

  const getDaysInPeriod = () => {
    switch (period) {
      case 'day':
        return 1;
      case 'month':
        return endOfMonth(currentDate).getDate();
      case 'week':
      default:
        return 7;
    }
  };

  return {
    currentDate,
    period,
    setPeriod,
    getPeriodDates,
    handleNavigateBack,
    handleNavigateForward,
    getPeriodLabel,
    getDaysInPeriod,
  };
};
