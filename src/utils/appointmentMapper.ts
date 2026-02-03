/**
 * Appointment mapper utility for converting between Office365 and local appointment formats
 */

import type { GraphCalendarEventClientReceive, GraphCalendarEventClient } from '../generated/models/Office365OutlookModel';
import type { Appointment, AppointmentFormData, AppointmentCategory } from '../types/calendar';
import { AppointmentCategory as CategoryEnum } from '../types/calendar';
import { getBrowserTimezone, formatDateForApi, parseApiDate } from './timezone';

/**
 * Mapping from Outlook category names to app category values
 */
const OUTLOOK_TO_APP_CATEGORY: Record<string, AppointmentCategory> = {
  'blue category': CategoryEnum.Blue,
  'blue': CategoryEnum.Blue,
  'orange category': CategoryEnum.Orange,
  'orange': CategoryEnum.Orange,
  'purple category': CategoryEnum.Purple,
  'purple': CategoryEnum.Purple,
  'green category': CategoryEnum.Green,
  'green': CategoryEnum.Green,
  'red category': CategoryEnum.Red,
  'red': CategoryEnum.Red,
  'yellow category': CategoryEnum.LightBlue, // Map yellow to lightBlue as closest match
  'yellow': CategoryEnum.LightBlue,
};

/**
 * Mapping from app category values to Outlook category names
 */
const APP_TO_OUTLOOK_CATEGORY: Record<AppointmentCategory, string> = {
  [CategoryEnum.Blue]: 'Blue category',
  [CategoryEnum.Orange]: 'Orange category',
  [CategoryEnum.Purple]: 'Purple category',
  [CategoryEnum.Green]: 'Green category',
  [CategoryEnum.Red]: 'Red category',
  [CategoryEnum.LightBlue]: 'Yellow category', // Map lightBlue to Yellow
};

/**
 * Default category when no matching category is found
 */
const DEFAULT_CATEGORY: AppointmentCategory = CategoryEnum.Blue;

/**
 * Maps an Outlook category array to an app category
 * @param categories Array of Outlook category strings
 * @returns The first matching app category or default
 */
const mapOutlookCategory = (categories?: string[]): AppointmentCategory => {
  if (!categories || categories.length === 0) {
    return DEFAULT_CATEGORY;
  }
  
  // Try to find a matching category (case-insensitive)
  for (const cat of categories) {
    const normalizedCat = cat.toLowerCase().trim();
    if (OUTLOOK_TO_APP_CATEGORY[normalizedCat]) {
      return OUTLOOK_TO_APP_CATEGORY[normalizedCat];
    }
  }
  
  return DEFAULT_CATEGORY;
};

/**
 * Maps an app category to Outlook category array
 * @param category App category value
 * @returns Array with single Outlook category string
 */
const mapAppCategory = (category: AppointmentCategory): string[] => {
  return [APP_TO_OUTLOOK_CATEGORY[category] || 'Blue category'];
};

/**
 * Parses semicolon-separated attendees string to array
 * @param attendeesString Semicolon-separated email addresses
 * @returns Array of email addresses
 */
const parseAttendees = (attendeesString?: string): string[] => {
  if (!attendeesString) return [];
  return attendeesString
    .split(';')
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

/**
 * Joins attendees array to semicolon-separated string
 * @param attendees Array of email addresses
 * @returns Semicolon-separated string
 */
const joinAttendees = (attendees: string[]): string => {
  return attendees.filter(email => email.trim().length > 0).join(';');
};

/**
 * Detects if an event is a Teams meeting based on webLink
 * @param webLink The webLink from the Outlook event
 * @returns True if it's a Teams meeting
 */
const isTeamsMeeting = (webLink?: string): boolean => {
  if (!webLink) return false;
  return webLink.toLowerCase().includes('teams.microsoft.com');
};

/**
 * Computes if an appointment spans multiple days
 * @param start Start date
 * @param end End date
 * @returns True if the appointment spans multiple calendar days
 */
const computeIsMultiDay = (start: Date, end: Date): boolean => {
  return start.toDateString() !== end.toDateString();
};

/**
 * Maps an Office365 GraphCalendarEventClientReceive to local Appointment format
 * @param event The event from Office365 API
 * @returns Local Appointment object
 */
export const mapOutlookToAppointment = (event: GraphCalendarEventClientReceive): Appointment => {
  // Parse dates - prefer startWithTimeZone/endWithTimeZone if available
  const start = parseApiDate(event.startWithTimeZone || event.start || new Date().toISOString());
  const end = parseApiDate(event.endWithTimeZone || event.end || new Date().toISOString());
  
  const isAllDay = event.isAllDay ?? false;
  const isMultiDay = computeIsMultiDay(start, end);
  
  // Combine required and optional attendees
  const allAttendees = [
    ...parseAttendees(event.requiredAttendees),
    ...parseAttendees(event.optionalAttendees),
  ];
  
  return {
    id: event.id || crypto.randomUUID(),
    title: event.subject || 'Sans titre',
    description: event.body || undefined,
    location: event.location || undefined,
    start,
    end,
    category: mapOutlookCategory(event.categories),
    isAllDay,
    isMultiDay,
    isTeamsMeeting: isTeamsMeeting(event.webLink),
    attendees: allAttendees,
  };
};

/**
 * Maps local AppointmentFormData to Office365 GraphCalendarEventClient format
 * @param formData The form data from the UI
 * @returns GraphCalendarEventClient object for API calls
 */
export const mapFormDataToOutlook = (formData: AppointmentFormData): GraphCalendarEventClient => {
  // Build start and end dates from form data
  const [startHour, startMinute] = formData.startTime.split(':').map(Number);
  const [endHour, endMinute] = formData.endTime.split(':').map(Number);
  
  const start = new Date(formData.startDate);
  if (formData.isAllDay) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(startHour, startMinute, 0, 0);
  }
  
  const end = new Date(formData.endDate);
  if (formData.isAllDay) {
    // For all-day events, end should be the next day at midnight
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
  } else {
    end.setHours(endHour, endMinute, 0, 0);
  }
  
  return {
    subject: formData.title,
    start: formatDateForApi(start),
    end: formatDateForApi(end),
    timeZone: getBrowserTimezone(),
    body: formData.description || undefined,
    location: formData.location || undefined,
    isAllDay: formData.isAllDay,
    categories: mapAppCategory(formData.category),
    requiredAttendees: joinAttendees(formData.attendees) || undefined,
    importance: 'normal',
    showAs: 'busy',
    reminderMinutesBeforeStart: 15,
    isReminderOn: true,
  };
};

/**
 * Maps local Appointment to Office365 GraphCalendarEventClient format (for updates)
 * @param appointment The appointment object
 * @returns GraphCalendarEventClient object for API calls
 */
export const mapAppointmentToOutlook = (appointment: Appointment): GraphCalendarEventClient => {
  return {
    subject: appointment.title,
    start: formatDateForApi(appointment.start),
    end: formatDateForApi(appointment.end),
    timeZone: getBrowserTimezone(),
    body: appointment.description || undefined,
    location: appointment.location || undefined,
    isAllDay: appointment.isAllDay,
    categories: mapAppCategory(appointment.category),
    requiredAttendees: joinAttendees(appointment.attendees) || undefined,
    importance: 'normal',
    showAs: 'busy',
    reminderMinutesBeforeStart: 15,
    isReminderOn: true,
  };
};

/**
 * Creates a temporary appointment for optimistic updates
 * @param formData The form data
 * @returns A temporary Appointment with a generated ID
 */
export const createTempAppointment = (formData: AppointmentFormData): Appointment => {
  const [startHour, startMinute] = formData.startTime.split(':').map(Number);
  const [endHour, endMinute] = formData.endTime.split(':').map(Number);
  
  const start = new Date(formData.startDate);
  start.setHours(startHour, startMinute, 0, 0);
  
  const end = new Date(formData.endDate);
  end.setHours(endHour, endMinute, 0, 0);
  
  const isMultiDay = computeIsMultiDay(start, end);
  
  return {
    id: `temp-${crypto.randomUUID()}`,
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
