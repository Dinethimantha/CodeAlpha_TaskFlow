
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const currentUserId = user.id || user._id;

    const tasksContainer = document.getElementById("tasksContainer");
    const taskSearch = document.getElementById("taskSearch");
    const taskStatusFilter = document.getElementById("taskStatusFilter");
    const taskPriorityFilter = document.getElementById("taskPriorityFilter");
    const taskCount = document.getElementById("taskCount");

    const displayName = user.fullName || user.username || "User";
    const initial = displayName.charAt(0).toUpperCase();

    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const topbarAvatar = document.getElementById("topbarAvatar");

    if (sidebarUserName) sidebarUserName.textContent = displayName;
    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (topbarAvatar) topbarAvatar.textContent = initial;

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    let allTasks = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }

    function formatDate(date) {
        if (!date) return "Not set";

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) return "Not set";

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getArray(data, keys) {
        if (Array.isArray(data)) return data;

        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        return [];
    }

    async function fetchData(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "GET",
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load tasks.");
        }

        return data;
    }

    function renderTasks(tasks) {
        taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"} found`;

        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="tasks-empty">
                    <i class="bi bi-clipboard-check"></i>
                    <h5>No Tasks Found</h5>
                    <p>No tasks match your search or filter.</p>
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = tasks.map(task => {
            const priority = ["low", "medium", "high", "urgent"].includes(task.priority)
                ? task.priority
                : "medium";

            const status = ["todo", "in-progress", "in-review", "completed"].includes(task.status)
                ? task.status
                : "todo";

            const projectName = task.projectName ||
                (typeof task.project === "object"
                    ? task.project?.name || "Project"
                    : "Project");

            const dueDate = formatDate(task.dueDate);

            return `
                <div class="my-task-item">
                    <div class="my-task-main">
                        <div class="my-task-icon">
                            <i class="bi bi-check2-square"></i>
                        </div>

                        <div class="my-task-info">
                            <h6>${escapeHTML(task.title)}</h6>
                            <p>
                                <i class="bi bi-folder2"></i>
                                ${escapeHTML(projectName)}
                                <span class="mx-1">•</span>
                                ${escapeHTML(status.replace("-", " "))}
                            </p>
                        </div>
                    </div>

                    <div class="my-task-meta">
                        <span class="task-priority priority-${priority}">
                            ${escapeHTML(priority)}
                        </span>

                        <span class="task-due-date">
                            <i class="bi bi-calendar3"></i>
                            ${escapeHTML(dueDate)}
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    }

    function filterTasks() {
        const searchValue = taskSearch.value.trim().toLowerCase();
        const selectedStatus = taskStatusFilter.value;
        const selectedPriority = taskPriorityFilter.value;

        const filteredTasks = allTasks.filter(task => {
            const title = (task.title || "").toLowerCase();
            const description = (task.description || "").toLowerCase();

            const matchesSearch =
                title.includes(searchValue) ||
                description.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                task.status === selectedStatus;

            const matchesPriority =
                selectedPriority === "all" ||
                task.priority === selectedPriority;

            return matchesSearch && matchesStatus && matchesPriority;
        });

        renderTasks(filteredTasks);
    }

    async function loadTasks() {
        try {
            if (!currentUserId) {
                throw new Error("User ID not found. Please login again.");
            }

            tasksContainer.innerHTML = `
                <div class="tasks-empty">
                    <p>Loading your tasks...</p>
                </div>
            `;

            const projectData = await fetchData("/projects");
            const projects = getArray(projectData, ["projects", "data"]);

            const taskResults = await Promise.all(
                projects.map(async project => {
                    const data = await fetchData(
                        `/tasks?project=${encodeURIComponent(project._id)}`
                    );

                    return getArray(data, ["tasks", "data"]).map(task => ({
                        ...task,
                        projectName: project.name
                    }));
                })
            );

            const tasks = taskResults.flat();

            allTasks = tasks.filter(task => {
                const assignedUser = task.assignedTo;

                const assignedUserId = typeof assignedUser === "object"
                    ? assignedUser?._id || assignedUser?.id
                    : assignedUser;

                return String(assignedUserId || "") === String(currentUserId);
            });

            allTasks.sort((a, b) => {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            filterTasks();

        } catch (error) {
            console.error("My Tasks Loading Error:", error);

            taskCount.textContent = "Unable to load";

            tasksContainer.innerHTML = `
                <div class="tasks-empty">
                    <i class="bi bi-exclamation-circle text-danger"></i>
                    <h5>Unable to Load Tasks</h5>
                    <p>${escapeHTML(error.message)}</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    taskSearch.addEventListener("input", filterTasks);
    taskStatusFilter.addEventListener("change", filterTasks);
    taskPriorityFilter.addEventListener("change", filterTasks);

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
            sidebar.classList.toggle("show");
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

    loadTasks();
});
