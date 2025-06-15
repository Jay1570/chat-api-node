import User from "./Users.js";
import Conversation from "./Conversations.js";
import Message from "./Messages.js";
import Tokens from "./Tokens.js";
import sequelize from "../config/sequelize.js";

sequelize.sync({
    // alter:true, /*
    alter: false, /**/
})
User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { foreignKey: "sender_id" });

Conversation.hasMany(Message, { foreignKey: "conversation_id" });
Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

Conversation.belongsTo(User, { as: "User1", foreignKey: "user1_id" });
Conversation.belongsTo(User, { as: "User2", foreignKey: "user2_id" });

User.hasMany(Tokens, { foreignKey: "user_id" });
Tokens.belongsTo(User, { foreignKey: "user_id" });

export { User, Conversation, Message, Tokens };
