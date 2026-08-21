const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Adjust to match frontend URL in production
        methods: ['GET', 'POST', 'PATCH']
      }
    });

    // Authentication middleware for sockets
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id, 'User:', socket.user.id);
      
      // Join rooms based on role
      if (['driver', 'hospital_admin'].includes(socket.user.role)) {
        socket.join('responders'); // For broadcasting new emergencies to responders/admins
      }
      
      socket.join(`user_${socket.user.id}`); // For personal notifications

      socket.on('join_emergency_room', async ({ emergency_id }) => {
        try {
          const db = require('./db');
          const [emergencies] = await db.query('SELECT * FROM emergencies WHERE id = ?', [emergency_id]);
          if (emergencies.length === 0) return;
          const e = emergencies[0];

          let hasAccess = false;
          if (socket.user.role === 'hospital_admin') hasAccess = true;
          else if (e.user_id === socket.user.id) hasAccess = true;
          else {
            const [responses] = await db.query('SELECT * FROM emergency_responses WHERE emergency_id = ? AND responder_id = ?', [emergency_id, socket.user.id]);
            if (responses.length > 0) hasAccess = true;
          }

          if (hasAccess) {
            socket.join(`emergency_${emergency_id}`);
            console.log(`User ${socket.user.id} joined room emergency_${emergency_id}`);
          } else {
             socket.emit('error', { message: 'Unauthorized to join this emergency room' });
          }
        } catch (err) {
          console.error(err);
        }
      });

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
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
