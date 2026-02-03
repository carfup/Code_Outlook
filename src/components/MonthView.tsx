/**
 * MonthView component displaying a monthly calendar grid
 */

import React, { useState } from 'react';
import { makeStyles, tokens, Text, mergeClasses } from '@fluentui/react-components';
import { format, isSameDay, startOfDay, endOfDay, isWithinInterval, differenceInMinutes, addMinutes, setHours, setMinutes } from 'date-fns';
import type { Appointment, DayCell } from '../types/calendar';
import AppointmentCard from './AppointmentCard';
import { getCategoryColor } from '../utils/categoryColors';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  
  // Header row with day names
  headerRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    textAlign: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'capitalize',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    
    '&:first-child': {
      borderLeft: 'none',
    },
  },
  
  // Month grid
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridTemplateRows: 'repeat(6, 1fr)',
    flexGrow: 1,
    overflow: 'hidden',
  },
  
  // Day cell
  dayCell: {
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalXS,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    cursor: 'pointer',
    minHeight: '100px',
    transition: 'background-color 0.15s ease',
    
    '&:nth-child(7n+1)': {
      borderLeft: 'none',
    },
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dayCellDragOver: {
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: `inset 0 0 0 2px ${tokens.colorBrandForeground1}`,
  },
  dayCellOtherMonth: {
    backgroundColor: tokens.colorNeutralBackground3,
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  dayCellToday: {
    backgroundColor: tokens.colorBrandBackground2,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  
  // Day number
  dayNumber: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    marginBottom: tokens.spacingVerticalXXS,
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  dayNumberToday: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
  },
  dayNumberOtherMonth: {
    color: tokens.colorNeutralForeground4,
  },
  
  // Appointments container
  appointmentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
    flexGrow: 1,
  },
  
  // Multi-day event bar
  multiDayBar: {
    height: '20px',
    padding: '0 4px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForegroundOnBrand,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderRadius: tokens.borderRadiusSmall,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginBottom: '2px',
    
    '&:hover': {
      opacity: 0.9,
    },
  },
  multiDayBarStart: {
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    marginLeft: '-4px',
    paddingLeft: '8px',
  },
  multiDayBarEnd: {
    borderTopRightRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
    marginRight: '-4px',
  },
  multiDayBarContinue: {
    borderRadius: 0,
    marginLeft: '-4px',
    marginRight: '-4px',
  },
  
  // More appointments indicator
  moreIndicator: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    padding: '2px 4px',
    cursor: 'pointer',
    
    '&:hover': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline',
    },
  },
});

const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MAX_VISIBLE_APPOINTMENTS = 3;

interface MonthViewProps {
  monthDays: DayCell[];
  appointments: Appointment[];
  onContextMenu: (e: React.MouseEvent, date: Date, appointment?: Appointment) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onDateClick: (date: Date) => void;
  onAppointmentDrop?: (appointmentId: string, newStart: Date, newEnd: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  monthDays,
  appointments,
  onContextMenu,
  onAppointmentClick,
  onDateClick,
  onAppointmentDrop,
}) => {
  const styles = useStyles();
  
  // Drag and drop state
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [draggingAppointment, setDraggingAppointment] = useState<Appointment | null>(null);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    return appointments.filter((apt) => {
      if (apt.isMultiDay || apt.isAllDay) {
        return isWithinInterval(date, {
          start: startOfDay(apt.start),
          end: endOfDay(apt.end),
        });
      }
      return isSameDay(apt.start, date);
    });
  };

  // Check if multi-day event starts on this date
  const isMultiDayStart = (apt: Appointment, date: Date) => {
    return isSameDay(apt.start, date);
  };

  // Check if multi-day event ends on this date
  const isMultiDayEnd = (apt: Appointment, date: Date) => {
    return isSameDay(apt.end, date);
  };

  const handleCellContextMenu = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    const targetDate = new Date(date);
    targetDate.setHours(9, 0, 0, 0);
    onContextMenu(e, targetDate);
  };

  const handleAppointmentContextMenu = (
    e: React.MouseEvent,
    date: Date,
    appointment: Appointment
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, date, appointment);
  };

  // Drag and drop handlers
  const handleDragStart = (appointment: Appointment) => {
    setDraggingAppointment(appointment);
  };

  const handleDragEnd = () => {
    setDraggingAppointment(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    
    if (!onAppointmentDrop) return;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const appointmentId = data.appointmentId;
      
      // Find the original appointment
      const appointment = draggingAppointment || appointments.find(a => a.id === appointmentId);
      
      if (!appointment) return;
      
      // Calculate new times - preserve same time of day, just change date
      const originalHours = appointment.start.getHours();
      const originalMinutes = appointment.start.getMinutes();
      const newStart = setMinutes(setHours(date, originalHours), originalMinutes);
      
      // Preserve duration
      const originalDuration = differenceInMinutes(appointment.end, appointment.start);
      const newEnd = addMinutes(newStart, originalDuration);
      
      onAppointmentDrop(appointmentId, newStart, newEnd);
    } catch (err) {
      console.error('Error handling drop:', err);
    } finally {
      setDragOverDate(null);
      setDraggingAppointment(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header row with day names */}
      <div className={styles.headerRow}>
        {dayNames.map((day) => (
          <div key={day} className={styles.headerCell}>
            {day}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className={styles.monthGrid}>
        {monthDays.map((dayCell) => {
          const dayAppointments = getAppointmentsForDate(dayCell.date);
          const visibleAppointments = dayAppointments.slice(0, MAX_VISIBLE_APPOINTMENTS);
          const hiddenCount = dayAppointments.length - MAX_VISIBLE_APPOINTMENTS;
          const isDragOver = dragOverDate && isSameDay(dragOverDate, dayCell.date);

          return (
            <div
              key={dayCell.date.toISOString()}
              className={mergeClasses(
                styles.dayCell,
                !dayCell.isCurrentMonth && styles.dayCellOtherMonth,
                dayCell.isToday && styles.dayCellToday,
                isDragOver ? styles.dayCellDragOver : undefined
              )}
              onClick={() => onDateClick(dayCell.date)}
              onContextMenu={(e) => handleCellContextMenu(e, dayCell.date)}
              onDragOver={(e) => handleDragOver(e, dayCell.date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dayCell.date)}
            >
              {/* Day number */}
              <Text
                className={mergeClasses(
                  styles.dayNumber,
                  dayCell.isToday && styles.dayNumberToday,
                  !dayCell.isCurrentMonth && styles.dayNumberOtherMonth
                )}
              >
                {format(dayCell.date, 'd')}
              </Text>

              {/* Appointments */}
              <div className={styles.appointmentsContainer}>
                {visibleAppointments.map((apt) => {
                  const color = getCategoryColor(apt.category);
                  
                  // Multi-day or all-day events
                  if (apt.isMultiDay || apt.isAllDay) {
                    const isStart = isMultiDayStart(apt, dayCell.date);
                    const isEnd = isMultiDayEnd(apt, dayCell.date);
                    
                    return (
                      <div
                        key={apt.id}
                        className={mergeClasses(
                          styles.multiDayBar,
                          isStart && styles.multiDayBarStart,
                          isEnd && styles.multiDayBarEnd,
                          !isStart && !isEnd && styles.multiDayBarContinue
                        )}
                        style={{ backgroundColor: color.border }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                        onContextMenu={(e) =>
                          handleAppointmentContextMenu(e, dayCell.date, apt)
                        }
                      >
                        {(isStart || dayCell.date.getDay() === 1) && apt.title}
                      </div>
                    );
                  }
                  
                  // Regular appointments
                  return (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      compact
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                      onContextMenu={(e) =>
                        handleAppointmentContextMenu(e, dayCell.date, apt)
                      }
                      onDragStart={() => handleDragStart(apt)}
                      onDragEnd={handleDragEnd}
                    />
                  );
                })}

                {/* More indicator */}
                {hiddenCount > 0 && (
                  <Text className={styles.moreIndicator}>
                    +{hiddenCount} autres
                  </Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
