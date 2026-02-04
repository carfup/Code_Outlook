/**
 * AppointmentCard component for displaying appointments
 */

import React, { useState } from 'react';
import { makeStyles, tokens, Text, mergeClasses } from '@fluentui/react-components';
import { Video16Regular, Location16Regular } from '@fluentui/react-icons';
import type { Appointment } from '../types/calendar';
import { getCategoryColor } from '../utils/categoryColors';
import { format } from 'date-fns';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    cursor: 'grab',
    overflow: 'hidden',
    boxShadow: tokens.shadow2,
    transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderLeft: '3px solid',
    height: '100%',
    boxSizing: 'border-box',
    
    '&:hover': {
      boxShadow: tokens.shadow8,
    },
  },
  cardDragging: {
    opacity: 0.5,
    cursor: 'grabbing',
  },
  cardCompact: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  titleCompact: {
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
  },
  details: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  time: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  icons: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
  },
  icon: {
    fontSize: '1px',
    color: tokens.colorNeutralForeground3,
  },
});

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (appointment: Appointment) => void;
  onDragEnd?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  compact = false,
  draggable = true,
  onDragStart,
  onDragEnd,
  onClick,
  onContextMenu,
}) => {
  const styles = useStyles();
  const categoryColor = getCategoryColor(appointment.category);
  const [isDragging, setIsDragging] = useState(false);

  const timeLabel = appointment.isAllDay
    ? 'All day'
    : `${format(appointment.start, 'HH:mm')} - ${format(appointment.end, 'HH:mm')}`;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      appointmentId: appointment.id,
      isAllDay: appointment.isAllDay,
    }));
    onDragStart?.(appointment);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <div
      className={mergeClasses(
        styles.card,
        compact && styles.cardCompact,
        isDragging && styles.cardDragging
      )}
      style={{
        borderLeftColor: categoryColor.border,
        backgroundColor: categoryColor.background,
      }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
      tabIndex={0}
    >
      <Text
        className={mergeClasses(styles.title, compact && styles.titleCompact)}
        style={{ color: categoryColor.text }}
      >
        {appointment.title}
      </Text>
      
      {!compact && (
        <>
          <span className={styles.time}>{timeLabel}</span>
          <div className={styles.details}>
            <div className={styles.icons}>
              {appointment.isTeamsMeeting && (
                <Video16Regular className={styles.icon} title="Réunion Teams" />
              )}
              {appointment.location && (
                <Location16Regular className={styles.icon} title={appointment.location} />
              )}
            </div>
            {appointment.location && !appointment.isTeamsMeeting && (
              <Text size={100} truncate>
                {appointment.location}
              </Text>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentCard;
