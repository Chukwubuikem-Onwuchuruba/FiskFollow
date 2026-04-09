import { Server } from "socket.io";

// const io = new Server(3001, {
//   cors: {
//     origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });

const io = new Server(3001, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const activeUsers = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("user:join", (userMongoId: string) => {
    activeUsers.set(userMongoId, socket.id);
    socket.data.userMongoId = userMongoId;
  });

  socket.on("conversation:join", (conversationId: string) => {
    socket.join(conversationId);
  });

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(conversationId);
  });

  socket.on("message:send", (message: any) => {
    socket.to(message.conversation).emit("message:receive", message);
  });

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

  socket.on("typing:stop", ({ conversationId }: { conversationId: string }) => {
    socket.to(conversationId).emit("typing:stop");
  });

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
  });

  socket.on("message:send", (message: any) => {
    // Broadcast message to conversation room
    socket.to(message.conversation).emit("message:receive", message);

    // Notify all participants about unread count change
    socket.to(message.conversation).emit("notification:newMessage");
  });

  socket.on("notification:messagesRead", () => {
    socket.emit("notification:messagesRead");
  });

  socket.on("post:liked", (data: { postId: string; likes: string[] }) => {
    io.emit("post:likesUpdated", data);
  });

  socket.on("post:reposted", (data: { postId: string; reposts: string[] }) => {
    io.emit("post:repostsUpdated", data);
  });

  socket.on(
    "user:followed",
    (data: { followingId: string; followersCount: number }) => {
      io.emit("user:followersUpdated", data);
    },
  );

  socket.on(
    "user:unfollowed",
    (data: { followingId: string; followersCount: number }) => {
      io.emit("user:followersUpdated", data);
    },
  );
});

console.log("> Socket.io server ready on port 3001");
