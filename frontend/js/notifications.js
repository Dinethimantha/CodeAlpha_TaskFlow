
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const notificationList = document.getElementById("notificationList");
    const notificationFilter = document.getElementById("notificationFilter");
    const totalNotifications = document.getElementById("totalNotifications");
    const notificationCount = document.getElementById("notificationCount");
    const markAllReadButton = document.getElementById("markAllReadButton");

    let notifications = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function formatDate(date) {
        if (!date) return "";

        const formattedDate = new Date(date);

        if (isNaN(formattedDate.getTime())) return "";

        return formattedDate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function getNotificationIcon(type) {
        if (type === "task_assigned" || type === "task_updated") {
            return {
                icon: "bi-check2-square",
                className: "task"
            };
        }

        if (type === "comment_added") {
            return {
                icon: "bi-chat-left-text",
                className: "comment"
            };
        }

        if (type === "project_invitation") {
            return {
                icon: "bi-folder-plus",
                className: "project"
            };
        }

        return {
            icon: "bi-bell",
            className: "task"
        };
    }

    function updateCounts() {
        const unreadCount = notifications.filter(
            notification => !notification.isRead
        ).length;

        totalNotifications.textContent =
            `${notifications.length} Notifications`;

        notificationCount.textContent = unreadCount;

        notificationCount.style.display = unreadCount > 0
            ? "inline-block"
            : "none";

        markAllReadButton.disabled = unreadCount === 0;
    }

    function renderNotifications() {
        const filter = notificationFilter.value;

        let filteredNotifications = [...notifications];

        if (filter === "unread") {
            filteredNotifications = filteredNotifications.filter(
                notification => !notification.isRead
            );
        } else if (filter === "read") {
            filteredNotifications = filteredNotifications.filter(
                notification => notification.isRead
            );
        }

        updateCounts();

        if (filteredNotifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="bi bi-bell-slash"></i>
                    <h6>No Notifications Found</h6>
                    <p class="mb-0">There are no notifications to display.</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = filteredNotifications.map(notification => {
            const icon = getNotificationIcon(notification.type);
            const senderName = notification.sender?.fullName || "TaskFlow";
            const taskName = notification.task?.title || "";
            const projectName = notification.project?.name || "";

            return `
                <div class="notification-item ${notification.isRead ? "" : "unread"}">

                    <div class="notification-icon ${icon.className}">
                        <i class="bi ${icon.icon}"></i>
                    </div>

                    <div class="notification-content">
                        <h6>${escapeHTML(notification.message)}</h6>

                        <p>
                            ${escapeHTML(senderName)}
                            ${taskName ? ` · ${escapeHTML(taskName)}` : ""}
                            ${projectName ? ` · ${escapeHTML(projectName)}` : ""}
                        </p>

                        <span class="notification-time">
                            <i class="bi bi-clock me-1"></i>
                            ${escapeHTML(formatDate(notification.createdAt))}
                        </span>
                    </div>

                    <div class="notification-actions">
                        ${notification.isRead
                            ? '<span class="text-secondary" style="font-size:10px;">Read</span>'
                            : `
                                <span class="unread-dot"></span>
                                <button class="mark-read-btn" data-id="${escapeHTML(notification._id)}">
                                    Mark as Read
                                </button>
                            `
                        }
                    </div>

                </div>
            `;
        }).join("");
    }

    async function loadNotifications() {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="bi bi-arrow-repeat"></i>
                Loading notifications...
            </div>
        `;

        const response = await fetch(`${API_URL}/notifications`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load notifications");
        }

        notifications = data.notifications || [];

        renderNotifications();
    }

    async function markAsRead(notificationId) {
        try {
            const response = await fetch(
                `${API_URL}/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update notification");
            }

            const notification = notifications.find(
                item => item._id === notificationId
            );

            if (notification) {
                notification.isRead = true;
            }

            renderNotifications();

        } catch (error) {
            alert(error.message);
        }
    }

    async function markAllAsRead() {
        try {
            markAllReadButton.disabled = true;

            const response = await fetch(`${API_URL}/notifications/read-all`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update notifications");
            }

            notifications.forEach(notification => {
                notification.isRead = true;
            });

            renderNotifications();

        } catch (error) {
            alert(error.message);
        } finally {
            updateCounts();
        }
    }

    notificationList.addEventListener("click", function (event) {
        const button = event.target.closest(".mark-read-btn");

        if (!button) return;

        markAsRead(button.dataset.id);
    });

    notificationFilter.addEventListener("change", renderNotifications);

    markAllReadButton.addEventListener("click", markAllAsRead);

    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const topbarAvatar = document.getElementById("topbarAvatar");

    if (sidebarUserName) {
        sidebarUserName.textContent = user.fullName || "User";
    }

    const initial = (user.fullName || "U").charAt(0).toUpperCase();

    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (topbarAvatar) topbarAvatar.textContent = initial;

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("taskflowToken");
            localStorage.removeItem("taskflowUser");
            window.location.href = "login.html";
        });
    }

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", function () {
            sidebar.classList.toggle("active");
        });
    }

    const themeToggle = document.getElementById("themeToggle");

    if (themeToggle) {
        const savedTheme = localStorage.getItem("taskflowTheme") || "light";

        document.body.classList.toggle("dark-theme", savedTheme === "dark");

        themeToggle.innerHTML = savedTheme === "dark"
            ? '<i class="bi bi-sun"></i>'
            : '<i class="bi bi-moon"></i>';

        themeToggle.addEventListener("click", function () {
            const isDark = document.body.classList.toggle("dark-theme");

            localStorage.setItem("taskflowTheme", isDark ? "dark" : "light");

            themeToggle.innerHTML = isDark
                ? '<i class="bi bi-sun"></i>'
                : '<i class="bi bi-moon"></i>';
        });
    }

    try {
        await loadNotifications();
    } catch (error) {
        console.error("Notifications Error:", error);

        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="bi bi-exclamation-circle"></i>
                <h6>Unable to Load Notifications</h6>
                <p class="mb-0">${escapeHTML(error.message)}</p>
            </div>
        `;
    }
});
