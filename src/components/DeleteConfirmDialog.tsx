/**
 * DeleteConfirmDialog component for confirming appointment deletion
 */

import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';
import type { Appointment } from '../types/calendar';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  warningContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  warningIcon: {
    color: tokens.colorPaletteYellowForeground2,
    fontSize: '24px',
    flexShrink: 0,
  },
  appointmentTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  appointment: Appointment | null;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  appointment,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  const styles = useStyles();

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Delete Appointment</DialogTitle>

          <DialogContent className={styles.content}>
            <div className={styles.warningContainer}>
              <Warning24Regular className={styles.warningIcon} />
              <div>
                <Text>Are you sure you want to delete this appointment?</Text>
                <Text block className={styles.appointmentTitle}>
                  {appointment.title}
                </Text>
              </div>
            </div>
            <Text>This action cannot be undone.</Text>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
