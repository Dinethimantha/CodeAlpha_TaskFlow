const Project = require("../models/Project");
const User = require("../models/User");

exports.createProject = async (req, res) => {
    try {
        const { name, description, color, dueDate } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        const project = await Project.create({
            name,
            description,
            color,
            dueDate: dueDate || null,
            owner: req.user._id,
            members: [req.user._id]
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project
        });

    } catch (error) {
        console.error("Create Project Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating project"
        });
    }
};
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            members: req.user._id
        })
            .populate("owner", "fullName username email")
            .populate("members", "fullName username email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });

    } catch (error) {
        console.error("Get Projects Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving projects"
        });
    }
};
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            members: req.user._id
        })
            .populate("owner", "fullName username email")
            .populate("members", "fullName username email");

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            project
        });

    } catch (error) {
        console.error("Get Project Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving project"
        });
    }
};
exports.updateProject = async (req, res) => {
    try {
        const { name, description, color, status, dueDate } = req.body;

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner"
            });
        }

        if (name !== undefined) project.name = name;
        if (description !== undefined) project.description = description;
        if (color !== undefined) project.color = color;
        if (status !== undefined) project.status = status;
        if (dueDate !== undefined) project.dueDate = dueDate || null;

        await project.save();

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project
        });

    } catch (error) {
        console.error("Update Project Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating project"
        });
    }
};
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner"
            });
        }

        await Project.findByIdAndDelete(project._id);

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        console.error("Delete Project Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting project"
        });
    }
};
exports.addProjectMember = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (project.members.some(
            member => member.toString() === userId
        )) {
            return res.status(400).json({
                success: false,
                message: "User is already a project member"
            });
        }

        project.members.push(userId);

        await project.save();

        res.status(200).json({
            success: true,
            message: "Project member added successfully",
            project
        });

    } catch (error) {
        console.error("Add Project Member Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding project member"
        });
    }
};