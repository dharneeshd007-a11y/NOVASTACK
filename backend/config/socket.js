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
