require('dotenv').config();
require('./src/config/db');
const app = require('./src/app');
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.listen(PORT, () => {
    console.log(`Vizura server running on port ${PORT}`);
});