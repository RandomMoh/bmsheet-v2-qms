# QMS

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?style=flat-square&logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white)

Query Management System (QMS) is an operational intelligence dashboard, CSR shift tracking engine, and automated query management platform built for Benchmark Studio.

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
- **Integrations:** Slack Webhook receiver for automated ticket ingestion, Gemini AI API connector, and Google Sheets synchronization endpoints.

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
