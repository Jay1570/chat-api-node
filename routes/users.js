import express from "express";
import { User } from "../models/index.js";
import { Op } from "sequelize";
import { authenticateToken } from "../middleware/auth.js";

const userRoutes = express.Router();

// Get current user profile
userRoutes.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ["id", "name", "email", "image_url", "created_at"],
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error("Failed to fetch user: ", err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Update user avatar
userRoutes.put("/avatar", authenticateToken, async (req, res) => {
    const { avatar_url } = req.body;

    if (!avatar_url) {
        return res.status(400).json({ error: "avatar_url required" });
    }

    try {
        const [updatedRows] = await User.update(
            { image_url: avatar_url },
            { where: { id: req.user.userId } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Failed to update image: ", err);
        res.status(500).json({ error: "Failed to update avatar" });
    }
});

// Update user name
userRoutes.put("/name", authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "name required" });
    }

    try {
        const [updatedRows] = await User.update(
            { name },
            { where: { id: req.user.userId } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Failed to update name: ", err);
        res.status(500).json({ error: "Failed to update name" });
    }
});

// Get user by ID
userRoutes.get("/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findByPk(userId, {
            attributes: ["id", "name", "image_url"],
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error("Failed to fetch user: ", err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Search users
userRoutes.get("/search", authenticateToken, async (req, res) => {
    const { criteria } = req.query;

    if (!criteria) {
        return res.status(400).json({ error: "Search criteria is required" });
    }

    try {
        const users = await User.findAll({
            attributes: ["id", "name", "email", "image_url"],
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${criteria}%` } },
                            { email: { [Op.iLike]: `%${criteria}%` } },
                        ],
                    },
                    { id: { [Op.ne]: Number(req.user.userId) } },
                ],
            },
        });

        res.json(users);
    } catch (err) {
        console.error("Failed to fetch users: ", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

export default userRoutes;
