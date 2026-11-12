
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const container = document.getElementById("projectsContainer");
    const searchInput = document.getElementById("projectSearch");
    const statusFilter = document.getElementById("projectStatusFilter");

    const displayName = user.fullName || user.username || "User";
    const initial = displayName.charAt(0).toUpperCase();

    document.getElementById("sidebarUserName").textContent = displayName;
    document.getElementById("sidebarAvatar").textContent = initial;
    document.getElementById("topbarAvatar").textContent = initial;

    let allProjects = [];

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

        if (isNaN(parsedDate.getTime())) {
            return "Not set";
        }

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function renderProjects(projects) {
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="project-empty">
                        <i class="bi bi-search"></i>
                        <h5>No Projects Found</h5>
                        <p class="mb-0">Try another search term or change the status filter.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(project => {
            const color = /^#[0-9a-fA-F]{6}$/.test(project.color || "")
                ? project.color
                : "#6366f1";

            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="project-card"
                         onclick="window.location.href='project-details.html?id=${encodeURIComponent(project._id)}'"
                         style="cursor: pointer;">

                        <div class="project-card-color"
                             style="background:${color}"></div>

                        <h5>${escapeHTML(project.name)}</h5>

                        <p>${escapeHTML(project.description || "No description available.")}</p>

                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-primary-subtle text-primary">
                                ${escapeHTML(project.status || "active")}
                            </span>

                            <span class="text-primary small">
                                View Details <i class="bi bi-arrow-right"></i>
                            </span>
                        </div>

                        <div class="project-meta">
                            <div class="d-flex justify-content-between">
                                <span>
                                    <i class="bi bi-calendar3"></i> Due Date
                                </span>

                                <span>${formatDate(project.dueDate)}</span>
                            </div>
                        </div>

                    </div>
                </div>
            `;
        }).join("");
    }

    function filterProjects() {
        const searchValue = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredProjects = allProjects.filter(project => {
            const projectName = (project.name || "").toLowerCase();

            const matchesSearch = projectName.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                project.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderProjects(filteredProjects);
    }

    async function loadProjects() {
        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load projects.");
            }

            allProjects = Array.isArray(data)
                ? data
                : data.projects || data.data || [];

            filterProjects();

        } catch (error) {
            console.error("Projects Loading Error:", error);

            container.innerHTML = `
                <div class="col-12">
                    <div class="project-empty">
                        <i class="bi bi-exclamation-circle text-danger"></i>
                        <h5>Unable to Load Projects</h5>
                        <p>${escapeHTML(error.message)}</p>
                        <button class="btn btn-outline-primary" onclick="location.reload()">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }
    }

    searchInput.addEventListener("input", filterProjects);
    statusFilter.addEventListener("change", filterProjects);

    document.getElementById("logoutButton").addEventListener("click", function () {
        localStorage.removeItem("taskflowToken");
        localStorage.removeItem("taskflowUser");
        window.location.href = "login.html";
    });

    document.getElementById("menuToggle").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("show");
    });

    loadProjects();
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