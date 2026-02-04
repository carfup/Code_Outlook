/**
 * Hook for calendar navigation (date, view type, computed ranges)
 */

import { useState, useCallback, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import type { CalendarViewType, DayCell, TimeSlot } from '../types/calendar';

export interface UseCalendarNavigationReturn {
  currentDate: Date;
  viewType: CalendarViewType;
  setViewType: (viewType: CalendarViewType) => void;
  goNext: () => void;
  goPrevious: () => void;
  goToday: () => void;
  goToDate: (date: Date) => void;
  weekDays: Date[];
  monthDays: DayCell[];
  periodLabel: string;
  timeSlots: TimeSlot[];
}

// Generate time slots for day view (0:00 - 23:00, full 24 hours)
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour <= 23; hour++) {
    slots.push({
      hour,
      minute: 0,
      label: `${hour.toString().padStart(2, '0')}:00`,
    });
  }
  return slots;
};

export const useCalendarNavigation = (
  initialDate: Date = new Date(),
  initialViewType: CalendarViewType = 'week'
): UseCalendarNavigationReturn => {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [viewType, setViewType] = useState<CalendarViewType>(initialViewType);

  // Navigate to next period
  const goNext = useCallback(() => {
    setCurrentDate((date) =>
      viewType === 'week' ? addWeeks(date, 1) : addMonths(date, 1)
    );
  }, [viewType]);

  // Navigate to previous period
  const goPrevious = useCallback(() => {
    setCurrentDate((date) =>
      viewType === 'week' ? subWeeks(date, 1) : subMonths(date, 1)
    );
  }, [viewType]);

  // Navigate to today
  const goToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Navigate to specific date
  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Get days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get days for month view (including days from prev/next months to fill grid)
  const monthDays = useMemo((): DayCell[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      appointments: [], // Will be populated by useAppointments
    }));
  }, [currentDate]);

  // Generate period label
  const periodLabel = useMemo(() => {
    if (viewType === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const year = format(start, 'yyyy');
      const month = format(start, 'MMMM');
      const startDay = format(start, 'd');
      const endDay = format(end, 'd');
      
      // Check if week spans two months
      if (isSameMonth(start, end)) {
        return `${year}, ${month} ${startDay}-${endDay}`;
      } else {
        const endMonth = format(end, 'MMMM');
        return `${year}, ${month} ${startDay} - ${endMonth} ${endDay}`;
      }
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  }, [viewType, currentDate, weekDays]);

  // Time slots for week view
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  return {
    currentDate,
    viewType,
    setViewType,
    goNext,
    goPrevious,
    goToday,
    goToDate,
    weekDays,
    monthDays,
    periodLabel,
    timeSlots,
  };
};

export default useCalendarNavigation;
