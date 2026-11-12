
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const currentUserId = user.id || user._id;

    const projectFilter = document.getElementById("projectFilter");

    const columns = {
        "todo": {
            container: document.getElementById("todoTasks"),
            count: document.getElementById("todoCount")
        },
        "in-progress": {
            container: document.getElementById("inProgressTasks"),
            count: document.getElementById("inProgressCount")
        },
        "in-review": {
            container: document.getElementById("inReviewTasks"),
            count: document.getElementById("inReviewCount")
        },
        "completed": {
            container: document.getElementById("completedTasks"),
            count: document.getElementById("completedCount")
        }
    };

    let projects = [];
    let allTasks = [];
    let draggedTaskId = null;

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
        if (!date) return "No due date";

        const formattedDate = new Date(date);

        if (isNaN(formattedDate.getTime())) return "No due date";

        return formattedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function getProjectName(projectId) {
        const project = projects.find(
            item => item._id === projectId
        );

        return project ? project.name : "Unknown Project";
    }

    function renderTasks() {
        const selectedProject = projectFilter.value;

        const filteredTasks = selectedProject === "all"
            ? allTasks
            : allTasks.filter(task => {
                const projectId = task.project?._id || task.project;
                return projectId === selectedProject;
            });

        Object.keys(columns).forEach(status => {
            const column = columns[status];

            column.container.innerHTML = "";

            const statusTasks = filteredTasks.filter(
                task => task.status === status
            );

            column.count.textContent = statusTasks.length;

            if (statusTasks.length === 0) {
                column.container.innerHTML = `
                    <div class="kanban-empty">
                        <i class="bi bi-clipboard"></i>
                        No tasks here
                    </div>
                `;
                return;
            }

            statusTasks.forEach(task => {
                const assignedName = task.assignedTo?.fullName || "Unassigned";
                const projectId = task.project?._id || task.project;

                const card = document.createElement("div");
                card.className = "kanban-card";
                card.draggable = true;
                card.dataset.taskId = task._id;

                const priority = ["low", "medium", "high", "urgent"].includes(
                    task.priority
                ) ? task.priority : "medium";

                card.innerHTML = `
                    <h6>${escapeHTML(task.title)}</h6>

                    <p>${escapeHTML(task.description || "No description")}</p>

                    <p class="mb-0">
                        <i class="bi bi-folder2 me-1"></i>
                        ${escapeHTML(getProjectName(projectId))}
                    </p>

                    <div class="kanban-card-footer">
                        <span class="kanban-priority priority-${priority}">
                            ${escapeHTML(priority)}
                        </span>

                        <span class="text-secondary" style="font-size:10px;">
                            <i class="bi bi-calendar3 me-1"></i>
                            ${escapeHTML(formatDate(task.dueDate))}
                        </span>
                    </div>

                    <div class="mt-2 text-secondary" style="font-size:11px;">
                        <i class="bi bi-person me-1"></i>
                        ${escapeHTML(assignedName)}
                    </div>
                `;

                card.addEventListener("dragstart", function (event) {
                    draggedTaskId = task._id;
                    event.dataTransfer.setData("text/plain", task._id);
                    event.dataTransfer.effectAllowed = "move";
                });

                card.addEventListener("dragend", function () {
                    draggedTaskId = null;

                    document.querySelectorAll(".kanban-tasks").forEach(column => {
                        column.classList.remove("drag-over");
                    });
                });

                column.container.appendChild(card);
            });
        });
    }

    async function loadProjects() {
        const response = await fetch(`${API_URL}/projects`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load projects");
        }

        projects = data.projects || [];

        projectFilter.innerHTML = '<option value="all">All Projects</option>';

        projects.forEach(project => {
            const option = document.createElement("option");
            option.value = project._id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }

    async function loadTasks() {
        allTasks = [];

        for (const project of projects) {
            const response = await fetch(
                `${API_URL}/tasks?project=${project._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load tasks");
            }

            allTasks.push(...(data.tasks || []));
        }

        renderTasks();
    }

    async function updateTaskStatus(taskId, newStatus) {
        const task = allTasks.find(item => item._id === taskId);

        if (!task || task.status === newStatus) return;

        const oldStatus = task.status;

        task.status = newStatus;
        renderTasks();

        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update task");
            }

            const updatedTask = data.task || data.updatedTask;

            if (updatedTask) {
                const index = allTasks.findIndex(item => item._id === taskId);

                if (index !== -1) {
                    allTasks[index] = updatedTask;
                }
            }

            renderTasks();
        } catch (error) {
            task.status = oldStatus;
            renderTasks();
            alert(error.message);
        }
    }

    Object.keys(columns).forEach(status => {
        const container = columns[status].container;

        container.addEventListener("dragover", function (event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            container.classList.add("drag-over");
        });

        container.addEventListener("dragleave", function (event) {
            if (!container.contains(event.relatedTarget)) {
                container.classList.remove("drag-over");
            }
        });

        container.addEventListener("drop", function (event) {
            event.preventDefault();
            container.classList.remove("drag-over");

            const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;

            if (taskId) {
                updateTaskStatus(taskId, status);
            }
        });
    });

    projectFilter.addEventListener("change", renderTasks);

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
        await loadProjects();
        await loadTasks();
    } catch (error) {
        console.error("Kanban Board Error:", error);

        Object.values(columns).forEach(column => {
            column.container.innerHTML = `
                <div class="kanban-empty">
                    <i class="bi bi-exclamation-circle"></i>
                    Unable to load tasks
                </div>
            `;
        });

        alert(error.message);
    }
});
