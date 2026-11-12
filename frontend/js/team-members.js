
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("taskflowToken");
    const user = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const membersContainer = document.getElementById("membersContainer");
    const totalMembers = document.getElementById("totalMembers");
    const memberSearch = document.getElementById("memberSearch");
    const projectFilter = document.getElementById("projectFilter");
    const memberDetailsContent = document.getElementById("memberDetailsContent");

    let allMembers = [];

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    async function loadProfile() {
        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                headers
            });

            const data = await response.json();

            if (!response.ok) return;

            const currentUser = data.user || data;
            const fullName = currentUser.fullName || "User";
            const initial = fullName.charAt(0).toUpperCase();

            document.getElementById("sidebarUserName").textContent = fullName;
            document.getElementById("sidebarAvatar").textContent = initial;
            document.getElementById("topbarAvatar").textContent = initial;

        } catch (error) {
            console.error("Profile loading error:", error);
        }
    }

    async function loadProjects() {
        try {
            const response = await fetch(`${API_URL}/projects`, {
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load projects");
            }

            const projects = data.projects || [];

            projectFilter.innerHTML = '<option value="all">All Projects</option>';

            projects.forEach(project => {
                const option = document.createElement("option");
                option.value = project._id;
                option.textContent = project.name;
                projectFilter.appendChild(option);
            });

            return projects;

        } catch (error) {
            console.error("Projects loading error:", error);
            membersContainer.innerHTML =
                '<p class="text-danger">Unable to load projects.</p>';
            return [];
        }
    }

    async function loadTeamMembers() {
        membersContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-3 text-muted">Loading team members...</p>
            </div>
        `;

        const projects = await loadProjects();
        const memberMap = new Map();

        try {
            for (const project of projects) {
                const response = await fetch(
                    `${API_URL}/projects/${project._id}`,
                    { headers }
                );

                const data = await response.json();

                if (!response.ok) continue;

                const projectData = data.project || project;
                const members = projectData.members || [];
                const projectOwner = projectData.owner;

                if (projectOwner && projectOwner._id) {
                    addMember(projectOwner, projectData, memberMap, "Owner");
                }

                members.forEach(member => {
                    if (member && member._id) {
                        addMember(member, projectData, memberMap, "Member");
                    }
                });
            }

            allMembers = Array.from(memberMap.values());

            renderMembers();

        } catch (error) {
            console.error("Team members loading error:", error);
            membersContainer.innerHTML =
                '<p class="text-danger">Unable to load team members.</p>';
        }
    }

    function addMember(member, project, memberMap, role) {
        const memberId = member._id.toString();

        if (!memberMap.has(memberId)) {
            memberMap.set(memberId, {
                _id: memberId,
                fullName: member.fullName || "Unknown User",
                username: member.username || "",
                email: member.email || "",
                role: role,
                projects: []
            });
        }

        const existingMember = memberMap.get(memberId);

        if (role === "Owner") {
            existingMember.role = "Owner";
        }

        if (!existingMember.projects.some(item => item._id === project._id)) {
            existingMember.projects.push({
                _id: project._id,
                name: project.name
            });
        }
    }

    function renderMembers() {
        const searchValue = memberSearch.value.toLowerCase();
        const selectedProject = projectFilter.value;

        const filteredMembers = allMembers.filter(member => {
            const matchesSearch =
                member.fullName.toLowerCase().includes(searchValue) ||
                member.username.toLowerCase().includes(searchValue) ||
                member.email.toLowerCase().includes(searchValue);

            const matchesProject =
                selectedProject === "all" ||
                member.projects.some(project => project._id === selectedProject);

            return matchesSearch && matchesProject;
        });

        totalMembers.textContent = `${filteredMembers.length} Members`;

        if (filteredMembers.length === 0) {
            membersContainer.innerHTML = `
                <div class="text-center p-5">
                    <i class="bi bi-people fs-1 text-muted"></i>
                    <h6 class="mt-3">No team members found</h6>
                    <p class="text-muted">Try changing your search or project filter.</p>
                </div>
            `;
            return;
        }

        membersContainer.innerHTML = filteredMembers.map(member => {
            const initial = member.fullName.charAt(0).toUpperCase();

            const projectNames = member.projects
                .map(project => project.name)
                .join(", ");

            return `
                <div class="member-card"
                    onclick="showMemberDetails('${member._id}')"
                    style="cursor: pointer;">

                    <div class="member-avatar">${escapeHTML(initial)}</div>

                    <h6>${escapeHTML(member.fullName)}</h6>

                    <p>@${escapeHTML(member.username)}</p>

                    <span class="member-role">${escapeHTML(member.role)}</span>

                    <div class="mt-3">
                        <small class="text-muted">
                            <i class="bi bi-envelope me-1"></i>
                            ${escapeHTML(member.email)}
                        </small>
                    </div>

                    <div class="mt-3">
                        <small class="text-muted">
                            <i class="bi bi-folder me-1"></i>
                            ${escapeHTML(projectNames)}
                        </small>
                    </div>

                    <div class="mt-3">
                        <small class="text-primary">
                            <i class="bi bi-eye me-1"></i>
                            View Details
                        </small>
                    </div>
                </div>
            `;
        }).join("");
    }

    window.showMemberDetails = function (memberId) {
        const member = allMembers.find(item => item._id === memberId);

        if (!member) return;

        const initial = member.fullName.charAt(0).toUpperCase();

        const projectList = member.projects.length > 0
            ? member.projects.map(project => `
                <div class="d-flex align-items-center gap-2 border rounded p-2 mb-2">
                    <i class="bi bi-folder text-primary"></i>
                    <span>${escapeHTML(project.name)}</span>
                </div>
            `).join("")
            : '<p class="text-muted">No projects assigned.</p>';

        memberDetailsContent.innerHTML = `
            <div class="text-center mb-4">
                <div class="member-avatar">${escapeHTML(initial)}</div>
                <h5 class="mt-3 mb-1">${escapeHTML(member.fullName)}</h5>
                <p class="text-muted mb-2">@${escapeHTML(member.username)}</p>
                <span class="member-role">${escapeHTML(member.role)}</span>
            </div>

            <div class="mb-3">
                <label class="text-muted small">Email Address</label>
                <p class="mb-0">
                    <i class="bi bi-envelope me-2"></i>
                    ${escapeHTML(member.email)}
                </p>
            </div>

            <hr>

            <h6 class="mb-3">
                <i class="bi bi-folder me-2"></i>
                Projects (${member.projects.length})
            </h6>

            ${projectList}
        `;

        const modalElement = document.getElementById("memberDetailsModal");
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    };

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

    async function loadNotificationCount() {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers
            });

            const data = await response.json();

            if (!response.ok) return;

            const notifications = data.notifications || [];

            const unreadCount = notifications.filter(
                notification => !notification.isRead
            ).length;

            const countElement = document.getElementById("notificationCount");

            if (countElement) {
                countElement.textContent = unreadCount;
                countElement.style.display =
                    unreadCount > 0 ? "inline-block" : "none";
            }

        } catch (error) {
            console.error("Notification loading error:", error);
        }
    }

    memberSearch.addEventListener("input", renderMembers);
    projectFilter.addEventListener("change", renderMembers);

    document.getElementById("logoutButton").addEventListener("click", function () {
        localStorage.removeItem("taskflowToken");
        localStorage.removeItem("taskflowUser");
        window.location.href = "login.html";
    });

    document.getElementById("menuToggle").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("active");
    });

    const themeToggle = document.getElementById("themeToggle");

    function applyTheme() {
        const theme = localStorage.getItem("taskflowTheme") || "light";

        document.body.classList.toggle("dark-theme", theme === "dark");

        themeToggle.innerHTML = theme === "dark"
            ? '<i class="bi bi-sun"></i>'
            : '<i class="bi bi-moon"></i>';
    }

    themeToggle.addEventListener("click", function () {
        const currentTheme = localStorage.getItem("taskflowTheme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        localStorage.setItem("taskflowTheme", newTheme);
        applyTheme();
    });

    applyTheme();

    await loadProfile();
    await loadTeamMembers();
    await loadNotificationCount();
});
