/**
 * CalendarHeader component with navigation and view toggle
 */

import React from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  ToggleButton,
  Toolbar,
  ToolbarGroup,
  ToolbarDivider,
} from '@fluentui/react-components';
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  CalendarWeekNumbers24Regular,
  CalendarMonth24Regular,
} from '@fluentui/react-icons';
import type { CalendarViewType } from '../types/calendar';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  navigationGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  periodLabel: {
    minWidth: '200px',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  viewToggleGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
});

interface CalendarHeaderProps {
  periodLabel: string;
  viewType: CalendarViewType;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  periodLabel,
  viewType,
  onPrevious,
  onNext,
  onToday,
  onViewTypeChange,
}) => {
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <Toolbar>
        <ToolbarGroup className={styles.navigationGroup}>
         
          <Button appearance="outline" onClick={onToday}>
            Today
          </Button>
           <Button
            appearance="subtle"
            icon={<ChevronLeft24Regular />}
            onClick={onPrevious}
            aria-label="Previous period"
          />
          <Button
            appearance="subtle"
            icon={<ChevronRight24Regular />}
            onClick={onNext}
            aria-label="Next period"
          />
          <Text weight="semibold" size={500} className={styles.periodLabel}>
            {periodLabel}
          </Text>
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup className={styles.viewToggleGroup}>
          <ToggleButton
            appearance="subtle"
            icon={<CalendarWeekNumbers24Regular />}
            checked={viewType === 'week'}
            onClick={() => onViewTypeChange('week')}
          >
            Week
          </ToggleButton>
          <ToggleButton
            appearance="subtle"
            icon={<CalendarMonth24Regular />}
            checked={viewType === 'month'}
            onClick={() => onViewTypeChange('month')}
          >
            Month
          </ToggleButton>
        </ToolbarGroup>
      </Toolbar>
    </header>
  );
};

export default CalendarHeader;
