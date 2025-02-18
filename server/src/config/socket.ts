import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Socket } from "socket.io";

// Interface for tracking connected users
interface ConnectedUsers {
  [userId: string]: string; // userId: socketId
}

let io: SocketIOServer;
const connectedUsers: ConnectedUsers = {};

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, replace with specific origin
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("New user connected:", socket.id);

    // Handle user authentication and store socket id
    socket.on("authenticate", (userId: string) => {
      connectedUsers[userId] = socket.id;
      socket.join(userId); // Create a room for the user
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });

    // Handle private messages
    socket.on("private-message", (data: { to: string; message: any }) => {
      const recipientSocketId = connectedUsers[data.to];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("private-message", data.message);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Remove user from connected users
      const userId = Object.keys(connectedUsers).find(
        (key) => connectedUsers[key] === socket.id
      );
      if (userId) {
        delete connectedUsers[userId];
      }
    });
  });

  return io;
};

// Get socket instance
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Helper function to check if a user is online
export const isUserOnline = (userId: string): boolean => {
  return !!connectedUsers[userId];
};

// Helper function to get user's socket id
export const getUserSocketId = (userId: string): string | undefined => {
  return connectedUsers[userId];
};

// Export io instance
export { io };
