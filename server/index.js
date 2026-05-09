const app = require('./src/app');
require('dotenv').config();
require('./src/config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Vizura server running on port ${PORT}`);
});