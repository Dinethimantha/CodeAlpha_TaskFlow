
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const welcomeUserName = document.getElementById("welcomeUserName");
    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const topbarAvatar = document.getElementById("topbarAvatar");

    const displayName = user.fullName || user.username || "User";
    const initial = displayName.charAt(0).toUpperCase();

    welcomeUserName.textContent = displayName;
    sidebarUserName.textContent = displayName;
    sidebarAvatar.textContent = initial;
    topbarAvatar.textContent = initial;

    async function fetchData(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "GET",
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load data.");
        }

        return data;
    }

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

    function getArray(data, keys) {
        if (Array.isArray(data)) {
            return data;
        }

        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        return [];
    }

    async function loadDashboard() {
        try {
            const [projectData, notificationData] = await Promise.all([
                fetchData("/projects"),
                fetchData("/notifications")
            ]);

            const projects = getArray(projectData, ["projects", "data"]);
            const notifications = getArray(notificationData, ["notifications", "data"]);

            const taskResults = await Promise.all(
                projects.map(project =>
                    fetchData(`/tasks?project=${encodeURIComponent(project._id)}`)
                )
            );

            const tasks = taskResults.flatMap(data =>
                getArray(data, ["tasks", "data"])
            );

            tasks.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            document.getElementById("totalProjects").textContent = projects.length;
            document.getElementById("totalTasks").textContent = tasks.length;

            document.getElementById("inProgressTasks").textContent =
                tasks.filter(task => task.status === "in-progress").length;

            document.getElementById("completedTasks").textContent =
                tasks.filter(task => task.status === "completed").length;

            document.getElementById("notificationCount").textContent =
                notifications.filter(notification => !notification.isRead).length;

            renderProjects(projects);
            renderTasks(tasks);

        } catch (error) {
            console.error("Dashboard loading error:", error);
        }
    }

    function renderProjects(projects) {
        const container = document.getElementById("projectsContainer");

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-folder2-open"></i>
                    <h6>No projects yet</h6>
                    <p>Create your first project to get started.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.slice(0, 5).map(project => `
            <div class="project-item">
                <div class="project-color" style="background:${escapeHTML(project.color || "#6366f1")}"></div>
                <div class="project-details">
                    <h6>${escapeHTML(project.name)}</h6>
                    <p>${escapeHTML(project.description || "No description")}</p>
                </div>
                <span class="project-status">${escapeHTML(project.status || "active")}</span>
            </div>
        `).join("");
    }

    function renderTasks(tasks) {
        const container = document.getElementById("recentTasksContainer");

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-check2-square"></i>
                    <h6>No tasks available</h6>
                    <p>Your recent tasks will appear here.</p>
                </div>
            `;
            return;
        }

        const recentTasks = tasks.slice(0, 5);

        container.innerHTML = recentTasks.map(task => `
            <div class="recent-task">
                <div class="task-details">
                    <h6>${escapeHTML(task.title)}</h6>
                    <p>${escapeHTML(task.project?.name || "Task")}</p>
                </div>
                <span class="task-status status-${escapeHTML(task.status || "todo")}">
                    ${escapeHTML((task.status || "todo").replace("-", " "))}
                </span>
            </div>
        `).join("");
    }

    const createProjectButton = document.getElementById("createProjectButton");
    const createProjectForm = document.getElementById("createProjectForm");
    const saveProjectButton = document.getElementById("saveProjectButton");

    const projectModal = new bootstrap.Modal(
        document.getElementById("createProjectModal")
    );

    createProjectButton.addEventListener("click", function () {
        createProjectForm.reset();
        document.getElementById("projectColor").value = "#6366f1";
        projectModal.show();
    });

    createProjectForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const projectData = {
            name: document.getElementById("projectName").value.trim(),
            description: document.getElementById("projectDescription").value.trim(),
            color: document.getElementById("projectColor").value,
            dueDate: document.getElementById("projectDueDate").value || null
        };

        if (!projectData.name) {
            alert("Please enter a project name.");
            return;
        }

        saveProjectButton.disabled = true;
        saveProjectButton.textContent = "Creating...";

        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: "POST",
                headers,
                body: JSON.stringify(projectData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create project.");
            }

            alert("Project created successfully!");

            createProjectForm.reset();
            projectModal.hide();

            await loadDashboard();

        } catch (error) {
            console.error("Create Project Error:", error);
            alert(error.message);

        } finally {
            saveProjectButton.disabled = false;
            saveProjectButton.textContent = "Create Project";
        }
    });

    document.getElementById("logoutButton").addEventListener("click", function () {
        localStorage.removeItem("taskflowToken");
        localStorage.removeItem("taskflowUser");
        window.location.href = "login.html";
    });

    document.getElementById("menuToggle").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("show");
    });

    loadDashboard();
});
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