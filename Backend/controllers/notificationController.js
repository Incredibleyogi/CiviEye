import Notification from "../models/Notification.js";

/**
 * GET /api/notifications/   - list user's notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
    res.json({ notifications: notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/notifications/mark-read
 * body: { ids: [id,...] }
 */
export const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ message: "ids array required" });

    await Notification.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { read: true } }
    );

    res.json({ message: "Marked read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
