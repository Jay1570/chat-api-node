import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Tokens, User } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const authRoutes = express.Router();

authRoutes.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ error: "All fields are required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
        return res.status(400).json({ error: "Invalid email format" });

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: "Email already in use" });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashed,
        });

        // Create response data
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.image_url,
        };

        // Sign JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        await Tokens.create({
            user_id: user.id,
            token: token,
        });

        res.status(201).json({ token, user: userData });
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
        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user)
            return res
                .status(401)
                .json({ error: "Incorrect email or password" });

        // Compare passwords
        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res
                .status(401)
                .json({ error: "Incorrect email or password" });

        await Tokens.destroy({ where: { user_id: user.id } });

        // Sign JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        await Tokens.create({
            user_id: user.id,
            token: token,
        });

        // Create response data
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.image_url,
        };

        res.json({ token, user: userData });
    } catch (err) {
        console.error("Login Error: ", err);
        res.status(500).json({ error: "Login Failed" });
    }
});

authRoutes.get("/validate-token", authenticateToken, (req, res) => {
    res.status(200).json({ valid: true });
});

export default authRoutes;
