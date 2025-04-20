import jwt from "jsonwebtoken";
import { Tokens } from "../models/index.js";

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err)
            return res.status(403).json({ error: "Invalid or expired token" });

        try {
            const dbToken = await Tokens.findOne({
                where: {
                    token: token,
                    user_id: user.userId,
                },
            });
            if (!dbToken)
                return res
                    .status(403)
                    .json({ error: "Token has been revoked" });

            req.user = user;
            next();
        } catch (err) {
            console.error("Token DB check error: ", err);
            res.status(500).json({ error: "Token validation failed" });
        }
    });
};

export const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication Error"));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return next(new Error("Authentication Error"));
        socket.user = user;
        next();
    });
};
