const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const socketConfig = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const responderRoutes = require('./routes/responderRoutes'); // Phase 4
const analyticsRoutes = require('./routes/analyticsRoutes'); // Phase 5
const chatRoutes = require('./routes/chatRoutes'); // Phase 6
const broadcastRoutes = require('./routes/broadcastRoutes'); // Phase 6
const auditRoutes = require('./routes/auditRoutes'); // Phase 6
const commandCenterRoutes = require('./routes/commandCenterRoutes'); // Phase 6
const agencyRoutes = require('./routes/agencyRoutes'); // Phase 8
const resourceRoutes = require('./routes/resourceRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const publicAlertRoutes = require('./routes/publicAlertRoutes');
const emergencyContactRoutes = require('./routes/emergencyContactRoutes');
const driverRoutes = require('./routes/driverRoutes'); // added

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Security Middleware (Phase 7)
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json({ limit: '10kb' })); // Restrict payload size

// Rate limiting (Phase 7)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/responders', responderRoutes); // Phase 4
app.use('/api/analytics', analyticsRoutes); // Phase 5
app.use('/api/emergencies/:id/messages', chatRoutes); // Phase 6
app.use('/api/broadcasts', broadcastRoutes); // Phase 6
app.use('/api/audit-logs', auditRoutes); // Phase 6
app.use('/api/command-center', commandCenterRoutes); // Phase 6
app.use('/api/agencies', agencyRoutes); // Phase 8
app.use('/api/resources', resourceRoutes); // Phase 8
app.use('/api/hospitals', hospitalRoutes); // Phase 8
app.use('/api/public-alerts', publicAlertRoutes); // Phase 8
app.use('/api/emergency-contacts', emergencyContactRoutes); // Phase 8
app.use('/api/driver', driverRoutes); // Phase 8 addition

// Health Check (Phase 7)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    socket: 'active'
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.user?.id || 'unauthenticated'})`);

  if (socket.user && socket.user.role === 'admin') {
    socket.join('command_center');
  } else if (socket.user && ['driver', 'hospital_admin', 'ambulance_driver', 'hospital'].includes(socket.user.role)) {
    socket.join('responders');
  }

  // Phase 8 additions
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_emergency', (emergencyId) => {
    socket.join(`emergency_${emergencyId}`);
  });

  socket.on('driver:location', (data) => {
    io.to(`emergency_${data.emergency_id}`).emit('driver:location', {
      latitude: data.latitude,
      longitude: data.longitude,
      driver_id: data.driver_id,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Centralized Error Handling (Phase 7)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

socketConfig.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
