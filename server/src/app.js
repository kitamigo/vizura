const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const nlqRoutes = require('./routes/nlqRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/nlq', nlqRoutes);
app.use('/api', testRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Vizura API running' });
});

module.exports = app;