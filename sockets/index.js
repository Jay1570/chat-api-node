import { authenticateSocket } from "../middleware/auth.js";

const connectedUsers = new Map(); // userId → socket.id

export const initSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.user.userId;
    connectedUsers.set(userId, socket.id);

    console.log(`✅ User ${userId} connected`);

    // Notify friends: "user online" (optional)
    // socket.broadcast.emit("user:online", { userId });

    // One-on-one messaging
    socket.on("message:send", ({ toUserId, content }) => {
      const targetSocketId = connectedUsers.get(toUserId);
      const message = {
        fromUserId: userId,
        toUserId,
        content,
        timestamp: new Date().toISOString(),
      };

      // Emit message to receiver if online
      if (targetSocketId) {
        io.to(targetSocketId).emit("message:receive", message);
      }

      // Save message to DB (you can plug it in here)
    });

    // Typing indicator
    socket.on("typing", ({ toUserId }) => {
      const targetSocketId = connectedUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("typing", { fromUserId: userId });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      console.log(`❌ User ${userId} disconnected`);
    });
  });
};