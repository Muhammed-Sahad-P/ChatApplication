import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface ChatState {
  userId: string | null;
  socket: Socket | null;
  setUserId: (id: string) => void;
  connectSocket: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  userId: localStorage.getItem("userId") || null,
  socket: null,
  setUserId: (id) => {
    localStorage.setItem("userId", id);
    set({ userId: id });
  },
  connectSocket: () => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        socket.emit("authenticate", storedUserId);
      }
    });

    set({ socket });
  },
}));
