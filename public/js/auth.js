export async function loginUser(event) {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        let response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        let data = await response.json();
        if (data.error) {
            document.getElementById("error").textContent = data.error;
        } else {
            window.location.href = "chat.html"; // Redirect on success
        }
    } catch (error) {
        console.error("Login request failed:", error);
    }
}

export async function registerUser(event) {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        let response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        let data = await response.json();
        if (data.error) {
            document.getElementById("error").textContent = data.error;
        } else {
            window.location.href = "login.html"; // Redirect on success
        }
    } catch (error) {
        console.error("Registration request failed:", error);
    }
}

export async function logoutUser() {
    try {
        let response = await fetch('/api/logout');
        await response.json();
        window.location.href = "login.html"; // Redirect to login
    } catch (error) {
        console.error("Failed to logout:", error);
    }
}
