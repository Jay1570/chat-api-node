export default async function verifyConversationAccess(req, res, next) {
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
