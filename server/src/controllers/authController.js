const pool = require('../config/db');

// -- REGISTER -- //
const register = async (req, res) => {
    const { first_name, last_name, email, password, role, business_name } = req.body;

    try {
        // Checks if the entered email already exists in the database (users table) //
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // New user insertion to the database (users table) //
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [first_name, last_name, email, password, role]
        );

        const user = newUser.rows[0];

        // If statement to create and insert a business if the user is a manager (business table) //
        if (role === 'manager' && business_name) {
            await pool.query(
                'INSERT INTO businesses (user_id, business_name) VALUES ($1, $2)',
                [user.user_id, business_name]
            );
        }

        // Success response that returns the created user data (excluding password) //
        res.status(201).json({
            message: `Welcome to Vizura, ${user.first_name}!`,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Error: Server' });
    }
};

// -- LOGIN -- //
const login = async (req, res) => {
    const { email, password } = req.body;
    
    // Checks if the input email/password exists in the database (users table) //
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password_hash = $2',
            [email, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];
        
        res.status(200).json({
            message: `Welcome back, ${user.first_name}!`,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Error: Server' });
    }
};

module.exports = { register, login };