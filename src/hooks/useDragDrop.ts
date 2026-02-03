/**
 * Hook for managing drag and drop of appointments
 */

import { useState, useCallback, useRef } from 'react';
import type { Appointment } from '../types/calendar';
import { differenceInMinutes, addMinutes, startOfDay, setHours, setMinutes } from 'date-fns';

export interface DragState {
  isDragging: boolean;
  appointment: Appointment | null;
  originalDuration: number; // in minutes
}

export interface DropTarget {
  date: Date;
  hour?: number;
  minute?: number;
}

export interface UseDragDropReturn {
  dragState: DragState;
  handleDragStart: (appointment: Appointment) => void;
  handleDragEnd: () => void;
  calculateNewTimes: (dropTarget: DropTarget) => { newStart: Date; newEnd: Date } | null;
  getDragData: () => string;
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  appointment: null,
  originalDuration: 0,
};

export const useDragDrop = (): UseDragDropReturn => {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);
  const dragDataRef = useRef<string>('');

  // Start dragging an appointment
  const handleDragStart = useCallback((appointment: Appointment) => {
    const duration = differenceInMinutes(appointment.end, appointment.start);
    
    setDragState({
      isDragging: true,
      appointment,
      originalDuration: duration,
    });

    // Store data for transfer
    dragDataRef.current = JSON.stringify({
      appointmentId: appointment.id,
      duration,
      isAllDay: appointment.isAllDay,
      originalStart: appointment.start.toISOString(),
      originalEnd: appointment.end.toISOString(),
    });
  }, []);

  // End dragging
  const handleDragEnd = useCallback(() => {
    setDragState(INITIAL_DRAG_STATE);
    dragDataRef.current = '';
  }, []);

  // Calculate new start and end times based on drop target
  const calculateNewTimes = useCallback((dropTarget: DropTarget): { newStart: Date; newEnd: Date } | null => {
    if (!dragState.appointment) return null;

    const { appointment, originalDuration } = dragState;
    
    let newStart: Date;
    
    if (appointment.isAllDay) {
      // For all-day events, just change the date
      newStart = startOfDay(dropTarget.date);
    } else if (dropTarget.hour !== undefined) {
      // Week view - specific time slot
      const minute = dropTarget.minute ?? 0;
      newStart = setMinutes(setHours(dropTarget.date, dropTarget.hour), minute);
    } else {
      // Month view - keep same time, change date
      const originalHours = appointment.start.getHours();
      const originalMinutes = appointment.start.getMinutes();
      newStart = setMinutes(setHours(dropTarget.date, originalHours), originalMinutes);
    }

    const newEnd = addMinutes(newStart, originalDuration);

    return { newStart, newEnd };
  }, [dragState]);

  // Get drag data for dataTransfer
  const getDragData = useCallback(() => {
    return dragDataRef.current;
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    calculateNewTimes,
    getDragData,
  };
};

export default useDragDrop;
