export async function checkAndRedirect() {
    try {
        let response = await fetch('/api/me');
        let data = await response.json();
        let currentPage = window.location.pathname;

        console.log("Session Check Response:", data); // ✅ Debugging Step

        if (data.userId) {
            // ✅ If logged in, do not allow them to visit login or register pages
            if (currentPage.endsWith("login.html") || currentPage.endsWith("register.html")) {
                window.location.href = "chat.html";
                return;
            }
            // ✅ Set the welcome message on chat.html
            const welcomeElement = document.getElementById("welcome");
            if (welcomeElement) {
                welcomeElement.textContent = "Welcome, " + data.username;
            }
        } else {
            // ❌ If not logged in, do NOT allow them to visit chat.html
            if (currentPage.endsWith("chat.html")) {
                window.location.href = "login.html";
            }
        }
    } catch (error) {
        console.error("Error checking session:", error);
        if (window.location.pathname.endsWith("chat.html")) {
            window.location.href = "login.html"; // Fail-safe redirect
        }
    }
}
