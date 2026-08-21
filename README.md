# NOVASTACK – EmergencyLink

Smart Emergency Response & Hospital Coordination Platform

## Current Features (Phase 1-4)
- **Frontend**: React + Vite + Tailwind CSS. Responsive UI.
- **Backend**: Node.js + Express with modular architecture.
- **Database**: MySQL.
- **Authentication**: JWT-based secure login, Role-based access (Citizen, Driver, Admin).
- **Real-Time Core**:
  - Create emergency alerts with Geolocation integration.
  - Live Emergency Dashboard for Citizens and Responders.
  - Real-time updates via **Socket.IO**.
  - Emergency status tracking (`ACTIVE` -> `ACKNOWLEDGED` -> `RESPONDING` -> `RESOLVED`).
  - In-app Notification Bell for instant alerts.
- **Responder & Rescue Management (Phase 4)**:
  - Responder Availability status (Available/Busy/Offline).
  - Manual & Automatic nearest-responder emergency assignments using Haversine formula.
  - Continuous live GPS location tracking for Responders in the background.
  - Interactive Live Tracking Map using React-Leaflet.
  - **AI Intelligence & Analytics (Phase 5):**
    - Smart Heuristics Engine calculates Emergency Priority and recommends actions.
    - Real-time Analytics Dashboard using Recharts for trend analysis and volume tracking.
  - **Command Center & Communications (Phase 6):**
    - Dedicated Admin Command Center `/admin/command-center` with global live map.
    - Secure real-time chat rooms for each emergency `EmergencyChat.jsx`.
    - System-wide Broadcasts and detailed Audit Logging.
    - Global offline/reconnection status UI indicators.
  - Full Response History logs for Hospital Admins.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Socket.IO Client
- **Backend**: Node.js, Express, MySQL2, JSONWebToken, bcryptjs, Socket.IO
- **Database**: MySQL

## How to Run

### Database Setup
1. Ensure MySQL is running on your local machine.
2. Update `backend/.env` with your DB credentials (use `backend/.env.example` as a template).
3. Navigate to the backend directory and run the initialization script to setup tables (`users`, `emergencies`, `emergency_responses`, `notifications`):
   ```bash
   cd backend
   node init-db.js
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm start
   ```
