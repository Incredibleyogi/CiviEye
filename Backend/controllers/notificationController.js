import Notification from "../models/Notification.js";

/**
 * GET /api/notifications/   - list user's notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('[notificationController] Fetching notifications for user:', userId);
    const notes = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
    console.log('[notificationController] Found notifications count:', notes.length, '| Unread count:', notes.filter(n => !n.isRead).length);
    res.json({ notifications: notes });
  } catch (err) {
    console.error('[notificationController] Error fetching notifications:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/notifications/mark-read
 * body: { ids: [id,...] }
 */
export const markRead = async (req, res) => {
  try {
    const userId = req.user._id;  // FIX: Changed from req.user.id to req.user._id (MongoDB ObjectId)
    const { ids } = req.body;
    console.log('[notificationController] Marking notifications as read:', { userId, notificationIds: ids });
    
    if (!Array.isArray(ids)) return res.status(400).json({ message: "ids array required" });

    const result = await Notification.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { isRead: true } }
    );
    
    console.log('[notificationController] Updated notifications:', { modifiedCount: result.modifiedCount, matchedCount: result.matchedCount });

    res.json({ message: "Marked read", modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('[notificationController] Error marking read:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/*notification count
*/
export const getNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });
    console.log('[notificationController] Unread notification count for user', req.user._id, ':', count);

    res.json({ count });
  } catch (err) {
    console.error('[notificationController] Error getting notification count:', err.message);
    res.status(500).json({ message: err.message });
  }
};
