/**
 * AppointmentDialog component for creating and editing appointments
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Checkbox,
  Dropdown,
  Option,
  makeStyles,
  tokens,
  Field,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Location24Regular,
  People24Regular,
  Tag24Regular,
} from '@fluentui/react-icons';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import type { AppointmentFormData, Appointment, DialogMode } from '../types/calendar';
import {
  AppointmentCategory,
  createDefaultFormData,
  appointmentToFormData,
} from '../types/calendar';
import { getCategoryOptions } from '../utils/categoryColors';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '500px',
    width: '100%',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
  },
  dateTimeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  timeDropdown: {
    minWidth: '100px',
  },
  fieldWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  fullWidth: {
    width: '100%',
  },
  categoryOption: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  categoryDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  checkboxRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
  },
  deleteButton: {
    marginRight: 'auto',
  },
  htmlContent: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    minHeight: '80px',
    maxHeight: '200px',
    overflowY: 'auto',
    fontSize: tokens.fontSizeBase300,
    lineHeight: '1.5',
    '& a': {
      color: tokens.colorBrandForegroundLink,
    },
    '& p': {
      margin: `${tokens.spacingVerticalXS} 0`,
    },
    '& ul, & ol': {
      paddingLeft: tokens.spacingHorizontalL,
      margin: `${tokens.spacingVerticalXS} 0`,
    },
  },
});

// Helper to detect if content contains HTML
const containsHtml = (text: string): boolean => {
  return /<[a-z][\s\S]*>/i.test(text);
};

// Helper to sanitize HTML by removing script tags and event handlers
const sanitizeHtml = (html: string): string => {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']?javascript:[^"'\s>]*/gi, 'href="#"');
  return sanitized;
};

// Time options for dropdown
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      options.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

interface AppointmentDialogProps {
  mode: DialogMode;
  appointment?: Appointment;
  defaultDate?: Date;
  isSaving?: boolean;
  onSave: (formData: AppointmentFormData) => void;
  onDelete?: (appointment: Appointment) => void;
  onClose: () => void;
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  mode,
  appointment,
  defaultDate,
  isSaving = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const styles = useStyles();
  const categoryOptions = getCategoryOptions();

  const [formData, setFormData] = useState<AppointmentFormData>(() => {
    if (mode === 'edit' && appointment) {
      return appointmentToFormData(appointment);
    }
    return createDefaultFormData(defaultDate);
  });

  // Reset form when mode or appointment changes
  useEffect(() => {
    if (mode === 'edit' && appointment) {
      setFormData(appointmentToFormData(appointment));
    } else if (mode === 'create') {
      setFormData(createDefaultFormData(defaultDate));
    }
  }, [mode, appointment, defaultDate]);

  // Helper to parse time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper to convert minutes to time string
  const minutesToTime = (totalMinutes: number): string => {
    // Handle day overflow
    const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(normalizedMinutes / 60);
    const minutes = normalizedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Calculate duration in minutes between start and end time
  const getDurationMinutes = (): number => {
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);
    // Handle case where end is on next day
    if (endMinutes <= startMinutes) {
      return (24 * 60 - startMinutes) + endMinutes;
    }
    return endMinutes - startMinutes;
  };

  const handleInputChange = (field: keyof AppointmentFormData, value: unknown) => {
    if (field === 'startTime') {
      // When start time changes, maintain the duration
      const durationMinutes = getDurationMinutes();
      const newStartMinutes = timeToMinutes(value as string);
      const newEndMinutes = newStartMinutes + durationMinutes;
      const newEndTime = minutesToTime(newEndMinutes);
      
      // Check if we need to adjust the end date (if end time goes past midnight)
      const newEndDate = new Date(formData.endDate);
      if (newEndMinutes >= 24 * 60) {
        // If start date equals end date, move end date to next day
        if (formData.startDate.toDateString() === formData.endDate.toDateString()) {
          newEndDate.setDate(newEndDate.getDate() + 1);
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        startTime: value as string,
        endTime: newEndTime,
        endDate: newEndDate,
      }));
      return;
    }
    
    if (field === 'startDate') {
      // When start date changes, also update end date to maintain same day relationship
      const daysDiff = Math.round(
        (formData.endDate.getTime() - formData.startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const newEndDate = new Date(value as Date);
      newEndDate.setDate(newEndDate.getDate() + daysDiff);
      
      setFormData((prev) => ({
        ...prev,
        startDate: value as Date,
        endDate: newEndDate,
      }));
      return;
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      return; // Title is required
    }
    onSave(formData);
  };

  const handleDelete = () => {
    if (appointment && onDelete) {
      onDelete(appointment);
    }
  };

  const isOpen = mode !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            {mode === 'create' ? 'New Appointment' : 'Edit Appointment'}
          </DialogTitle>

          <DialogContent className={styles.form}>
            {/* Title */}
            <Field label="Title" required>
              <Input
                value={formData.title}
                onChange={(_, data) => handleInputChange('title', data.value)}
                placeholder="Add a title"
                autoFocus
              />
            </Field>

            {/* Date and Time - Start */}
            <Field label="Start">
              <div className={styles.dateTimeRow}>
                <DatePicker
                  value={formData.startDate}
                  onSelectDate={(date) => date && handleInputChange('startDate', date)}
                  formatDate={(date) =>
                    date?.toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }) || ''
                  }
                  firstDayOfWeek={0}
                  strings={{
                    months: [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ],
                    shortMonths: [
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ],
                    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    shortDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                    goToToday: 'Today',
                    prevMonthAriaLabel: 'Previous month',
                    nextMonthAriaLabel: 'Next month',
                    prevYearAriaLabel: 'Previous year',
                    nextYearAriaLabel: 'Next year',
                    closeButtonAriaLabel: 'Close',
                    monthPickerHeaderAriaLabel: '{0}, select to change year',
                    yearPickerHeaderAriaLabel: '{0}, select to change month',
                  }}
                />
                {!formData.isAllDay && (
                  <Dropdown
                    className={styles.timeDropdown}
                    value={formData.startTime}
                    selectedOptions={[formData.startTime]}
                    onOptionSelect={(_, data) =>
                      handleInputChange('startTime', data.optionValue)
                    }
                  >
                    {timeOptions.map((time) => (
                      <Option key={time} value={time}>
                        {time}
                      </Option>
                    ))}
                  </Dropdown>
                )}
              </div>
            </Field>

            {/* Date and Time - End */}
            <Field label="End">
              <div className={styles.dateTimeRow}>
                <DatePicker
                  value={formData.endDate}
                  onSelectDate={(date) => date && handleInputChange('endDate', date)}
                  formatDate={(date) =>
                    date?.toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }) || ''
                  }
                  firstDayOfWeek={0}
                  strings={{
                    months: [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ],
                    shortMonths: [
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ],
                    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    shortDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                    goToToday: 'Today',
                    prevMonthAriaLabel: 'Previous month',
                    nextMonthAriaLabel: 'Next month',
                    prevYearAriaLabel: 'Previous year',
                    nextYearAriaLabel: 'Next year',
                    closeButtonAriaLabel: 'Close',
                    monthPickerHeaderAriaLabel: '{0}, select to change year',
                    yearPickerHeaderAriaLabel: '{0}, select to change month',
                  }}
                />
                {!formData.isAllDay && (
                  <Dropdown
                    className={styles.timeDropdown}
                    value={formData.endTime}
                    selectedOptions={[formData.endTime]}
                    onOptionSelect={(_, data) =>
                      handleInputChange('endTime', data.optionValue)
                    }
                  >
                    {timeOptions.map((time) => (
                      <Option key={time} value={time}>
                        {time}
                      </Option>
                    ))}
                  </Dropdown>
                )}
              </div>
            </Field>

            {/* Checkboxes */}
            <div className={styles.checkboxRow}>
              <Checkbox
                checked={formData.isAllDay}
                onChange={(_, data) => handleInputChange('isAllDay', data.checked)}
                label="All day"
              />
              
            </div>

            {/* Location */}
            <Field label="Location">
              <div className={styles.fieldWithIcon}>
                <Location24Regular className={styles.icon} />
                <Input
                  className={styles.fullWidth}
                  value={formData.location}
                  onChange={(_, data) => handleInputChange('location', data.value)}
                  placeholder="Add a location"
                />
              </div>
            </Field>

            {/* Attendees */}
            <Field label="Invite people">
              <div className={styles.fieldWithIcon}>
                <People24Regular className={styles.icon} />
                <Input
                  className={styles.fullWidth}
                  value={formData.attendees.join(', ')}
                  onChange={(_, data) =>
                    handleInputChange(
                      'attendees',
                      data.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="emails separated by commas"
                />
              </div>
            </Field>

            {/* Category */}
            <Field label="Category">
              <div className={styles.fieldWithIcon}>
                <Tag24Regular className={styles.icon} />
                <Dropdown
                  className={styles.fullWidth}
                  value={
                    categoryOptions.find((c) => c.value === formData.category)?.label ||
                    'Bleu'
                  }
                  selectedOptions={[formData.category]}
                  onOptionSelect={(_, data) =>
                    handleInputChange('category', data.optionValue as AppointmentCategory)
                  }
                >
                  {categoryOptions.map((option) => (
                    <Option key={option.value} value={option.value} text={option.label}>
                      <span className={styles.categoryOption}>
                        <span
                          className={styles.categoryDot}
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </span>
                    </Option>
                  ))}
                </Dropdown>
              </div>
            </Field>

            {/* Description */}
            <Field label="Description">
              {formData.description && containsHtml(formData.description) ? (
                <div
                  className={styles.htmlContent}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.description) }}
                />
              ) : (
                <Textarea
                  value={formData.description}
                  onChange={(_, data) => handleInputChange('description', data.value)}
                  placeholder="Add a description"
                  resize="vertical"
                  rows={3}
                />
              )}
            </Field>
          </DialogContent>

          <DialogActions>
            {mode === 'edit' && appointment && (
              <Button
                appearance="subtle"
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </Button>
            )}
            <Button appearance="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AppointmentDialog;
