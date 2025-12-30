// init socket and manage onlineUsers map
import { Server } from "socket.io";

let ioInstance = null;
export const onlineUsers = {}; // userId => [socketId, ...]

export const initSocket = (server) => {
  if (ioInstance) return ioInstance;
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
       
      if (!userId) return;
      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      if (!onlineUsers[userId].includes(socket.id)) onlineUsers[userId].push(socket.id);
      console.log("Registered", userId, onlineUsers[userId]);
    });

    socket.on("disconnect", () => {
      // remove socket from any user list
      for (const [uid, sockets] of Object.entries(onlineUsers)) {
        onlineUsers[uid] = sockets.filter((s) => s !== socket.id);
        if (onlineUsers[uid].length === 0) delete onlineUsers[uid];
      }
      console.log("Socket disconnected:", socket.id);
    });
  });

  ioInstance = io;
  return ioInstance;
};

export const getIo = () => ioInstance;
