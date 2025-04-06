import express from "express";
import db from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const chatRoutes = express.Router();

async function verifyConversationAccess(req, res, next) {
    const conversationId = req.params.conversationId;
    try {
        const result = await db.query(
            "SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)",
            [conversationId, req.user.userId]
        );
        if (result.rowCount === 0) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    } catch (err) {
        console.error("Conversation access verification failed: ", err);
        res.status(500).json({ error: "Server error" });
    }
}


chatRoutes.post("/start", authenticateToken, async (req, res) => {
    const { user2_id } = req.body;

    if (!user2_id) return res.status(400).json({ error: "Bad Request" });

    try {
        await db.query(
            "INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2)",
            [req.user.userId, user2_id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to start a new conversation: ", err);
        res.status(500).json({ error: "Failed to create a conversation" });
    }
});

chatRoutes.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM conversations WHERE user1_id = $1 OR user2_id = $1",
            [req.user.userId]
        );

        if (result.rowCount === 0) return res.json([]);

        const conversations = result.rows.map((conversation) => {
            const otherUserId = conversation.user1_id === req.user.userId
                ? conversation.user2_id
                : conversation.user1_id;
            
            return {
                userId: otherUserId,
                conversationId: conversation.id
            };
        });

        const userIds = conversations.map(c => c.userId);

        const contacts = await db.query(
            "SELECT id, name, image_url FROM users WHERE id = ANY($1)",
            [userIds]
        );

        const finalResult = contacts.rows.map(user => {
            const convo = conversations.find(c => c.userId === user.id);
            return {
                ...user,
                conversationId: convo.conversationId
            };
        });

        res.json(finalResult);
    } catch (err) {
        console.error("Failed to fetch contacts: ", err);
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
});

chatRoutes.get(
    "/:conversationId/messages",
    authenticateToken,
    verifyConversationAccess,
    async (req, res) => {
        const conversationId = req.params.conversationId;

        try {
            const result = await db.query(
                "SELECT id, sender_id, content, created_at, is_read FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
                [conversationId]
            );
            res.json(result.rows);
        } catch (err) {
            console.error("Failed to fetch messages: ", err);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    }
);

chatRoutes.post(
    "/:conversationId/message",
    authenticateToken,
    verifyConversationAccess,
    async (req, res) => {
        const conversationId = req.params.conversationId;
        const { content } = req.body;

        if (!content)
            return res.status(400).json({ error: "Content is required" });

        try {
            const result = await db.query(
                "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
                [conversationId, req.user.userId, content]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error("Failed to store message: ", err);
            res.status(500).json({ error: "Failed to store message" });
        }
    }
);

chatRoutes.put(
    ":conversationId/updateStatus/:messageId",
    authenticateToken,
    verifyConversationAccess,
    async (req, res) => {
        try {
            await db.query(
                "UPDATE messages SET is_read = true WHERE id = $1",
                [req.params.messageId]
            );
            res.json({ success: true });
        } catch (err) {
            console.error("Failed to update status: ", err);
            res.status(500).json({ error: "Failed to update status" });
        }
    }
);

export default chatRoutes;
