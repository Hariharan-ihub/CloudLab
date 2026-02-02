const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const labRoutes = require('./routes/labRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

app.use('/api/labs', labRoutes);
app.use('/api/simulation', simulationRoutes);

app.get('/', (req, res) => {
  res.send('AWS Learning Lab API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
