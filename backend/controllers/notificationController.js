const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("sender", "fullName username profilePicture")
            .populate("project", "name")
            .populate("task", "title")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving notifications"
        });
    }
};
exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error("Mark Notification Read Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating notification"
        });
    }
};
exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark All Notifications Read Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating notifications"
        });
    }
};