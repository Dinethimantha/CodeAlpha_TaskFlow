
const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");

exports.createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            project,
            assignedTo,
            status,
            priority,
            dueDate
        } = req.body;

        if (!title || !project) {
            return res.status(400).json({
                success: false,
                message: "Task title and project are required"
            });
        }

        const existingProject = await Project.findOne({
            _id: project,
            members: req.user._id
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not a member"
            });
        }

        if (
            assignedTo &&
            !existingProject.members.some(
                member => member.toString() === assignedTo.toString()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Assigned user must be a project member"
            });
        }

        const task = await Task.create({
            title,
            description,
            project,
            assignedTo: assignedTo || null,
            createdBy: req.user._id,
            status,
            priority,
            dueDate: dueDate || null
        });

        if (
            assignedTo &&
            assignedTo.toString() !== req.user._id.toString()
        ) {
            const notification = await Notification.create({
                recipient: assignedTo,
                sender: req.user._id,
                project: project,
                task: task._id,
                message: `${req.user.fullName} assigned you a new task: ${task.title}`,
                type: "task_assigned"
            });

            const io = req.app.get("io");

            if (io) {
                io.to(assignedTo.toString()).emit(
                    "newNotification",
                    notification
                );
            }
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating task"
        });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const { project } = req.query;

        if (!project) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        const existingProject = await Project.findOne({
            _id: project,
            members: req.user._id
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not a member"
            });
        }

        const tasks = await Task.find({ project })
            .populate("assignedTo", "fullName username email")
            .populate("createdBy", "fullName username email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        console.error("Get Tasks Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving tasks"
        });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate("assignedTo", "fullName username email")
            .populate("createdBy", "fullName username email")
            .populate("project", "name description");

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const isMember = await Project.findOne({
            _id: task.project._id,
            members: req.user._id
        });

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this task"
            });
        }

        res.status(200).json({
            success: true,
            task
        });

    } catch (error) {
        console.error("Get Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving task"
        });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            status,
            priority,
            dueDate
        } = req.body;

        const task = await Task.findById(req.params.id);

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
                message: "You are not authorized to update this task"
            });
        }

        const changes = [];

        if (title !== undefined && title !== task.title) {
            task.title = title;
            changes.push("title");
        }

        if (description !== undefined && description !== task.description) {
            task.description = description;
            changes.push("description");
        }

        if (assignedTo !== undefined) {
            if (
                assignedTo &&
                !project.members.some(
                    member => member.toString() === assignedTo.toString()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user must be a project member"
                });
            }

            const oldAssignedTo = task.assignedTo
                ? task.assignedTo.toString()
                : "";

            const newAssignedTo = assignedTo
                ? assignedTo.toString()
                : "";

            if (oldAssignedTo !== newAssignedTo) {
                task.assignedTo = assignedTo || null;
                changes.push("assignee");
            }
        }

        if (status !== undefined && status !== task.status) {
            task.status = status;
            changes.push("status");
        }

        if (priority !== undefined && priority !== task.priority) {
            task.priority = priority;
            changes.push("priority");
        }

        if (dueDate !== undefined) {
            const oldDate = task.dueDate
                ? new Date(task.dueDate).toISOString()
                : "";

            const newDate = dueDate
                ? new Date(dueDate).toISOString()
                : "";

            if (oldDate !== newDate) {
                task.dueDate = dueDate || null;
                changes.push("due date");
            }
        }

        await task.save();

        console.log("Detected Task Changes:", changes);
        console.log(
            "Project Members:",
            project.members.map(member => member.toString())
        );

        if (changes.length > 0) {
            const members = project.members.filter(
                member => member.toString() !== req.user._id.toString()
            );

            const io = req.app.get("io");

            for (const member of members) {
                const notification = await Notification.create({
                    recipient: member,
                    sender: req.user._id,
                    project: project._id,
                    task: task._id,
                    message: `${req.user.fullName} updated ${changes.join(", ")} in task: ${task.title}`,
                    type: "task_updated"
                });

                if (io) {
                    io.to(member.toString()).emit(
                        "newNotification",
                        notification
                    );
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        console.error("Update Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating task"
        });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const project = await Project.findOne({
            _id: task.project,
            owner: req.user._id
        });

        if (!project) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can delete this task"
            });
        }

        await Task.findByIdAndDelete(task._id);

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete Task Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting task"
        });
    }
};
