import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const Tokens = sequelize.define(
    "Tokens",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },

    {
        tableName: "oauth_jwt_tokens",
        underscored: true,
        timestamps: false,
        createdAt: "created_at",
        updatedAt: false,
    }
);

export default Tokens;
