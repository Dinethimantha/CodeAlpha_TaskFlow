
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("taskflowToken");
    let currentUser = JSON.parse(localStorage.getItem("taskflowUser") || "null");

    if (!token || !currentUser) {
        window.location.href = "login.html";
        return;
    }

    const profileForm = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");

    const fullNameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");

    const themeToggle = document.getElementById("themeToggle");
    const darkModeSwitch = document.getElementById("darkModeSwitch");

    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const topbarAvatar = document.getElementById("topbarAvatar");

    const profileAvatar = document.getElementById("profileAvatar");
    const profileDisplayName = document.getElementById("profileDisplayName");

    const accountName = document.getElementById("accountName");
    const accountEmail = document.getElementById("accountEmail");

    const notificationCount = document.getElementById("notificationCount");

    function updateUserDisplay(user) {
        const name = user.fullName || "User";
        const initial = name.charAt(0).toUpperCase();

        if (sidebarUserName) {
            sidebarUserName.textContent = name;
        }

        if (sidebarAvatar) {
            sidebarAvatar.textContent = initial;
        }

        if (topbarAvatar) {
            topbarAvatar.textContent = initial;
        }

        if (profileAvatar) {
            profileAvatar.textContent = initial;
        }

        if (profileDisplayName) {
            profileDisplayName.textContent = name;
        }

        if (accountName) {
            accountName.textContent = name;
        }

        if (accountEmail) {
            accountEmail.textContent = user.email || "";
        }

        if (fullNameInput) {
            fullNameInput.value = name;
        }

        if (phoneInput) {
            phoneInput.value = user.phoneNumber || "";
        }

        if (emailInput) {
            emailInput.value = user.email || "";
        }
    }

    async function loadProfile() {
        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load profile");
            }

            currentUser = {
                ...currentUser,
                ...data.user,
                id: data.user._id || data.user.id || currentUser.id
            };

            localStorage.setItem("taskflowUser", JSON.stringify(currentUser));

            updateUserDisplay(currentUser);

        } catch (error) {
            console.error("Profile Loading Error:", error);
        }
    }

    profileForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = fullNameInput.value.trim();
        const phoneNumber = phoneInput.value.trim();

        if (!fullName) {
            alert("Please enter your full name.");
            return;
        }

        const saveButton = profileForm.querySelector("button[type='submit']");

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const response = await fetch(`${API_URL}/auth/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName,
                    username: currentUser.username,
                    phoneNumber
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Profile update failed");
            }

            currentUser = {
                ...currentUser,
                ...data.user,
                id: data.user.id || data.user._id || currentUser.id
            };

            localStorage.setItem("taskflowUser", JSON.stringify(currentUser));

            updateUserDisplay(currentUser);

            alert("Profile updated successfully!");

        } catch (error) {
            console.error("Profile Update Error:", error);
            alert(error.message || "Unable to update profile.");

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });

    passwordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword.length < 6) {
            alert("New password must contain at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            alert("New password must be different from the current password.");
            return;
        }

        const updateButton = passwordForm.querySelector("button[type='submit']");

        updateButton.disabled = true;
        updateButton.textContent = "Updating...";

        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Password update failed");
            }

            passwordForm.reset();

            alert("Password changed successfully!");

        } catch (error) {
            console.error("Password Update Error:", error);
            alert(error.message || "Unable to change password.");

        } finally {
            updateButton.disabled = false;
            updateButton.textContent = "Update Password";
        }
    });

    function applyTheme(theme) {
        document.body.classList.toggle("dark-theme", theme === "dark");

        if (darkModeSwitch) {
            darkModeSwitch.checked = theme === "dark";
        }

        if (themeToggle) {
            themeToggle.innerHTML = theme === "dark"
                ? '<i class="bi bi-sun"></i>'
                : '<i class="bi bi-moon"></i>';
        }

        localStorage.setItem("taskflowTheme", theme);
    }

    const savedTheme = localStorage.getItem("taskflowTheme") || "light";

    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const newTheme = document.body.classList.contains("dark-theme")
                ? "light"
                : "dark";

            applyTheme(newTheme);
        });
    }

    if (darkModeSwitch) {
        darkModeSwitch.addEventListener("change", function () {
            applyTheme(this.checked ? "dark" : "light");
        });
    }

    const sectionButtons = document.querySelectorAll(".settings-nav button");
    const settingsSections = document.querySelectorAll(".settings-section");

    sectionButtons.forEach(button => {
        button.addEventListener("click", function () {
            const targetSection = this.dataset.section;

            sectionButtons.forEach(item => {
                item.classList.remove("active");
            });

            settingsSections.forEach(section => {
                section.classList.remove("active");
            });

            this.classList.add("active");

            const selectedSection = document.getElementById(targetSection);

            if (selectedSection) {
                selectedSection.classList.add("active");
            }
        });
    });

    async function loadNotificationCount() {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return;
            }

            const notifications = data.notifications || [];

            const unreadCount = notifications.filter(
                notification => !notification.isRead
            ).length;

            if (notificationCount) {
                notificationCount.textContent = unreadCount;
                notificationCount.style.display = unreadCount > 0
                    ? "inline-flex"
                    : "none";
            }

        } catch (error) {
            console.error("Notification Count Error:", error);
        }
    }

    function logout() {
        localStorage.removeItem("taskflowToken");
        localStorage.removeItem("taskflowUser");

        window.location.href = "login.html";
    }

    const logoutButton = document.getElementById("logoutButton");
    const accountLogoutButton = document.getElementById("accountLogoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    if (accountLogoutButton) {
        accountLogoutButton.addEventListener("click", logout);
    }

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", function () {
            sidebar.classList.toggle("active");
        });
    }

    await loadProfile();
    await loadNotificationCount();
});
