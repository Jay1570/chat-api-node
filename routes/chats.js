import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { conversationHelpers, messageHelpers } from "../DBHelperFunctions.js";

const chatRoutes = express.Router();

// Middleware to verify conversation access
async function verifyConversationAccess(req, res, next) {
    const conversationId = req.params.conversationId;
    try {
        const hasAccess = await conversationHelpers.userHasAccess(
            conversationId,
            req.user.userId
        );
        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    } catch (err) {
        console.error("Conversation access verification failed: ", err);
        res.status(500).json({ error: "Server error" });
    }
}

// Start a new conversation
chatRoutes.post("/start", authenticateToken, async (req, res) => {
    const { user2_id } = req.body;

    if (!user2_id) return res.status(400).json({ error: "Bad Request" });

    try {
        const conversation = await conversationHelpers.createConversation(
            req.user.userId,
            user2_id
        );
        res.json({ success: true, conversationId: conversation.id });
    } catch (err) {
        console.error("Failed to start a new conversation: ", err);
        res.status(500).json({ error: "Failed to create a conversation" });
    }
});

// Get all conversations for the current user
chatRoutes.get("/", authenticateToken, async (req, res) => {
    try {
        const conversations = await conversationHelpers.getUserConversations(
            req.user.userId
        );
        res.json(conversations);
    } catch (err) {
        console.error("Failed to fetch contacts: ", err);
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
});

// Get messages for a specific conversation
chatRoutes.get(
    "/:conversationId/messages",
    authenticateToken,
    verifyConversationAccess,
    async (req, res) => {
        const conversationId = req.params.conversationId;

        try {
            const messages = await messageHelpers.getConversationMessages(
                conversationId
            );
            res.json(messages);
        } catch (err) {
            console.error("Failed to fetch messages: ", err);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    }
);

// Send a new message in a conversation
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
            const message = await messageHelpers.createMessage(
                conversationId,
                req.user.userId,
                content
            );
            res.status(201).json(message);
        } catch (err) {
            console.error("Failed to store message: ", err);
            res.status(500).json({ error: "Failed to store message" });
        }
    }
);

// Mark a message as read
chatRoutes.put(
    "/:conversationId/updateStatus/:messageId",
    authenticateToken,
    verifyConversationAccess,
    async (req, res) => {
        try {
            const success = await messageHelpers.markMessageAsRead(
                req.params.messageId
            );
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: "Message not found" });
            }
        } catch (err) {
            console.error("Failed to update status: ", err);
            res.status(500).json({ error: "Failed to update status" });
        }
    }
);

export default chatRoutes;
