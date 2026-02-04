# Outlook Calendar - Power Apps Code App

A modern calendar application built with React and TypeScript that integrates with Microsoft Outlook via the Office 365 connector. This is a **Power Apps Code App** designed to run within Power Apps environment.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Fluent UI](https://img.shields.io/badge/Fluent%20UI-v9-purple)

Menu : [Features](#features) - [Integration capabilities](#integration-capabilities) - [Import the solution](#option-1--quick-install-recommended) - [Build from Scratch](#option-2--build-from-scratch)

## Demo
![https://carfupstorage.blob.core.windows.net/sharex/2026_02_03_15-33-08_msedge.gif](https://carfupstorage.blob.core.windows.net/sharex/2026_02_03_15-33-08_msedge.gif)

## Features

### 📅 Calendar Views
- **Week View** - 7-day grid with hourly time slots, automatically scrolls to current hour during work hours
- **Month View** - Traditional monthly calendar grid with appointment previews
- **Mini Calendar** - Sidebar navigation for quick date selection

### 📝 Appointment Management
- **Create Appointments** - Add new meetings with title, location, attendees, and description
- **Edit Appointments** - Modify existing appointments directly from the calendar
- **Delete Appointments** - Remove appointments with confirmation dialog
- **Drag & Drop** - Move appointments between days and time slots

### 🎨 Categories & Colors
- Support for Outlook categories (Blue, Orange, Purple, Green, Red, Light Blue)
- Color-coded appointments for easy visual identification

### 🕐 Time Management
- All-day events support
- Multi-day event spanning across days
- Duration preservation when changing start time
- Timezone-aware date handling

### 📧 Outlook Integration
- Syncs with Office 365 Outlook calendars
- Multiple calendar support
- Real-time appointment creation/updates via Graph API
- HTML description rendering from Outlook

### 🎯 User Experience
- Fluent UI v9 components for consistent Microsoft look and feel
- Context menu for quick actions (right-click on appointments)
- Toast notifications for success/error feedback
- Responsive layout

## Integration capabilities 
- Stand alone, this app is likely a pro code app using the Canvas App engine, so it can be used using the directly link to it (https://apps.powerapps.com/play/e/EnvID/app/AppId)
- Within a Model Driven App :
  As of today, a seamless integration like a custom page or a canvas app is not available, but you can use a simple HTML Webresource file embedding the application using a Iframe.

## Installation

### 🧪 Mandatory Prerequite : 
🧪 **Disable the *Enforce security policy* on your environment :**

1. Go to your [PPAC](https://admin.powerplatform.microsoft.com/)
2. Select your environment
3. Go to Settings > Under Product > Privacy + Security
4. At the bottom of the page find this block and disable the *Enforce security policy* option
![https://carfupstorage.blob.core.windows.net/sharex/2026_02_04_11-22-20_msedge.png](https://carfupstorage.blob.core.windows.net/sharex/2026_02_04_11-22-20_msedge.png)

### Option 1 : Quick Install (recommended)
1. Download *CodeOutlook_x_x_x_x_managed.zip*  [releases page](https://github.com/carfup/Code_Outlook/releases/latest)
2. Simply import it into your environment
3. Retrieve the App url for the CodeOutlook App
4. Set the related Environment variable called "CodeOutlookAppUrl" with the App Url
4. Add the html file as a webresource into your Model Driven App navigation
![https://carfupstorage.blob.core.windows.net/sharex/2026_02_03_15-46-37_msedge.png](https://carfupstorage.blob.core.windows.net/sharex/2026_02_03_15-46-37_msedge.png)
5. Using the solution will gives you access to the app using the link : [https://apps.powerapps.com/play/e/EndID/app/143b9a43-6ee9-4990-b274-0abbf09bb40e
](https://apps.powerapps.com/play/e/EndId/app/143b9a43-6ee9-4990-b274-0abbf09bb40e
)
6. Tada

### Using PAC CLI:
```bash
pac auth create --environment "https://yourorg.crm.dynamics.com"
pac solution import --path CodeOutlook_x_x_x_x_managed.zip
```

### Option 2:  Build from Scratch

Follow the official Microsoft documentation to create a Code App from scratch:
👉 [Create an app from scratch](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/create-an-app-from-scratch)

### Prerequisites
- Node.js 18+
- Power Platform CLI (`pac`)
- Power Apps environment with Code Apps enabled
- 
### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Code_Outlook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the power.config.json**
In the power.config.json file, you need to delete the AppId line in order to create the app otherwise the *pac code push* command will try to update the existing one.
Also, make sure you updated the environment Id for the same reason.

4. **Add the Office 365 Outlook data source**
   ```bash
   pac code add-data-source -a "shared_office365" -c "<your-connection-id>"
   ```

5. **Run in development mode**
   ```bash
   npm run dev
   ```

6. **Build and deploy to Power Apps**
   ```bash
   npm run build | pac code push
   ```
   
## Project Structure

```
src/
├── components/           # React components
│   ├── AppointmentCard.tsx
│   ├── AppointmentDialog.tsx
│   ├── CalendarHeader.tsx
│   ├── CalendarLayout.tsx
│   ├── CalendarSidebar.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── MonthView.tsx
│   └── WeekView.tsx
├── contexts/             # React contexts
│   └── ToastContext.tsx
├── generated/            # Auto-generated API models
│   ├── models/
│   └── services/
├── hooks/                # Custom React hooks
│   ├── useAppointments.ts
│   ├── useCalendarNavigation.ts
│   └── useCalendars.ts
├── types/                # TypeScript type definitions
│   └── calendar.ts
├── utils/                # Utility functions
│   ├── appointmentMapper.ts
│   ├── categoryColors.ts
│   └── timezone.ts
└── PowerProvider.tsx     # Power Apps context provider
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with HMR
- **Fluent UI v9** - Microsoft design system components
- **date-fns** - Date manipulation
- **Power Apps Code Apps** - Runtime environment

## Resources

- [Power Apps Code Apps Overview](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview)
- [Code Apps Documentation](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/)
- [Code Apps Samples](https://github.com/microsoft/PowerAppsCodeApps)
- [Fluent UI React v9](https://react.fluentui.dev/)

## License

See [LICENSE](LICENSE) file for details.

-----
Made with ❤️ for the Power Platform Community
