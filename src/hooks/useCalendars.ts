/**
 * Hook for fetching and managing Outlook calendars
 */

import { useState, useCallback, useEffect } from 'react';
import { Office365OutlookService } from '../generated/services/Office365OutlookService';
import type { Table } from '../generated/models/Office365OutlookModel';

export interface Calendar {
  id: string;
  name: string;
}

export interface UseCalendarsReturn {
  calendars: Calendar[];
  selectedCalendarId: string;
  isLoading: boolean;
  error: string | null;
  selectCalendar: (calendarId: string) => void;
  refreshCalendars: () => Promise<void>;
}

const DEFAULT_CALENDAR_ID = 'Calendar';

export const useCalendars = (isInitialized: boolean): UseCalendarsReturn => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(DEFAULT_CALENDAR_ID);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendars from Office365
  const fetchCalendars = useCallback(async () => {
    if (!isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await Office365OutlookService.CalendarGetTables();

      if (result.data?.value) {
        const mappedCalendars: Calendar[] = result.data.value.map((table: Table) => ({
          id: table.Name || '',
          name: table.DisplayName || table.Name || 'Sans nom',
        }));
        setCalendars(mappedCalendars);

        // Select "Calendar" by default if it exists, otherwise keep current or select first
        if (mappedCalendars.length > 0) {
          const defaultCalendar = mappedCalendars.find((c) => c.name === DEFAULT_CALENDAR_ID);
          const currentExists = mappedCalendars.some((c) => c.id === selectedCalendarId);
          
          if (defaultCalendar && selectedCalendarId === DEFAULT_CALENDAR_ID) {
            // Keep the default "Calendar" selected
            setSelectedCalendarId(DEFAULT_CALENDAR_ID);
          } else if (!currentExists) {
            // If current selection doesn't exist, prefer "Calendar" or fallback to first
            setSelectedCalendarId(defaultCalendar ? DEFAULT_CALENDAR_ID : mappedCalendars[0].id);
          }
        }
      } else {
        setCalendars([]);
      }
    } catch (err) {
      console.error('Error fetching calendars:', err);
      setError('Erreur lors du chargement des calendriers');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, selectedCalendarId]);

  // Fetch calendars on initialization
  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  // Select a calendar
  const selectCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarId(calendarId);
  }, []);

  // Refresh calendars manually
  const refreshCalendars = useCallback(async () => {
    await fetchCalendars();
  }, [fetchCalendars]);

  return {
    calendars,
    selectedCalendarId,
    isLoading,
    error,
    selectCalendar,
    refreshCalendars,
  };
};

export default useCalendars;
