async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loginUser(event) {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const hashedPassword = await hashPassword(password); // 🔹 Hash before sending

    try {
        let response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: hashedPassword }) // 🔹 Send hashed password
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
    const hashedPassword = await hashPassword(password); // 🔹 Hash before sending

    try {
        let response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: hashedPassword }) // 🔹 Send hashed password
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
        const url = '/api/logout?_=' + Date.now();
        let response = await fetch(url, { credentials: 'include' });
        await response.json();
        // Set a flag indicating that logout just occurred
        localStorage.setItem("loggedOut", "true");
        // Delay the redirect to allow session to clear
            window.location.href = "login.html";
    } catch (error) {
        console.error("Failed to logout:", error);
    }
}
