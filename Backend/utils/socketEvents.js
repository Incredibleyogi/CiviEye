// utils/socketEvents.js
import Notification from "../models/Notification.js";
import { getIo, onlineUsers } from "../config/socket.js";

export const createAndSendNotification = async (userIds, data) => {
  if (!Array.isArray(userIds)) userIds = [userIds];
  if (!userIds.length) return;

  const io = getIo();

  // 1️⃣ Prepare notifications
  const notifications = userIds.map(userId => ({
    user: userId,
    title: data.title,
    message: data.message,
    type: data.type || "nearby_post",
    data: data.data || {},
    isRead: false,
  }));

  // 2️⃣ Insert ALL at once (atomic)
  const savedNotifications = await Notification.insertMany(notifications);

  // 3️⃣ Emit socket events (if online)
  if (!io) return;

  for (const note of savedNotifications) {
    const sockets = onlineUsers[note.user?.toString()];
    if (sockets?.length) {
      sockets.forEach(sockId => {
        io.to(sockId).emit("notification", note);
      });
    }
  }
};
