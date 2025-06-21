import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import { authenticateSocket } from "./middleware/auth.js";
import { initSocketHandlers } from "./sockets/index.js";

import chatRoutes from "./routes/chats.js";

dotenv.config();

const app = express();

const options = {
    key: fs.readFileSync("./private.key"),
    cert: fs.readFileSync("./certificate.crt")
}

const server = https.createServer(options, app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

io.use(authenticateSocket);
io.on("connection", (socket) => {
    initSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
