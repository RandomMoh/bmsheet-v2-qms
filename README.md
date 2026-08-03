# QMS

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?style=flat-square&logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white)

Query Management System (QMS) is an operational intelligence dashboard, CSR shift tracking engine, and automated query management platform built for Benchmark Studio.

---

## Project structure

```text
.
├── README.md                : Project documentation
├── index.html               : Main HTML application container
├── package.json             : Project manifest and scripts
├── shutdown_qms.php         : Script to toggle system-wide maintenance shutdown
├── tailwind.config.js       : Tailwind CSS theme configuration
├── vite.config.js           : Vite bundler and build options
│
├── api/                     : Backend PHP REST API Layer
│   ├── activity-logger.php  : Helper to write activity log entries
│   ├── add-admin.php        : Endpoint to grant super-admin privileges
│   ├── add-order.php        : Endpoint to create new query orders
│   ├── add-user.php         : Endpoint for admins to create CSR accounts
│   ├── config.php           : Core backend config, database connection, session setup, rate limiter, and security headers
│   ├── create-csr.php       : Endpoint to generate CSR accounts with BCRYPT passwords
│   ├── delete-user.php      : Endpoint for admins to remove CSR accounts
│   ├── dev-change-password.php : Endpoint to update the Dev terminal access passphrase
│   ├── dev-channels.php     : Endpoint to configure Slack channels for workspace monitoring
│   ├── dev-login-maker.php  : Endpoint to verify senior maker authorization
│   ├── dev-login.php        : Endpoint to authenticate Dev terminal access
│   ├── dev-logs.php         : Endpoint to stream server error and access logs
│   ├── dev-telemetry.php    : Endpoint for real-time system resource telemetry
│   ├── dev-webhook-status.php : Endpoint to check Slack webhook status
│   ├── dev-workspaces.php   : Endpoint to manage active workspace configurations
│   ├── extend-time.php      : Endpoint to extend query SLA time limits
│   ├── fix.php              : Utility script to clean up query entries
│   ├── get-activity-logs.php: Endpoint to fetch recent activity audit logs
│   ├── get-completed-by-names.php : Endpoint to fetch CSR completion metrics
│   ├── get-csr-names.php    : Endpoint to fetch active CSR names
│   ├── get-csr-shifts.php   : Endpoint to fetch active CSR shift metrics
│   ├── get-current-orders.php : Endpoint to fetch pending queue queries
│   ├── get-done-orders.php  : Endpoint to fetch completed query records
│   ├── get-issue-orders.php : Endpoint to fetch queries with reported issues
│   ├── get-monitor.php      : Endpoint for background operational checks
│   ├── get-orders.php       : Endpoint to fetch all orders with filtering
│   ├── get-query-history.php: Endpoint to fetch audit history timeline for an order
│   ├── get-slack-thread.php : Endpoint to fetch Slack message threads for a query
│   ├── get-stats.php        : Endpoint to fetch real-time dashboard analytics
│   ├── get-user-orders.php  : Endpoint to fetch queries assigned to a CSR
│   ├── get-users.php        : Endpoint to fetch registered user accounts
│   ├── heartbeat.php        : Endpoint to update active session ping and last-active time
│   ├── leave.php            : Endpoint to record CSR shift end status
│   ├── login.php            : Endpoint for CSR and User authentication
│   ├── logout.php           : Endpoint to clear active session and log out
│   ├── maintenance.html     : HTML template displayed during scheduled maintenance
│   ├── mark-order.php       : Endpoint to update query status (pending, issue, done)
│   ├── setup_slack_channels.php : Script to initialize Slack channel subscriptions
│   ├── slack-webhook.php    : Receiver endpoint for incoming Slack webhooks
│   ├── update-field.php     : Endpoint to update order fields with audit logging
│   ├── update-project-filter.php : Endpoint to update user project view filters
│   └── update-user.php      : Endpoint to update user profile information
│
├── public/                  : Application Web Assets
│   ├── .htaccess            : Apache rewrite rules and security settings
│   ├── benchmark.svg        : Benchmark Studio SVG brand logo
│   ├── create_csr.html      : Standalone interface for creating CSR accounts
│   ├── logo.svg             : Primary QMS brand SVG logo asset
│   └── shutdown.html        : Page displayed during system shutdown
│
└── src/                     : React Frontend Application Code
    ├── App.css              : Application layout styling rules
    ├── App.jsx              : Main application router and state root
    ├── CursorTrail.jsx      : Interactive cursor particle animation component
    ├── NetworkStatus.jsx    : Network connection status indicator banner
    ├── QueryTimelineModal.jsx : Modal component displaying order history timeline
    ├── SlackThreadViewer.jsx: Component for viewing inline Slack conversation threads
    ├── ThemeToggle.jsx      : Dark and light theme switcher control
    ├── index.css            : Tailwind CSS base styles and design tokens
    ├── main.jsx             : React DOM render entry point
    ├── components/
    │   └── WebGLBackground.jsx : Interactive 3D WebGL background component
    └── pages/
        ├── Dev.css          : Styling rules for the Dev terminal
        ├── Dev.jsx          : Passphrase-protected Dev terminal page
        ├── Login.css        : Styling rules for the login page
        ├── Login.jsx        : User and CSR login page
        └── User.jsx         : Primary CSR operational dashboard page
```

---

## Project architecture

QMS uses a decoupled client-server architecture.

### Frontend
- **Framework:** React 18 with Vite 7 build tooling.
- **State and Query Management:** TanStack React Query for background data fetching, cache invalidation, and real-time polling.
- **Styling and UI:** Tailwind CSS with custom glassmorphism design tokens, micro-animations, Lucide icons, and a custom WebGL background renderer powered by Three.js.
- **Document Generation:** HTML2Canvas and JSPDF for exporting query reports and performance analytics.

### Backend
- **Core Engine:** PHP 8.x REST API layer running under Apache/LAMP.
- **Database:** MySQL relational database handling query records, user credentials, active session tracking, and audit trails.
- **Integrations:** Slack Webhook receiver for automated ticket ingestion and Groq AI integration for intelligent query processing.

---

## Key features

### 1. Query dashboard
- Filters orders by department, project, communication medium, and resolution status (pending, issue, completed).
- Calculates dynamic SLA response timers and visual warning indicators based on configurable reminder thresholds.
- Displays responsive skeleton loading states during initial load and tab switches.

### 2. CSR shift and session tracking
- Monitors live CSR active sessions, IP addresses, and last-active timestamps in real time.
- Records shift start, pause, and end events with automated activity log entries.
- Displays individual CSR cards with active assignment counts and status indicators.

### 3. Query history timeline
- Modal dialog rendering granular history for every order.
- Tracks field updates, status transitions, and user timestamps for full operational accountability.

### 4. Dev terminal
- Passphrase-protected diagnostic terminal for workspace administrators.
- Supports maintenance mode toggling, channel setup, raw log inspection, and system status telemetry.

---

## Security implementation

- **Rate limiting:** IP-based rate limiter enforcing a maximum of 5 failed login attempts per 5 minutes per IP address on `login.php` and `dev-login.php`.
- **Session protection:** Configured with `session.use_strict_mode = 1`, `SameSite=None`, `Secure`, and `HttpOnly` cookie attributes. Session IDs regenerate immediately upon authentication to prevent session fixation.
- **Input bounds:** Input fields cap text lengths to 15 characters on standard login inputs and 20 characters on the Dev terminal.
- **Password security:** Passwords use BCRYPT hashing (`password_hash` with `PASSWORD_BCRYPT`) alongside fallback verification for legacy records.
- **HTTP security headers:** API responses include `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Authorization controls:** Role-based checks prevent unauthorized users from creating, modifying, or deleting other user accounts.

---

## Database schema

The database contains five primary tables:

1. `order`
   - Stores incoming query data, including communication medium, project name, department, order ID, received timestamp, first reply timestamp, and SLA reminder settings.
2. `user`
   - Stores CSR and Admin account records, BCRYPT password hashes, plain password references for administrative distribution, project filters, and user roles.
3. `active_sessions`
   - Tracks current logged-in users, session identifiers, active roles, IP addresses, and live heartbeat timestamps.
4. `activity_logs`
   - Maintains an immutable audit trail of user actions across the system.
5. `query_history`
   - Records field-level changes for individual queries over time.

---

## Local development

### Prerequisites
- Node.js 18 or higher
- PHP 8.0 or higher
- MySQL / MariaDB database server

### Setup instructions

1. Clone the repository:
   ```bash
   git clone git@github.com:RandomMoh/bmsheet-v2-qms.git
   cd bmsheet-v2-qms
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Build production assets:
   ```bash
   npm run build
   ```
