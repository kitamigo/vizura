const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
<<<<<<< Updated upstream

=======
const payrollRoutes = require('./routes/payrollRoutes');
>>>>>>> Stashed changes
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Vizura API running' });
});

module.exports = app;