const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EmergencyLink API'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
