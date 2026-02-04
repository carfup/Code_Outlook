/**
 * CalendarSidebar component with mini calendar for quick date navigation
 * and calendar list for switching between Outlook calendars
 */

import React from 'react';
import { Calendar } from '@fluentui/react-calendar-compat';
import {
  makeStyles,
  tokens,
  Text,
  Checkbox,
  Spinner,
  Divider,
} from '@fluentui/react-components';
import { CalendarMultiple20Regular } from '@fluentui/react-icons';
import type { Calendar as OutlookCalendar } from '../hooks/useCalendars';

const useStyles = makeStyles({
  sidebar: {
    width: '200px',
    minWidth: '200px',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  todayButton: {
    width: '100%',
  },
  calendarWrapper: {
    '& .ms-Calendar': {
      width: '100%',
    },
    // Hide the navigation arrows
    '& .fui-Calendar__header button': {
      display: 'none',
    },
  },
  calendarsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  calendarsSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingBottom: tokens.spacingVerticalXS,
  },
  calendarsSectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  calendarsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  calendarItem: {
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  calendarItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  calendarItemLabel: {
    marginLeft: tokens.spacingHorizontalXS,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalM,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
});

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTodayClick: () => void;
  calendars: OutlookCalendar[];
  selectedCalendarId: string;
  onCalendarSelect: (calendarId: string) => void;
  isLoadingCalendars: boolean;
  calendarsError: string | null;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  selectedDate,
  onDateSelect,
  calendars,
  selectedCalendarId,
  onCalendarSelect,
  isLoadingCalendars,
  calendarsError,
}) => {
  const styles = useStyles();

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
  };

  const handleCalendarClick = (calendarId: string) => {
    onCalendarSelect(calendarId);
  };

  return (
    <aside className={styles.sidebar}>
      
      
      <div className={styles.calendarWrapper}>
        <Calendar
          value={selectedDate}
          onSelectDate={handleDateSelect}
          firstDayOfWeek={0} // Sunday
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
      </div>

      <Divider />

      {/* Calendars list */}
      <div className={styles.calendarsSection}>
        <div className={styles.calendarsSectionHeader}>
          <CalendarMultiple20Regular />
          <Text className={styles.calendarsSectionTitle}>My Calendars</Text>
        </div>

        {isLoadingCalendars ? (
          <div className={styles.loadingContainer}>
            <Spinner size="small" label="Loading..." />
          </div>
        ) : calendarsError ? (
          <Text className={styles.errorText}>{calendarsError}</Text>
        ) : (
          <div className={styles.calendarsList}>
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className={`${styles.calendarItem} ${
                  selectedCalendarId === calendar.id ? styles.calendarItemSelected : ''
                }`}
                onClick={() => handleCalendarClick(calendar.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCalendarClick(calendar.id);
                  }
                }}
              >
                <Checkbox
                  checked={selectedCalendarId === calendar.id}
                  onChange={() => handleCalendarClick(calendar.id)}
                />
                <Text className={styles.calendarItemLabel}>{calendar.name}</Text>
              </div>
            ))}
            {calendars.length === 0 && (
              <Text>No calendar found</Text>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default CalendarSidebar;
