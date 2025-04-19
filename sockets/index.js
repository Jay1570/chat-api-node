import { authenticateSocket } from "../middleware/auth.js";
import db from "../config/sequelize.js";

const connectedUsers = new Map(); // userId → socket.id

export const initSocketHandlers = (io) => {
    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        const userId = socket.user.userId;
        connectedUsers.set(userId, socket.id);

        console.log(`User ${userId} connected`);

        socket.on("message:send", ({ toUserId, content }) => {
            const targetSocketId = connectedUsers.get(toUserId);
            const message = {
                fromUserId: userId,
                toUserId,
                content,
                timestamp: new Date().toISOString(),
            };

            if (targetSocketId) {
                io.to(targetSocketId).emit("message:receive", message);
            }

            //TODO: save message to Database
        });

        socket.on("typing", ({ toUserId }) => {
            const targetSocketId = connectedUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit("typing", { fromUserId: userId });
            }
        });

        socket.on("disconnect", () => {
            connectedUsers.delete(userId);
            console.log(` User ${userId} disconnected`);
        });
    });
};
