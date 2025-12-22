// utils/socketEvents.js
import Notification from "../models/Notification.js";
import { getIo, onlineUsers } from "../config/socket.js";

/**
 * Create notification in DB + send in realtime if user online
 */
export const createAndSendNotification = async (userId, data) => {
  const note = await Notification.create({
    user: userId,
    title: data.title,
    message: data.message,
    data: data.data || {},
  });

  const io = getIo();
  if (!io) return note;

  // send to all sockets of user
  const sockets = onlineUsers[userId];
  if (sockets && sockets.length > 0) {
    sockets.forEach((sockId) => {
      io.to(sockId).emit("notification", note);
    });
  }

  return note;
};



