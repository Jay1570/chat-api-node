import User from "./Users.js";
import Conversation from "./Conversations.js";
import Message from "./Messages.js";

User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { foreignKey: "sender_id" });

Conversation.hasMany(Message, { foreignKey: "conversation_id" });
Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

Conversation.belongsTo(User, { as: "User1", foreignKey: "user1_id" });
Conversation.belongsTo(User, { as: "User2", foreignKey: "user2_id" });

export { User, Conversation, Message };
