import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const Conversation = sequelize.define(
    "Conversation",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user1_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        user2_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
    },
    {
        tableName: "conversations",
        underscored: true,
        timestamps: false,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export default Conversation;
