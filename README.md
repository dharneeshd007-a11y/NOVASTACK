# NOVASTACK – EmergencyLink

Smart Emergency Response & Hospital Coordination Platform

## Current Features (Phase 1 & 2)
- Project foundation initialized
- React + Vite Frontend with Tailwind CSS
- Node.js + Express Backend
- MySQL Database connection
- Role-based Authentication (Citizen, Ambulance Driver, Hospital Admin)
- Secure JWT sessions & bcrypt password hashing
- Protected frontend routes and placeholder dashboards

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express, MySQL2, JSONWebToken, bcryptjs
- **Database**: MySQL

## How to Run

### Database Setup
1. Ensure MySQL is running on your local machine.
2. Update `backend/.env` with your DB credentials (use `backend/.env.example` as a template).
3. Navigate to the backend directory and run the initialization script:
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
   node server.js
   ```
