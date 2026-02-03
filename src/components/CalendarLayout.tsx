/**
 * CalendarLayout component - Main layout with sidebar and calendar area
 */

import React, { useState, useCallback, useMemo } from 'react';
import { makeStyles, tokens, Spinner, MessageBar, MessageBarBody } from '@fluentui/react-components';
import CalendarSidebar from './CalendarSidebar';
import CalendarHeader from './CalendarHeader';
import WeekView from './WeekView';
import MonthView from './MonthView';
import CalendarContextMenu from './CalendarContextMenu';
import AppointmentDialog from './AppointmentDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import { useAppointments } from '../hooks/useAppointments';
import { useCalendars } from '../hooks/useCalendars';
import { usePower } from '../PowerProvider';
import { useToast } from '../contexts/ToastContext';

import type {
  Appointment,
  AppointmentFormData,
  ContextMenuState,
  DialogMode,
} from '../types/calendar';

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  contentWrapper: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
  },
  calendarContent: {
    flexGrow: 1,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 100,
  },
  errorBar: {
    margin: tokens.spacingVerticalS,
  },
});

export const CalendarLayout: React.FC = () => {
  const styles = useStyles();
  const { isInitialized } = usePower();
  const { showSuccess, showError } = useToast();

  // Navigation hook
  const {
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
  } = useCalendarNavigation();

  // Compute date range based on view type
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewType === 'week') {
      return {
        rangeStart: weekDays[0],
        rangeEnd: weekDays[weekDays.length - 1],
      };
    } else {
      // For month view, use the full range of displayed days (including padding)
      return {
        rangeStart: monthDays[0]?.date ?? new Date(),
        rangeEnd: monthDays[monthDays.length - 1]?.date ?? new Date(),
      };
    }
  }, [viewType, weekDays, monthDays]);

  // Calendars hook
  const {
    calendars,
    selectedCalendarId,
    isLoading: isLoadingCalendars,
    error: calendarsError,
    selectCalendar,
  } = useCalendars(isInitialized);

  // Appointments hook with date range and selected calendar
  const {
    appointments,
    isLoading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getMultiDayAppointments,
    getTimeSlotAppointments,
  } = useAppointments(rangeStart, rangeEnd, isInitialized, selectedCalendarId);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date | undefined>();

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, date: Date, appointment?: Appointment) => {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        targetDate: date,
        targetAppointment: appointment,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Handle create new appointment
  const handleCreateNew = useCallback((date?: Date) => {
    setDialogDefaultDate(date);
    setEditingAppointment(undefined);
    setDialogMode('create');
  }, []);

  // Handle edit appointment
  const handleEdit = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setDialogMode('edit');
  }, []);

  // Handle delete request (show confirmation)
  const handleDeleteRequest = useCallback((appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (appointmentToDelete) {
      setIsDeleting(true);
      try {
        await deleteAppointment(appointmentToDelete.id);
        showSuccess('Appointment deleted');
        setAppointmentToDelete(null);
        setDeleteConfirmOpen(false);
        setDialogMode(null);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Error deleting appointment');
      } finally {
        setIsDeleting(false);
      }
    }
  }, [appointmentToDelete, deleteAppointment, showSuccess, showError]);

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setAppointmentToDelete(null);
    setDeleteConfirmOpen(false);
  }, []);

  // Handle dialog save
  const handleDialogSave = useCallback(
    async (formData: AppointmentFormData) => {
      setIsSaving(true);
      try {
        if (dialogMode === 'create') {
          await addAppointment(formData);
          showSuccess('Appointment created');
        } else if (dialogMode === 'edit' && editingAppointment) {
          await updateAppointment(editingAppointment.id, formData);
          showSuccess('Appointment updated');
        }
        setDialogMode(null);
        setEditingAppointment(undefined);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Error saving appointment');
      } finally {
        setIsSaving(false);
      }
    },
    [dialogMode, editingAppointment, addAppointment, updateAppointment, showSuccess, showError]
  );

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setDialogMode(null);
    setEditingAppointment(undefined);
  }, []);

  // Handle dialog delete
  const handleDialogDelete = useCallback(
    (appointment: Appointment) => {
      handleDeleteRequest(appointment);
    },
    [handleDeleteRequest]
  );

  // Handle appointment click
  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setDialogMode('edit');
  }, []);

  // Handle date click in month view (switch to week view)
  const handleDateClick = useCallback(
    (date: Date) => {
      goToDate(date);
      setViewType('week');
    },
    [goToDate, setViewType]
  );

  // Handle appointment drag and drop
  const handleAppointmentDrop = useCallback(
    async (appointmentId: string, newStart: Date, newEnd: Date) => {
      // Find the appointment being moved
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) return;

      // Create form data with updated times
      const formData: AppointmentFormData = {
        title: appointment.title,
        startDate: newStart,
        startTime: `${newStart.getHours().toString().padStart(2, '0')}:${newStart.getMinutes().toString().padStart(2, '0')}`,
        endDate: newEnd,
        endTime: `${newEnd.getHours().toString().padStart(2, '0')}:${newEnd.getMinutes().toString().padStart(2, '0')}`,
        isAllDay: appointment.isAllDay,
        isTeamsMeeting: appointment.isTeamsMeeting,
        location: appointment.location || '',
        description: appointment.description || '',
        attendees: appointment.attendees || [],
        category: appointment.category,
      };

      try {
        await updateAppointment(appointmentId, formData);
        showSuccess('Appointment moved');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Error moving appointment');
      }
    },
    [appointments, updateAppointment, showSuccess, showError]
  );

  return (
    <div className={styles.layout}>

      <div className={styles.contentWrapper}>
        {/* Sidebar with mini calendar */}
        <CalendarSidebar
          selectedDate={currentDate}
          onDateSelect={goToDate}
          onTodayClick={goToday}
          calendars={calendars}
          selectedCalendarId={selectedCalendarId}
          onCalendarSelect={selectCalendar}
          isLoadingCalendars={isLoadingCalendars}
          calendarsError={calendarsError}
        />

        {/* Main content */}
        <main className={styles.main}>
          {/* Header with navigation and view toggle */}
          <CalendarHeader
            periodLabel={periodLabel}
            viewType={viewType}
            onPrevious={goPrevious}
            onNext={goNext}
            onToday={goToday}
            onViewTypeChange={setViewType}
          />

        {/* Calendar content */}
        <div className={styles.calendarContent}>
          {/* Loading overlay */}
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <Spinner size="large" label="Loading appointments..." />
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <MessageBar intent="error" className={styles.errorBar}>
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}
          
          {viewType === 'week' ? (
            <WeekView
              weekDays={weekDays}
              timeSlots={timeSlots}
              appointments={appointments}
              getTimeSlotAppointments={getTimeSlotAppointments}
              getMultiDayAppointments={getMultiDayAppointments}
              onContextMenu={handleContextMenu}
              onAppointmentClick={handleAppointmentClick}
              onAppointmentDrop={handleAppointmentDrop}
            />
          ) : (
            <MonthView
              monthDays={monthDays}
              appointments={appointments}
              onContextMenu={handleContextMenu}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={handleDateClick}
              onAppointmentDrop={handleAppointmentDrop}
            />
          )}
        </div>
      </main>
      </div>

      {/* Context menu */}
      <CalendarContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        targetDate={contextMenu.targetDate}
        targetAppointment={contextMenu.targetAppointment}
        onClose={closeContextMenu}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      {/* Appointment dialog */}
      <AppointmentDialog
        mode={dialogMode}
        appointment={editingAppointment}
        defaultDate={dialogDefaultDate}
        isSaving={isSaving}
        onSave={handleDialogSave}
        onDelete={handleDialogDelete}
        onClose={handleDialogClose}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        appointment={appointmentToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default CalendarLayout;
