import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const authRoutes = express.Router();

authRoutes.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ error: "All fields are required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
        return res.status(400).json({ error: "Invalid email format" });

    try {
        const existingUser = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "Email already in use" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await db.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, image_url AS imageUrl",
            [name, email, hashed]
        );

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(201).json({ token, user: result.rows[0] });
    } catch (err) {
        console.error("Signup Error: ", err);
        res.status(400).json({ error: "Registration failed" });
    }
});

authRoutes.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "All fields are required" });

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);
        const user = result.rows[0];

        if (!user)
            return res
                .status(401)
                .json({ error: "Incorrect email or password" });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res
                .status(401)
                .json({ error: "Incorrect email or password" });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        res.json({ token, user: { userId: user.id, name: user.name, email: user.email, imageUrl: user.image_url } });
    } catch (err) {
        console.error("Login Error: ", err);
        res.status(500).json({ error: "Login Failed" });
    }
});

export default authRoutes;
