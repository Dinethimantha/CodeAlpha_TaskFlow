
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    console.log("Current Project ID:", projectId);

    const detailsContainer = document.getElementById("projectDetailsContainer");
    const tasksContainer = document.getElementById("projectTasksContainer");
    const membersContainer = document.getElementById("projectMembersContainer");

    const addMemberButton = document.getElementById("addMemberButton");
    const addMemberForm = document.getElementById("addMemberForm");
    const memberUserId = document.getElementById("memberUserId");
    const saveMemberButton = document.getElementById("saveMemberButton");

    const memberModalElement = document.getElementById("addMemberModal");

    const memberModal = memberModalElement
        ? new bootstrap.Modal(memberModalElement)
        : null;

    const displayName = user.fullName || user.username || "User";
    const initial = displayName.charAt(0).toUpperCase();

    document.getElementById("sidebarUserName").textContent = displayName;
    document.getElementById("sidebarAvatar").textContent = initial;
    document.getElementById("topbarAvatar").textContent = initial;

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

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

    function getArray(data, keys) {
        if (Array.isArray(data)) return data;

        for (const key of keys) {
            if (Array.isArray(data[key])) return data[key];
        }

        return [];
    }

    function renderProject(project) {
        const color = /^#[0-9a-fA-F]{6}$/.test(project.color || "")
            ? project.color
            : "#6366f1";

        detailsContainer.innerHTML = `
            <div class="details-card">
                <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
                    <div class="project-icon" style="background:${color}">
                        <i class="bi bi-folder2-open"></i>
                    </div>

                    <div class="flex-grow-1">
                        <h3 class="fw-bold mb-1">${escapeHTML(project.name)}</h3>
                        <span class="badge bg-primary-subtle text-primary">
                            ${escapeHTML(project.status || "active")}
                        </span>
                    </div>
                </div>

                <p class="text-muted mb-4">
                    ${escapeHTML(project.description || "No description available.")}
                </p>

                <div class="row g-4">
                    <div class="col-6 col-md-4">
                        <div class="details-label">Created Date</div>
                        <div class="details-value">${formatDate(project.createdAt)}</div>
                    </div>

                    <div class="col-6 col-md-4">
                        <div class="details-label">Due Date</div>
                        <div class="details-value">${formatDate(project.dueDate)}</div>
                    </div>

                    <div class="col-12 col-md-4">
                        <div class="details-label">Project Owner</div>
                        <div class="details-value">
                            ${escapeHTML(project.owner?.fullName || project.owner?.username || "Project Owner")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderTasks(tasks) {
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="detail-empty">
                    <i class="bi bi-check2-square"></i>
                    <p class="mb-0">No tasks found in this project.</p>
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = tasks.map(task => `
            <div class="recent-task">
                <div class="task-details">
                    <h6>${escapeHTML(task.title)}</h6>
                    <p>
                        Assigned to:
                        ${escapeHTML(task.assignedTo?.fullName || task.assignedTo?.username || "Not assigned")}
                    </p>
                </div>

                <span class="task-status status-${escapeHTML(task.status || "todo")}">
                    ${escapeHTML((task.status || "todo").replace("-", " "))}
                </span>
            </div>
        `).join("");
    }

    function renderMembers(project) {
        const members = Array.isArray(project.members) ? project.members : [];
        const owner = project.owner;
        const allMembers = [...members];

        if (owner && typeof owner === "object") {
            const ownerId = String(owner._id || "");

            if (!allMembers.some(member =>
                String(member._id || member) === ownerId
            )) {
                allMembers.unshift(owner);
            }
        }

        if (allMembers.length === 0) {
            membersContainer.innerHTML = `
                <div class="detail-empty">
                    <i class="bi bi-people"></i>
                    <p class="mb-0">No team members found.</p>
                </div>
            `;
            return;
        }

        membersContainer.innerHTML = allMembers.map(member => {
            const memberId = typeof member === "object"
                ? String(member._id || "")
                : String(member);

            const name = typeof member === "object"
                ? member.fullName || member.username || "Team Member"
                : "Team Member";

            const memberInitial = name.charAt(0).toUpperCase();

            const ownerId = owner && typeof owner === "object"
                ? String(owner._id || "")
                : String(owner || "");

            return `
                <div class="member-item">
                    <div class="member-avatar">${escapeHTML(memberInitial)}</div>

                    <div>
                        <h6 class="mb-1">${escapeHTML(name)}</h6>
                        <small class="text-muted">
                            ${memberId === ownerId ? "Project Owner" : "Team Member"}
                        </small>
                    </div>
                </div>
            `;
        }).join("");
    }

    async function loadProjectDetails() {
        if (!projectId || projectId === "null" || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
            detailsContainer.innerHTML = `
                <div class="details-card text-center">
                    <h5>Project Not Selected</h5>
                    <p class="text-muted">Please select a project from My Projects.</p>
                    <a href="projects.html" class="btn btn-primary">Back to Projects</a>
                </div>
            `;

            tasksContainer.innerHTML = "";
            membersContainer.innerHTML = "";
            return;
        }

        try {
            const [projectData, taskData] = await Promise.all([
                fetchData(`/projects/${encodeURIComponent(projectId)}`),
                fetchData(`/tasks?project=${encodeURIComponent(projectId)}`)
            ]);

            const project = projectData.project || projectData.data || projectData;
            const tasks = getArray(taskData, ["tasks", "data"]);

            renderProject(project);
            renderTasks(tasks);
            renderMembers(project);

        } catch (error) {
            console.error("Project Details Error:", error);

            detailsContainer.innerHTML = `
                <div class="details-card text-center">
                    <i class="bi bi-exclamation-circle text-danger fs-2"></i>
                    <h5 class="mt-3">Unable to Load Project</h5>
                    <p class="text-muted">${escapeHTML(error.message)}</p>
                    <a href="projects.html" class="btn btn-outline-primary">
                        Back to Projects
                    </a>
                </div>
            `;

            tasksContainer.innerHTML = "";
            membersContainer.innerHTML = "";
        }
    }

    if (addMemberButton && addMemberForm && memberModal) {
        addMemberButton.addEventListener("click", function () {
            addMemberForm.reset();
            memberModal.show();
        });

        addMemberForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!projectId || projectId === "null" || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
                alert("Invalid Project ID. Please open the project from My Projects.");
                return;
            }

            const userId = memberUserId.value.trim();

            if (!userId) {
                alert("Please enter a User ID.");
                return;
            }

            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                alert("Please enter a valid User ID.");
                return;
            }

            saveMemberButton.disabled = true;
            saveMemberButton.textContent = "Adding...";

            try {
                console.log("Adding member to project:", projectId);

                const response = await fetch(
                    `${API_URL}/projects/${encodeURIComponent(projectId)}/members`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ userId })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to add member.");
                }

                alert("Team member added successfully!");

                addMemberForm.reset();
                memberModal.hide();

                await loadProjectDetails();

            } catch (error) {
                console.error("Add Member Error:", error);
                alert(error.message);

            } finally {
                saveMemberButton.disabled = false;
                saveMemberButton.textContent = "Add Member";
            }
        });
    }

    document.getElementById("logoutButton").addEventListener("click", function () {
        localStorage.removeItem("taskflowToken");
        localStorage.removeItem("taskflowUser");
        window.location.href = "login.html";
    });

    document.getElementById("menuToggle").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("show");
    });

    loadProjectDetails();
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