/**
 * Calendar types for the Outlook-like calendar application
 */

// Appointment category enum matching Outlook color scheme
export const AppointmentCategory = {
  Blue: 'blue',
  Orange: 'orange',
  Purple: 'purple',
  Green: 'green',
  Red: 'red',
  LightBlue: 'lightBlue',
} as const;

export type AppointmentCategory = typeof AppointmentCategory[keyof typeof AppointmentCategory];

// Main appointment interface
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  category: AppointmentCategory;
  isAllDay: boolean;
  isMultiDay: boolean;
  isTeamsMeeting: boolean;
  attendees: string[];
}

// Calendar view type
export type CalendarViewType = 'week' | 'month';

// Form data for creating/editing appointments
export interface AppointmentFormData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  category: AppointmentCategory;
  isAllDay: boolean;
  attendees: string[];
  isTeamsMeeting: boolean;
}

// Context menu state
export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetDate?: Date;
  targetAppointment?: Appointment;
}

// Dialog mode for appointment dialog
export type DialogMode = 'create' | 'edit' | null;

// Navigation state
export interface CalendarNavigationState {
  currentDate: Date;
  viewType: CalendarViewType;
}

// Day cell info for month view
export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

// Time slot for week view
export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

// Helper to create default form data
export const createDefaultFormData = (targetDate?: Date): AppointmentFormData => {
  const now = targetDate || new Date();
  const startHour = now.getHours();
  const endHour = startHour + 1;
  
  return {
    title: '',
    description: '',
    location: '',
    startDate: now,
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endDate: now,
    endTime: `${endHour.toString().padStart(2, '0')}:00`,
    category: AppointmentCategory.Blue,
    isAllDay: false,
    attendees: [],
    isTeamsMeeting: false,
  };
};

// Helper to convert form data to appointment
export const formDataToAppointment = (
  formData: AppointmentFormData,
  existingId?: string
): Appointment => {
  const [startHour, startMinute] = formData.startTime.split(':').map(Number);
  const [endHour, endMinute] = formData.endTime.split(':').map(Number);
  
  const start = new Date(formData.startDate);
  start.setHours(startHour, startMinute, 0, 0);
  
  const end = new Date(formData.endDate);
  end.setHours(endHour, endMinute, 0, 0);
  
  const isMultiDay = formData.startDate.toDateString() !== formData.endDate.toDateString();
  
  return {
    id: existingId || crypto.randomUUID(),
    title: formData.title,
    description: formData.description || undefined,
    location: formData.location || undefined,
    start,
    end,
    category: formData.category,
    isAllDay: formData.isAllDay,
    isMultiDay,
    isTeamsMeeting: formData.isTeamsMeeting,
    attendees: formData.attendees,
  };
};

// Helper to convert appointment to form data
export const appointmentToFormData = (appointment: Appointment): AppointmentFormData => {
  return {
    title: appointment.title,
    description: appointment.description || '',
    location: appointment.location || '',
    startDate: appointment.start,
    startTime: `${appointment.start.getHours().toString().padStart(2, '0')}:${appointment.start.getMinutes().toString().padStart(2, '0')}`,
    endDate: appointment.end,
    endTime: `${appointment.end.getHours().toString().padStart(2, '0')}:${appointment.end.getMinutes().toString().padStart(2, '0')}`,
    category: appointment.category,
    isAllDay: appointment.isAllDay,
    attendees: appointment.attendees,
    isTeamsMeeting: appointment.isTeamsMeeting,
  };
};
