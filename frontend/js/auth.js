
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const button = document.getElementById("registerButton");

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        button.disabled = true;
        button.textContent = "Creating Account...";

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullName,
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed!");
            }

            if (data.token) {
                localStorage.setItem("taskflowToken", data.token);
            }

            if (data.user) {
                localStorage.setItem("taskflowUser", JSON.stringify(data.user));
            }

            alert(data.message || "Registration successful!");

            if (data.token) {
                window.location.href = "index.html";
            } else {
                window.location.href = "login.html";
            }

        } catch (error) {
            alert(error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Create Account";
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const button = document.getElementById("loginButton");

        button.disabled = true;
        button.textContent = "Signing In...";

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed!");
            }

            if (!data.token) {
                throw new Error("Authentication token was not received.");
            }

            localStorage.setItem("taskflowToken", data.token);
            localStorage.setItem("taskflowUser", JSON.stringify(data.user));

            alert(data.message || "Login successful!");

            window.location.href = "index.html";

        } catch (error) {
            alert(error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Sign In";
        }
    });
}
