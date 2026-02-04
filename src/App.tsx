/**
 * Outlook-like Calendar Application
 * Built with Fluent UI v9 React components
 */

import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import CalendarLayout from './components/CalendarLayout';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <ToastProvider>
        <CalendarLayout />
      </ToastProvider>
    </FluentProvider>
  );
}

export default App;
