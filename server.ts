import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Store active users: userId -> socketId
  const activeUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // User joins with their mongoId
    socket.on("user:join", (userMongoId: string) => {
      activeUsers.set(userMongoId, socket.id);
      socket.data.userMongoId = userMongoId;
      console.log(`User ${userMongoId} joined`);
    });

    // Join a conversation room
    socket.on("conversation:join", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave a conversation room
    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(conversationId);
    });

    // New message
    socket.on("message:send", (message: any) => {
      // Broadcast to everyone in the conversation except sender
      socket.to(message.conversation).emit("message:receive", message);
    });

    // Typing indicator
    socket.on(
      "typing:start",
      ({
        conversationId,
        userName,
      }: {
        conversationId: string;
        userName: string;
      }) => {
        socket.to(conversationId).emit("typing:start", { userName });
      },
    );

    socket.on(
      "typing:stop",
      ({ conversationId }: { conversationId: string }) => {
        socket.to(conversationId).emit("typing:stop");
      },
    );

    // Read receipt
    socket.on(
      "message:read",
      ({
        conversationId,
        userMongoId,
      }: {
        conversationId: string;
        userMongoId: string;
      }) => {
        socket.to(conversationId).emit("message:read", { userMongoId });
      },
    );

    socket.on("disconnect", () => {
      if (socket.data.userMongoId) {
        activeUsers.delete(socket.data.userMongoId);
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  // Make io accessible to API routes if needed
  (global as any).io = io;

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
