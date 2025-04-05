const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 8080;

app.use(express.json());

app.get('/users', async (request, response) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        response.json(result.rows);
    } catch (err) {
        console.error(err.message);
        response.status(500).send('Server Error');
    }
});

app.post('/users', async (request, response) => {
    const { name, email } = request.body;

    if (!(name && email)) {
        return response.status(400).json({ error: 'Name and Email are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]
        );
        response.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting user: ', err.message);
        response.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => console.log(`App available on http://localhost:${PORT}`));