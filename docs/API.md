# EmergencyLink API Documentation

## Authentication (`/api/auth`)
* `POST /register`: Register a new user (Citizen, Driver, Admin).
* `POST /login`: Authenticate and receive JWT.
* `GET /me`: Validate JWT and return user details.

## Emergencies (`/api/emergencies`)
* `POST /`: Create a new emergency alert (requires authentication).
* `GET /`: Retrieve all active emergencies (for dashboard and command center).
* `GET /:id`: Get specific emergency details.
* `POST /:id/assign`: (Admin) Assign responder to emergency.
* `PATCH /:id/status`: Update emergency status.
* `GET /history`: Retrieve resolved emergency history.

## Responders (`/api/responders`)
* `GET /`: List all responders.
* `PATCH /status`: Update responder availability (AVAILABLE, BUSY, OFFLINE).
* `PATCH /location`: Continuously update responder GPS coordinates.
* `POST /nearest`: Calculate nearest available responder via Haversine.

## Communications (`/api/emergencies/:id/messages`)
* `GET /`: Fetch chat history for specific emergency.
* `POST /`: Send message (TEXT or SYSTEM).

## System
* `GET /api/health`: Verify backend/database/socket health.
* `GET /api/command-center`: Aggregate unified state for live map.
* `GET /api/audit-logs`: (Admin) View system audit trails.
* `POST /api/broadcasts`: (Admin) Send global or targeted broadcasts.
