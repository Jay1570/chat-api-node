import express from "express";
import db from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const userRoutes = express.Router();

userRoutes.get("/me", authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, name, email, image_url, created_at FROM users WHERE id = $1",
            [req.user.userId]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ error: "User not found" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Failed to fetch user: ", err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

userRoutes.put("/avatar", authenticateToken, async (req, res) => {
    const { avatar_url } = req.body;

    if (!avatar_url)
        return res.status(400).json({ error: "avatar_url required" });

    try {
        await db.query("UPDATE users SET image_url = $1 WHERE id = $2", [
            avatar_url,
            req.user.userId,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to update image: ", err);
        res.status(500).json({ error: "Failed to update avatar" });
    }
});

userRoutes.put("/name", authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: "name required" });

    try {
        await db.query("UPDATE users SET name = $1 WHERE id = $2", [
            name,
            req.user.userId,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to update name: ", err);
        res.status(500).json({ error: "Failed to update name" });
    }
});

userRoutes.get("/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await db.query(
            "SELECT id, name, image_url FROM users WHERE id = $1",
            [userId]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ error: "User not found" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Failed to fetch user: ", err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

userRoutes.get("/search", authenticateToken, async (req, res) => {
    const { criteria } = req.query;

    if (!criteria)
        return res.status(400).json({ error: "Search criteria is required" });

    try {
        const result = await db.query(
            "SELECT id, name, email, image_url FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2",
            [`%${criteria}%`, req.user.userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Failed to fetch users: ", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

export default userRoutes;
