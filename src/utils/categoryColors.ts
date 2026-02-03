/**
 * Category color mapping matching Outlook color scheme
 */

import { AppointmentCategory } from '../types/calendar';

// Outlook-style category colors
export const categoryColors: Record<AppointmentCategory, { background: string; border: string; text: string }> = {
  [AppointmentCategory.Blue]: {
    background: '#E6F2FB',
    border: '#0078D4',
    text: '#0078D4',
  },
  [AppointmentCategory.Orange]: {
    background: '#FDF4EC',
    border: '#CA5010',
    text: '#CA5010',
  },
  [AppointmentCategory.Purple]: {
    background: '#F3F0F9',
    border: '#8764B8',
    text: '#8764B8',
  },
  [AppointmentCategory.Green]: {
    background: '#E8F5E9',
    border: '#107C10',
    text: '#107C10',
  },
  [AppointmentCategory.Red]: {
    background: '#FDECEC',
    border: '#D13438',
    text: '#D13438',
  },
  [AppointmentCategory.LightBlue]: {
    background: '#E3F2FD',
    border: '#0288D1',
    text: '#0288D1',
  },
};

// Get color scheme for a category
export const getCategoryColor = (category: AppointmentCategory) => {
  return categoryColors[category] || categoryColors[AppointmentCategory.Blue];
};

// Category display names (English)
export const categoryDisplayNames: Record<AppointmentCategory, string> = {
  [AppointmentCategory.Blue]: 'Blue',
  [AppointmentCategory.Orange]: 'Orange',
  [AppointmentCategory.Purple]: 'Purple',
  [AppointmentCategory.Green]: 'Green',
  [AppointmentCategory.Red]: 'Red',
  [AppointmentCategory.LightBlue]: 'Light Blue',
};

// Get all categories for dropdown
export const getCategoryOptions = () => {
  return Object.values(AppointmentCategory).map((category) => ({
    value: category,
    label: categoryDisplayNames[category],
    color: categoryColors[category].border,
  }));
};
