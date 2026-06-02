const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const payrollRoutes = require('./routes/payrollRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/payroll', payrollRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Vizura API running' });
});

module.exports = app;