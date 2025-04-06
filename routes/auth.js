import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const authRoutes = express.Router();

authRoutes.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name",
            [name, email, hashed]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: "User alredy exists or bad request" });
    }
});

authRoutes.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) return res.status(404).json({ error: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Incorrect Password" });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { userId: user.id, name: user.name } });
    } catch (err) {
        res.status(500).json({ error: "Login Failed" });
    }
});

export default authRoutes;