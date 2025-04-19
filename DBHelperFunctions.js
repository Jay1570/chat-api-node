// src/helpers/DBHelperFunctions.js
import { Conversation, Message, User } from "./models/index.js";
import { Op } from "sequelize";

export const conversationHelpers = {
    /**
     * Check if a user has access to a conversation
     * @param {number} conversationId - The conversation ID
     * @param {number} userId - The user ID
     * @returns {Promise<boolean>} - Whether the user has access
     */
    async userHasAccess(conversationId, userId) {
        const count = await Conversation.count({
            where: {
                id: conversationId,
                [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
            },
        });
        return count > 0;
    },

    /**
     * Create a new conversation between two users
     * @param {number} user1Id - First user's ID
     * @param {number} user2Id - Second user's ID
     * @returns {Promise<Conversation>} - The created conversation
     */
    async createConversation(user1Id, user2Id) {
        return await Conversation.create({
            user1_id: user1Id,
            user2_id: user2Id,
        });
    },

    /**
     * Get all conversations for a user with conversation partners' details
     * @param {number} userId - The user ID
     * @returns {Promise<Array>} - List of conversations with user details
     */
    async getUserConversations(userId) {
        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
            },
            raw: true,
        });

        if (conversations.length === 0) return [];

        // Extract other user IDs from conversations
        const otherUserIds = conversations.map((conversation) =>
            conversation.user1_id === userId
                ? conversation.user2_id
                : conversation.user1_id
        );

        // Get user details for all other users
        const users = await User.findAll({
            attributes: ["id", "name", "image_url"],
            where: {
                id: {
                    [Op.in]: otherUserIds,
                },
            },
            raw: true,
        });

        // Combine user details with conversation IDs
        return users.map((user) => {
            const conversation = conversations.find(
                (c) => c.user1_id === user.id || c.user2_id === user.id
            );

            return {
                ...user,
                conversationId: conversation.id,
            };
        });
    },
};

export const messageHelpers = {
    /**
     * Get all messages for a conversation
     * @param {number} conversationId - The conversation ID
     * @returns {Promise<Array>} - List of messages
     */
    async getConversationMessages(conversationId) {
        return await Message.findAll({
            where: { conversation_id: conversationId },
            order: [["created_at", "ASC"]],
            raw: true,
        });
    },

    /**
     * Create a new message in a conversation
     * @param {number} conversationId - The conversation ID
     * @param {number} senderId - The sender's user ID
     * @param {string} content - The message content
     * @returns {Promise<Message>} - The created message
     */
    async createMessage(conversationId, senderId, content) {
        return await Message.create({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            is_read: false,
        });
    },

    /**
     * Mark a message as read
     * @param {number} messageId - The message ID
     * @returns {Promise<boolean>} - Success status
     */
    async markMessageAsRead(messageId) {
        const [updatedRows] = await Message.update(
            { is_read: true },
            { where: { id: messageId } }
        );
        return updatedRows > 0;
    },
};
