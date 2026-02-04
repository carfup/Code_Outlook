/**
 * CalendarContextMenu component for right-click actions
 */

import React from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import type { Appointment } from '../types/calendar';

interface CalendarContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  targetDate?: Date;
  targetAppointment?: Appointment;
  onClose: () => void;
  onCreateNew: (date?: Date) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

export const CalendarContextMenu: React.FC<CalendarContextMenuProps> = ({
  isOpen,
  position,
  targetDate,
  targetAppointment,
  onClose,
  onCreateNew,
  onEdit,
  onDelete,
}) => {
  const handleCreateNew = () => {
    onCreateNew(targetDate);
    onClose();
  };

  const handleEdit = () => {
    if (targetAppointment) {
      onEdit(targetAppointment);
    }
    onClose();
  };

  const handleDelete = () => {
    if (targetAppointment) {
      onDelete(targetAppointment);
    }
    onClose();
  };

  return (
    <Menu
      open={isOpen}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
      positioning={{
        position: 'below',
        align: 'start',
        target: {
          getBoundingClientRect: () => ({
            x: position.x,
            y: position.y,
            top: position.y,
            left: position.x,
            bottom: position.y,
            right: position.x,
            width: 0,
            height: 0,
            toJSON: () => ({}),
          }),
        },
      }}
    >
      <MenuTrigger disableButtonEnhancement>
        <span style={{ position: 'fixed', top: position.y, left: position.x }} />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem icon={<Add24Regular />} onClick={handleCreateNew}>
            New Appointment
          </MenuItem>
          
          {targetAppointment && (
            <>
              <MenuDivider />
              <MenuItem icon={<Edit24Regular />} onClick={handleEdit}>
                Edit
              </MenuItem>
              <MenuItem icon={<Delete24Regular />} onClick={handleDelete}>
                Delete
              </MenuItem>
            </>
          )}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default CalendarContextMenu;
