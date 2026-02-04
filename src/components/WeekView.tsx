/**
 * WeekView component displaying a 7-day calendar grid with time slots
 */

import React, { useRef, useEffect, useState } from 'react';
import { makeStyles, tokens, Text, mergeClasses } from '@fluentui/react-components';
import { format, isToday, isSameDay, differenceInMinutes, startOfDay, isBefore, isAfter, setHours, setMinutes, addMinutes } from 'date-fns';
import type { Appointment, TimeSlot } from '../types/calendar';
import AppointmentCard from './AppointmentCard';
import { getCategoryColor } from '../utils/categoryColors';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  
  // All-day events row
  allDayRow: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '40px',
    backgroundColor: tokens.colorNeutralBackground2,
    paddingRight: '8px', // Compensate for scrollbar width
  },
  allDayLabel: {
    padding: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '8px',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  allDayEventsWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px 0',
    overflow: 'visible',
  },
  allDayDaySeparators: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    pointerEvents: 'none',
  },
  allDaySeparatorCell: {
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  allDayEventsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    position: 'relative',
    zIndex: 1,
  },
  allDayEventBar: {
    height: '22px',
    padding: '2px 6px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForegroundOnBrand,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      opacity: 0.9,
    },
  },
  
  // Header row with day names
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '60px repeat(7, 1fr)',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingRight: '8px', // Compensate for scrollbar width
  },
  headerCorner: {
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    textAlign: 'center',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerCellToday: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  dayName: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  dayNumberToday: {
    color: tokens.colorBrandForeground1,
  },
  
  // Grid body
  gridBody: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'auto',
  },
  
  // Time column
  timeColumn: {
    width: '60px',
    minWidth: '60px',
    flexShrink: 0,
  },
  timeSlot: {
    height: '60px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '2px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  
  // Days grid
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    flexGrow: 1,
  },
  dayColumn: {
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    position: 'relative',
  },
  dayColumnToday: {
    backgroundColor: tokens.colorBrandBackground2Hover,
  },
  timeSlotCell: {
    height: '60px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    position: 'relative',
    transition: 'background-color 0.15s ease',
  },
  timeSlotCellDragOver: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  dropIndicator: {
    position: 'absolute',
    left: '2px',
    right: '2px',
    height: '2px',
    backgroundColor: tokens.colorBrandForeground1,
    borderRadius: '1px',
    pointerEvents: 'none',
    zIndex: 10,
  },
  
  // Appointments positioning
  appointmentWrapper: {
    position: 'absolute',
    left: '2px',
    right: '2px',
    zIndex: 1,
    overflow: 'hidden',
    height: 'auto',
  },
});

interface WeekViewProps {
  weekDays: Date[];
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  getTimeSlotAppointments: (date: Date) => Appointment[];
  getMultiDayAppointments: (start: Date, end: Date) => Appointment[];
  onContextMenu: (e: React.MouseEvent, date: Date, appointment?: Appointment) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentDrop?: (appointmentId: string, newStart: Date, newEnd: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  timeSlots,
  getTimeSlotAppointments,
  getMultiDayAppointments,
  onContextMenu,
  onAppointmentClick,
  onAppointmentDrop,
}) => {
  const styles = useStyles();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Drag and drop state
  const [dragOverCell, setDragOverCell] = useState<{ dayIndex: number; hour: number; minute: number } | null>(null);
  const [draggingAppointment, setDraggingAppointment] = useState<Appointment | null>(null);

  // Scroll to current hour (if within work hours) or work start time (8 AM)
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // If current hour is within work hours (7-18), scroll to current hour minus 1 for context
      // Otherwise, scroll to work start (8 AM)
      const scrollHour = (currentHour >= 7 && currentHour <= 18) 
        ? Math.max(0, currentHour - 1) 
        : 8;
      
      // Each hour = 60px (1 minute = 1 pixel)
      scrollRef.current.scrollTop = scrollHour * 60;
    }
  }, []);

  // Calculate appointment position based on time
  const getAppointmentStyle = (appointment: Appointment, date: Date) => {
    const dayStart = startOfDay(date);
    
    // Get appointment start time on this specific day
    const aptStartOnDay = isSameDay(appointment.start, date) 
      ? appointment.start 
      : dayStart; // If appointment started before this day, show from midnight
    
    // Get appointment end time on this specific day
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const aptEndOnDay = isSameDay(appointment.end, date) 
      ? appointment.end 
      : dayEnd; // If appointment ends after this day, show until midnight
    
    const startMinutes = differenceInMinutes(aptStartOnDay, dayStart);
    const endMinutes = differenceInMinutes(aptEndOnDay, dayStart);
    const duration = endMinutes - startMinutes;
    
    // Position from 0:00 (midnight) - 1 minute = 1 pixel
    const top = startMinutes;
    const height = Math.max(duration, 25); // Minimum height

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Get multi-day appointments for the week
  const multiDayAppointments = getMultiDayAppointments(weekDays[0], weekDays[6]);

  const handleCellContextMenu = (e: React.MouseEvent, date: Date, hour: number) => {
    e.preventDefault();
    const targetDate = new Date(date);
    targetDate.setHours(hour, 0, 0, 0);
    onContextMenu(e, targetDate);
  };

  // Drag and drop handlers
  const handleDragStart = (appointment: Appointment) => {
    setDraggingAppointment(appointment);
  };

  const handleDragEnd = () => {
    setDraggingAppointment(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate minute offset within the hour (snap to 15-minute intervals)
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minuteOffset = Math.floor((y / rect.height) * 60 / 15) * 15;
    const minute = Math.min(Math.max(minuteOffset, 0), 45);
    
    setDragOverCell({ dayIndex, hour, minute });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    
    if (!onAppointmentDrop) return;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const appointmentId = data.appointmentId;
      
      // Find the original appointment
      const appointment = draggingAppointment || 
        getTimeSlotAppointments(weekDays[dayIndex]).find(a => a.id === appointmentId) ||
        multiDayAppointments.find(a => a.id === appointmentId);
      
      if (!appointment) return;
      
      // Calculate new times
      const dropDate = weekDays[dayIndex];
      const minute = dragOverCell?.minute ?? 0;
      const newStart = setMinutes(setHours(dropDate, hour), minute);
      
      // Preserve duration
      const originalDuration = differenceInMinutes(appointment.end, appointment.start);
      const newEnd = addMinutes(newStart, originalDuration);
      
      onAppointmentDrop(appointmentId, newStart, newEnd);
    } catch (err) {
      console.error('Error handling drop:', err);
    } finally {
      setDragOverCell(null);
      setDraggingAppointment(null);
    }
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

  // Calculate grid column position for all-day events
  const getAllDayEventPosition = (apt: Appointment) => {
    // Find start column index (0-based)
    let startIdx = 0;
    for (let i = 0; i < weekDays.length; i++) {
      if (isSameDay(weekDays[i], apt.start)) {
        startIdx = i;
        break;
      }
      // If event starts before this day of the week
      if (isBefore(apt.start, weekDays[i])) {
        startIdx = i > 0 ? i : 0;
        break;
      }
      // If we're at the last day and haven't found a match, event starts before the week
      if (i === weekDays.length - 1) {
        startIdx = 0;
      }
    }
    
    // If event starts before the visible week
    if (isBefore(apt.start, weekDays[0])) {
      startIdx = 0;
    }
    
    // Find end column index (0-based)
    let endIdx = 6;
    for (let i = 0; i < weekDays.length; i++) {
      if (isSameDay(weekDays[i], apt.end)) {
        endIdx = i;
        break;
      }
      // If event ends before this day
      if (isBefore(apt.end, weekDays[i])) {
        endIdx = i > 0 ? i - 1 : 0;
        break;
      }
    }
    
    // If event ends after the visible week
    if (isAfter(apt.end, weekDays[6])) {
      endIdx = 6;
    }
    
    return { startIdx, endIdx };
  };

  // Organize all-day events into rows to avoid overlap
  const organizeAllDayEventsIntoRows = () => {
    const rows: Array<Array<{ apt: Appointment; startIdx: number; endIdx: number }>> = [];
    
    multiDayAppointments.forEach((apt) => {
      const { startIdx, endIdx } = getAllDayEventPosition(apt);
      
      // Find a row where this event fits (no overlap)
      let placed = false;
      for (const row of rows) {
        const hasOverlap = row.some(
          (item) => !(endIdx < item.startIdx || startIdx > item.endIdx)
        );
        if (!hasOverlap) {
          row.push({ apt, startIdx, endIdx });
          placed = true;
          break;
        }
      }
      
      // If no existing row fits, create a new one
      if (!placed) {
        rows.push([{ apt, startIdx, endIdx }]);
      }
    });
    
    return rows;
  };

  const allDayRows = organizeAllDayEventsIntoRows();

  return (
    <div className={styles.container}>
      {/* All-day events row */}
      {multiDayAppointments.length > 0 && (
        <div className={styles.allDayRow}>
          <div className={styles.allDayLabel}>
            <Text size={100}>All day</Text>
          </div>
          <div className={styles.allDayEventsWrapper} style={{height: `${allDayRows.length * 44}px`, overflow: 'visible'}}>
            {/* Day separators */}
            <div className={styles.allDayDaySeparators}>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className={styles.allDaySeparatorCell} />
              ))}
            </div>
            {/* Events */}
            {allDayRows.map((row, rowIndex) => (
              <div key={rowIndex} className={styles.allDayEventsRow}>
                {row.map(({ apt, startIdx, endIdx }) => {
                  const color = getCategoryColor(apt.category);
                  
                  return (
                    <div
                      key={apt.id}
                      className={styles.allDayEventBar}
                      style={{ 
                        backgroundColor: color.border,
                        gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                      }}
                      onClick={() => onAppointmentClick(apt)}
                      onContextMenu={(e) => handleAppointmentContextMenu(e, weekDays[0], apt)}
                    >
                      {apt.title}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header row with day names */}
      <div className={styles.headerRow}>
        <div className={styles.headerCorner} />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={mergeClasses(
              styles.headerCell,
              isToday(day) && styles.headerCellToday
            )}
          >
            <Text className={styles.dayName}>
              {format(day, 'EEEE')}
            </Text>&nbsp;
            <Text
              className={mergeClasses(
                styles.dayNumber,
                isToday(day) && styles.dayNumberToday
              )}
            >
               {format(day, 'd')}
            </Text>
          </div>
        ))}
      </div>

      {/* Grid body with time slots */}
      <div className={styles.gridBody} ref={scrollRef}>
        {/* Time column */}
        <div className={styles.timeColumn}>
          {timeSlots.map((slot) => (
            <div key={slot.label} className={styles.timeSlot}>
              {slot.label}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className={styles.daysGrid}>
          {weekDays.map((day, dayIndex) => {
            const dayAppointments = getTimeSlotAppointments(day).filter(
              (apt) => !apt.isAllDay
            );

            return (
              <div
                key={day.toISOString()}
                className={mergeClasses(
                  styles.dayColumn,
                  isToday(day) && styles.dayColumnToday
                )}
              >
                {/* Time slot cells */}
                {timeSlots.map((slot) => {
                  const isDragOver = dragOverCell?.dayIndex === dayIndex && dragOverCell?.hour === slot.hour;
                  
                  return (
                    <div
                      key={`${day.toISOString()}-${slot.label}`}
                      className={mergeClasses(
                        styles.timeSlotCell,
                        isDragOver && styles.timeSlotCellDragOver
                      )}
                      onContextMenu={(e) => handleCellContextMenu(e, day, slot.hour)}
                      onDragOver={(e) => handleDragOver(e, dayIndex, slot.hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayIndex, slot.hour)}
                    >
                      {/* Drop indicator showing exact time */}
                      {isDragOver && dragOverCell && (
                        <div 
                          className={styles.dropIndicator}
                          style={{ top: `${(dragOverCell.minute / 60) * 60}px` }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Appointments */}
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={styles.appointmentWrapper}
                    style={getAppointmentStyle(apt, day)}
                  >
                    <AppointmentCard
                      appointment={apt}
                      onClick={() => onAppointmentClick(apt)}
                      onContextMenu={(e) => handleAppointmentContextMenu(e, day, apt)}
                      onDragStart={() => handleDragStart(apt)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
