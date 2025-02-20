import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Socket } from "socket.io";
import msgModel from "../models/msgModel";

interface ConnectedUsers {
  [userId: string]: string;
}

let io: SocketIOServer;
const connectedUsers: ConnectedUsers = {};

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket: Socket) => {
    console.log("New user connected:", socket.id);

    socket.on("authenticate", (userId: string) => {
      connectedUsers[userId] = socket.id;
      socket.join(userId);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });

    // Typing Indicator
    socket.on("typing", ({ sender, receiver }) => {
      if (isUserOnline(receiver)) {
        io.to(receiver).emit("typing", { sender });
      }
    });

    socket.on("stopped-typing", ({ sender, receiver }) => {
      if (isUserOnline(receiver)) {
        io.to(receiver).emit("stopped-typing", { sender });
      }
    });

    // Message Read
    socket.on("message-read", async ({ messageId, receiver }) => {
      const message = await msgModel.findByIdAndUpdate(messageId, {
        status: "read",
      });
      if (message) {
        io.to(message.sender.toString()).emit("message-status-update", {
          messageId,
          status: "read",
        });
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      const userId = Object.keys(connectedUsers).find(
        (key) => connectedUsers[key] === socket.id
      );
      if (userId) {
        delete connectedUsers[userId];
      }
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

// Utility Functions
export const isUserOnline = (userId: string): boolean =>
  !!connectedUsers[userId];
export { io };
