/**
 * Timezone utility for mapping browser timezone to Office365 timezone format
 */

import type { GraphCalendarEventClienttimeZone } from '../generated/models/Office365OutlookModel';

/**
 * Mapping from IANA timezone identifiers to Office365 timezone strings
 */
const IANA_TO_OFFICE365_MAP: Record<string, GraphCalendarEventClienttimeZone> = {
  // UTC
  'UTC': '(UTC) Coordinated Universal Time',
  
  // Europe
  'Europe/London': '(UTC+00:00) Dublin, Edinburgh, Lisbon, London',
  'Europe/Dublin': '(UTC+00:00) Dublin, Edinburgh, Lisbon, London',
  'Europe/Lisbon': '(UTC+00:00) Dublin, Edinburgh, Lisbon, London',
  'Europe/Paris': '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
  'Europe/Brussels': '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
  'Europe/Madrid': '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
  'Europe/Copenhagen': '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
  'Europe/Amsterdam': '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Berlin': '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Rome': '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Stockholm': '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Vienna': '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Zurich': '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Prague': '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
  'Europe/Budapest': '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
  'Europe/Warsaw': '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb',
  'Europe/Athens': '(UTC+02:00) Athens, Bucharest',
  'Europe/Bucharest': '(UTC+02:00) Athens, Bucharest',
  'Europe/Helsinki': '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
  'Europe/Kiev': '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
  'Europe/Kyiv': '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
  'Europe/Sofia': '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
  'Europe/Istanbul': '(UTC+03:00) Istanbul',
  'Europe/Moscow': '(UTC+03:00) Moscow, St. Petersburg',
  
  // Americas
  'America/New_York': '(UTC-05:00) Eastern Time (US & Canada)',
  'America/Detroit': '(UTC-05:00) Eastern Time (US & Canada)',
  'America/Chicago': '(UTC-06:00) Central Time (US & Canada)',
  'America/Denver': '(UTC-07:00) Mountain Time (US & Canada)',
  'America/Phoenix': '(UTC-07:00) Arizona',
  'America/Los_Angeles': '(UTC-08:00) Pacific Time (US & Canada)',
  'America/Anchorage': '(UTC-09:00) Alaska',
  'Pacific/Honolulu': '(UTC-10:00) Hawaii',
  'America/Toronto': '(UTC-05:00) Eastern Time (US & Canada)',
  'America/Vancouver': '(UTC-08:00) Pacific Time (US & Canada)',
  'America/Halifax': '(UTC-04:00) Atlantic Time (Canada)',
  'America/St_Johns': '(UTC-03:30) Newfoundland',
  'America/Mexico_City': '(UTC-06:00) Guadalajara, Mexico City, Monterrey',
  'America/Bogota': '(UTC-05:00) Bogota, Lima, Quito, Rio Branco',
  'America/Lima': '(UTC-05:00) Bogota, Lima, Quito, Rio Branco',
  'America/Santiago': '(UTC-04:00) Santiago',
  'America/Buenos_Aires': '(UTC-03:00) City of Buenos Aires',
  'America/Sao_Paulo': '(UTC-03:00) Brasilia',
  
  // Asia
  'Asia/Jerusalem': '(UTC+02:00) Jerusalem',
  'Asia/Beirut': '(UTC+02:00) Beirut',
  'Asia/Dubai': '(UTC+04:00) Abu Dhabi, Muscat',
  'Asia/Karachi': '(UTC+05:00) Islamabad, Karachi',
  'Asia/Kolkata': '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
  'Asia/Calcutta': '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
  'Asia/Dhaka': '(UTC+06:00) Dhaka',
  'Asia/Bangkok': '(UTC+07:00) Bangkok, Hanoi, Jakarta',
  'Asia/Jakarta': '(UTC+07:00) Bangkok, Hanoi, Jakarta',
  'Asia/Ho_Chi_Minh': '(UTC+07:00) Bangkok, Hanoi, Jakarta',
  'Asia/Singapore': '(UTC+08:00) Kuala Lumpur, Singapore',
  'Asia/Kuala_Lumpur': '(UTC+08:00) Kuala Lumpur, Singapore',
  'Asia/Hong_Kong': '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi',
  'Asia/Shanghai': '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi',
  'Asia/Taipei': '(UTC+08:00) Taipei',
  'Asia/Seoul': '(UTC+09:00) Seoul',
  'Asia/Tokyo': '(UTC+09:00) Osaka, Sapporo, Tokyo',
  
  // Australia & Pacific
  'Australia/Perth': '(UTC+08:00) Perth',
  'Australia/Darwin': '(UTC+09:30) Darwin',
  'Australia/Adelaide': '(UTC+09:30) Adelaide',
  'Australia/Brisbane': '(UTC+10:00) Brisbane',
  'Australia/Sydney': '(UTC+10:00) Canberra, Melbourne, Sydney',
  'Australia/Melbourne': '(UTC+10:00) Canberra, Melbourne, Sydney',
  'Australia/Hobart': '(UTC+10:00) Hobart',
  'Pacific/Auckland': '(UTC+12:00) Auckland, Wellington',
  'Pacific/Fiji': '(UTC+12:00) Fiji',
  
  // Africa
  'Africa/Cairo': '(UTC+02:00) Cairo',
  'Africa/Johannesburg': '(UTC+02:00) Harare, Pretoria',
  'Africa/Lagos': '(UTC+01:00) West Central Africa',
  'Africa/Nairobi': '(UTC+03:00) Nairobi',
  'Africa/Casablanca': '(UTC+00:00) Casablanca',
};

/**
 * Default timezone when browser timezone is not found in the mapping
 */
const DEFAULT_TIMEZONE: GraphCalendarEventClienttimeZone = '(UTC) Coordinated Universal Time';

/**
 * Gets the browser's current timezone in Office365 format
 * @returns Office365 timezone string that can be used with GraphCalendarEventClient
 */
export const getBrowserTimezone = (): GraphCalendarEventClienttimeZone => {
  try {
    const ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return IANA_TO_OFFICE365_MAP[ianaTimezone] ?? DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Gets the IANA timezone identifier for the browser
 * @returns IANA timezone string (e.g., 'Europe/Paris')
 */
export const getBrowserIanaTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/**
 * Formats a Date object to ISO string without timezone (for Office365 API)
 * @param date The date to format
 * @returns ISO formatted string without timezone (e.g., '2017-08-29T04:00:00')
 */
export const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Parses an Office365 date string to a JavaScript Date object
 * @param dateString The date string from Office365 (e.g., '2017-08-29T04:00:00.0000000')
 * @returns JavaScript Date object
 */
export const parseApiDate = (dateString: string): Date => {
  // Remove extra precision if present and parse
  const cleanedString = dateString.replace(/\.\d+$/, '');
  return new Date(cleanedString);
};
