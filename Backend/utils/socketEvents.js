// utils/socketEvents.js
import Notification from "../models/Notification.js";
import { getIo, onlineUsers } from "../config/socket.js";

/**
 * Create notification in DB + send in realtime if user online
 */
export const createAndSendNotification = async (userIds, data) => {
  const io = getIo();
  if (!Array.isArray(userIds)) userIds = [userIds];

  for (const userId of userIds) {
    const note = await Notification.create({
      user: userId,
      title: data.title,
      message: data.message,
      type: data.type || 'nearby_post',
      data: data.data || {},
    });

    if (!io) continue;

    const sockets = onlineUsers[userId];
    if (sockets?.length) {
      sockets.forEach((sockId) => {
        io.to(sockId).emit("notification", note);
      });
    }
  }
};
