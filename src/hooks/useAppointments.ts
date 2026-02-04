/**
 * Hook for managing appointments with Office365 Outlook integration (CRUD operations)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
} from 'date-fns';
import type { Appointment, AppointmentFormData } from '../types/calendar';
import { Office365OutlookService } from '../generated/services/Office365OutlookService';
import {
  mapOutlookToAppointment,
  mapFormDataToOutlook,
  createTempAppointment,
} from '../utils/appointmentMapper';

export interface UseAppointmentsReturn {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  addAppointment: (formData: AppointmentFormData) => Promise<Appointment | null>;
  updateAppointment: (id: string, formData: AppointmentFormData) => Promise<Appointment | null>;
  deleteAppointment: (id: string) => Promise<boolean>;
  refreshAppointments: () => Promise<void>;
  getAppointmentsForDate: (date: Date) => Appointment[];
  getAppointmentsForRange: (start: Date, end: Date) => Appointment[];
  getAllDayAppointments: (date: Date) => Appointment[];
  getMultiDayAppointments: (start: Date, end: Date) => Appointment[];
  getTimeSlotAppointments: (date: Date) => Appointment[];
}

export const useAppointments = (
  startDate: Date,
  endDate: Date,
  isInitialized: boolean,
  calendarId: string = 'Calendar'
): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track previous appointments for rollback
  const previousAppointmentsRef = useRef<Appointment[]>([]);

  // Fetch appointments from Office365
  const fetchAppointments = useCallback(async () => {
    if (!isInitialized || !calendarId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Format dates for API - use start of day for start and end of day for end
      const startDateUtc = startOfDay(startDate).toISOString();
      const endDateUtc = endOfDay(endDate).toISOString();
      
      const result = await Office365OutlookService.GetEventsCalendarViewV3(
        calendarId,
        startDateUtc,
        endDateUtc
      );
      
      if (result.data?.value) {
        const mappedAppointments = result.data.value.map(mapOutlookToAppointment);
        setAppointments(mappedAppointments);
        previousAppointmentsRef.current = mappedAppointments;
      } else {
        setAppointments([]);
        previousAppointmentsRef.current = [];
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Erreur lors du chargement des rendez-vous');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, isInitialized, calendarId]);

  // Fetch appointments when date range changes or when initialized
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Refresh appointments (manual trigger)
  const refreshAppointments = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  // Add a new appointment (optimistic update)
  const addAppointment = useCallback(async (formData: AppointmentFormData): Promise<Appointment | null> => {
    // Create temporary appointment for optimistic update
    const tempAppointment = createTempAppointment(formData);
    
    // Store current state for potential rollback
    previousAppointmentsRef.current = appointments;
    
    // Optimistically add to local state
    setAppointments((prev) => [...prev, tempAppointment]);
    
    try {
      const outlookEvent = mapFormDataToOutlook(formData);
      console.log('Sending to API:', JSON.stringify(outlookEvent, null, 2));
      const result = await Office365OutlookService.V4CalendarPostItem(calendarId, outlookEvent);
      
      console.log('Sending to API:', JSON.stringify(result, null, 2));
      if (result.data) {
        // Replace temp appointment with real one from API
        const realAppointment = mapOutlookToAppointment(result.data);
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === tempAppointment.id ? realAppointment : apt))
        );
        previousAppointmentsRef.current = appointments;
        return realAppointment;
      } else {
        throw new Error('No data returned from API');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      // Rollback on error
      setAppointments(previousAppointmentsRef.current);
      throw new Error('Erreur lors de la création du rendez-vous');
    }
  }, [appointments]);

  // Update an existing appointment (optimistic update)
  const updateAppointment = useCallback(
    async (id: string, formData: AppointmentFormData): Promise<Appointment | null> => {
      // Store current state for potential rollback
      previousAppointmentsRef.current = appointments;
      
      // Create updated appointment for optimistic update
      const tempUpdated = createTempAppointment(formData);
      tempUpdated.id = id; // Keep original ID
      
      // Optimistically update local state
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...tempUpdated, id } : apt))
      );
      
      try {
        const outlookEvent = mapFormDataToOutlook(formData);
        const result = await Office365OutlookService.V4CalendarPatchItem(calendarId, id, outlookEvent);
        
        if (result.data) {
          // Update with real data from API
          const realAppointment = mapOutlookToAppointment(result.data);
          setAppointments((prev) =>
            prev.map((apt) => (apt.id === id ? realAppointment : apt))
          );
          previousAppointmentsRef.current = appointments;
          return realAppointment;
        } else {
          throw new Error('No data returned from API');
        }
      } catch (err) {
        console.error('Error updating appointment:', err);
        // Rollback on error
        setAppointments(previousAppointmentsRef.current);
        throw new Error('Erreur lors de la mise à jour du rendez-vous');
      }
    },
    [appointments]
  );

  // Delete an appointment (optimistic update)
  const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
    // Store current state for potential rollback
    previousAppointmentsRef.current = appointments;
    
    // Optimistically remove from local state
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    
    try {
      await Office365OutlookService.CalendarDeleteItem(calendarId, id);
      previousAppointmentsRef.current = appointments.filter((apt) => apt.id !== id);
      return true;
    } catch (err) {
      console.error('Error deleting appointment:', err);
      // Rollback on error
      setAppointments(previousAppointmentsRef.current);
      throw new Error('Erreur lors de la suppression du rendez-vous');
    }
  }, [appointments]);

  // Get appointments for a specific date
  const getAppointmentsForDate = useCallback(
    (date: Date): Appointment[] => {
      return appointments.filter((apt) => {
        // For multi-day appointments, check if date falls within range
        if (apt.isMultiDay || apt.isAllDay) {
          return isWithinInterval(date, {
            start: startOfDay(apt.start),
            end: endOfDay(apt.end),
          });
        }
        // For regular appointments, check if same day
        return isSameDay(apt.start, date);
      });
    },
    [appointments]
  );

  // Get appointments for a date range
  const getAppointmentsForRange = useCallback(
    (start: Date, end: Date): Appointment[] => {
      return appointments.filter((apt) => {
        return areIntervalsOverlapping(
          { start: apt.start, end: apt.end },
          { start: startOfDay(start), end: endOfDay(end) }
        );
      });
    },
    [appointments]
  );

  // Get all-day appointments for a specific date
  const getAllDayAppointments = useCallback(
    (date: Date): Appointment[] => {
      return appointments.filter((apt) => {
        if (!apt.isAllDay) return false;
        return isWithinInterval(date, {
          start: startOfDay(apt.start),
          end: endOfDay(apt.end),
        });
      });
    },
    [appointments]
  );

  // Get multi-day appointments that span the given range
  const getMultiDayAppointments = useCallback(
    (start: Date, end: Date): Appointment[] => {
      return appointments.filter((apt) => {
        if (!apt.isMultiDay && !apt.isAllDay) return false;
        return areIntervalsOverlapping(
          { start: apt.start, end: apt.end },
          { start: startOfDay(start), end: endOfDay(end) }
        );
      });
    },
    [appointments]
  );

  // Get time-slot appointments (not all-day) for a specific date
  const getTimeSlotAppointments = useCallback(
    (date: Date): Appointment[] => {
      return appointments.filter((apt) => {
        if (apt.isAllDay) return false;
        // For multi-day appointments that aren't all-day, include them on each day
        if (apt.isMultiDay) {
          return isWithinInterval(date, {
            start: startOfDay(apt.start),
            end: endOfDay(apt.end),
          });
        }
        return isSameDay(apt.start, date);
      });
    },
    [appointments]
  );

  return {
    appointments,
    isLoading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refreshAppointments,
    getAppointmentsForDate,
    getAppointmentsForRange,
    getAllDayAppointments,
    getMultiDayAppointments,
    getTimeSlotAppointments,
  };
};

export default useAppointments;
