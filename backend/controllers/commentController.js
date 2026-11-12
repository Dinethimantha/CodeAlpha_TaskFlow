
const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");

exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required"
            });
        }

        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await Project.findOne({
            _id: task.project,
            members: req.user._id
        });

        if (!project) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to comment on this task"
            });
        }

        const comment = await Comment.create({
            task: task._id,
            user: req.user._id,
            content: content.trim()
        });

        await comment.populate(
            "user",
            "fullName username profilePicture"
        );

        if (
            task.createdBy.toString() !== req.user._id.toString()
        ) {
            const notification = await Notification.create({
                recipient: task.createdBy,
                sender: req.user._id,
                project: task.project,
                task: task._id,
                message: `${req.user.fullName} commented on your task: ${task.title}`,
                type: "comment_added"
            });

            const io = req.app.get("io");

            if (io) {
                io.to(task.createdBy.toString()).emit(
                    "newNotification",
                    notification
                );
            }
        }

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment
        });

    } catch (error) {
        console.error("Create Comment Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding comment"
        });
    }
};

exports.getComments = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await Project.findOne({
            _id: task.project,
            members: req.user._id
        });

        if (!project) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view these comments"
            });
        }

        const comments = await Comment.find({
            task: task._id
        })
            .populate("user", "fullName username profilePicture")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: comments.length,
            comments
        });

    } catch (error) {
        console.error("Get Comments Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving comments"
        });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required"
            });
        }

        const comment = await Comment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or you are not the author"
            });
        }

        comment.content = content.trim();

        await comment.save();

        await comment.populate(
            "user",
            "fullName username profilePicture"
        );

        res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            comment
        });

    } catch (error) {
        console.error("Update Comment Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating comment"
        });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or you are not the author"
            });
        }

        await Comment.findByIdAndDelete(comment._id);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error("Delete Comment Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting comment"
        });
    }
};
