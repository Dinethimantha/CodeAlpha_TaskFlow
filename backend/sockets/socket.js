const onlineUsers = new Map();

const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join", (userId) => {
            if (!userId) return;

            onlineUsers.set(userId, socket.id);
            socket.userId = userId;

            socket.join(userId);

            console.log("User joined:", userId);
        });

        socket.on("disconnect", () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log("User disconnected:", socket.userId);
            }
        });
    });
};

const sendNotification = (io, userId, notification) => {
    io.to(userId.toString()).emit("newNotification", notification);
};

module.exports = {
    initializeSocket,
    sendNotification
};