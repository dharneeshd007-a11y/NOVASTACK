const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const socketConfig = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EmergencyLink API'
  });
});

socketConfig.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
