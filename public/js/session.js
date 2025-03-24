export async function checkAndRedirect() {
    // Append a unique query parameter to prevent caching
    const url = '/api/me?_=' + Date.now();
    try {
        let response = await fetch(url, { credentials: 'include', cache: 'no-store' });
        let data = await response.json();
        let currentPage = window.location.pathname;
        // console.log("Session Check Response:", data);
        if (data.userId) {
            if (currentPage.endsWith("login.html") || currentPage.endsWith("register.html")) {
                window.location.href = "chat.html";
                return;
            }
            const welcomeElement = document.getElementById("welcome");
            if (welcomeElement) {
                welcomeElement.textContent = "Welcome, " + data.username;
            }
        } else {
            // Prevent infinite redirection loop or being kicked out of registeration
            // console.log("No active session.");
            if (currentPage.endsWith("chat.html")) {
                window.location.href = "login.html";
            }
        }
    } catch (error) {
        // Shouldnt go here unless the server is down or something horrible happens during fetch
        console.error("Error checking session:", error);
        if (window.location.pathname.endsWith("chat.html")) {
            window.location.href = "login.html";
        }
    }
}
