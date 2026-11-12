
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: true,
        trim: true
    },

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    phoneNumber: {
        type: String,
        default: "",
        trim: true
    },

    profilePicture: {
        type: String,
        default: ""
    },

    bio: {
        type: String,
        default: ""
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
