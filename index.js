const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 8080;

app.use(express.json());

app.get("/users", async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    } finally {
        client.release();
    }
});

app.post("/users", async (req, res) => {
    const client = await pool.connect();

    const { name, email } = req.body;

    if (!(name && email)) {
        return res.status(400).json({ error: "Name and Email are required" });
    }

    try {
        await client.query("BEGIN");
        const result = await client.query(
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
            [name, email]
        );
        res.status(201).json(result.rows[0]);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error inserting user: ", err.message);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

app.delete("/users", async (req, res) => {
    const client = await pool.connect();
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        await client.query("BEGIN");
        const result = await client.query(
            "DELETE FROM users WHERE email = $1",
            [email]
        );
        res.status(200).json(result.rowCount);
        await client.query("COMMIT");
        client;
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error deleting user: ", err.message);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

app.listen(PORT, () =>
    console.log(`App available on http://localhost:${PORT}`)
);
