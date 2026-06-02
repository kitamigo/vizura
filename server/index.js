console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);

require('dotenv').config(); // First so the DB password is defined before connection is established //
const app = require('./src/app');
require('./src/config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Vizura server running on port ${PORT}`);
});