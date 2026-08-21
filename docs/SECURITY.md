# Security Architecture

## Authentication & Authorization
* **JWT Tokens**: All protected API endpoints require a valid JWT passed in the `Authorization: Bearer <token>` header.
* **Role-Based Access Control (RBAC)**: Specific routes use `verifyRole(['hospital_admin'])` to restrict actions like assignment, escalation, and broadcast creation to authorized personnel.

## Socket.IO Security
* Sockets must authenticate by passing the JWT upon connection.
* `join_emergency_room` event verifies the user is either the original reporter, the assigned responder, or an admin before granting room access.

## API Hardening
* **Helmet**: Used to secure Express apps by setting various HTTP headers (XSS filter, Content Security Policy, etc.).
* **Express-Rate-Limit**: Implemented globally on `/api/` to prevent brute force and DDoS attacks (Max 100 requests per 15 minutes per IP).
* **CORS**: Explicit origins required in production to prevent Cross-Site Request Forgery.

## Error Handling
* In production (`NODE_ENV=production`), the centralized error handler catches all thrown errors and suppresses stack traces, returning a generic safe `Internal Server Error` message to the client.
