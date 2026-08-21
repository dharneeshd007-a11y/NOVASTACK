# Deployment Guide

## Environment Variables
Ensure all `.env` variables are configured properly on your host before deployment. Do not commit `.env` files.
- `JWT_SECRET`: Must be a strong, randomly generated string in production.
- `CORS_ORIGIN`: Set to the explicit domain of the frontend app (e.g. `https://emergencylink.app`).

## Backend (Node.js/Express)
1. Provision a MySQL database (e.g. AWS RDS, DigitalOcean Managed DB).
2. Run `node init-db.js` once to initialize schemas.
3. Deploy to a Node.js host (e.g. Render, Heroku).
4. Start command: `npm start` (or `node server.js`).

## Frontend (React/Vite)
1. Ensure `VITE_API_URL` and `VITE_SOCKET_URL` are pointed to the deployed backend URL.
2. Build the app: `npm run build`.
3. Deploy the `dist/` folder to a static host (e.g. Vercel, Netlify, Cloudflare Pages).

## Database Backups
See `DATABASE_BACKUP.md` for daily cron dump strategies.
