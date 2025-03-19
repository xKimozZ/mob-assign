export async function checkAndRedirect() {
    try {
        let response = await fetch('/api/me');
        let data = await response.json();
        let currentPage = window.location.pathname;

        if (data.userId) {
            // ✅ If user is logged in, do not allow them to visit login or register pages
            if (currentPage.endsWith("login.html") || currentPage.endsWith("register.html")) {
                window.location.href = "chat.html"; // Redirect logged-in users
            }
        } else {
            // ❌ If user is NOT logged in, do NOT allow them to visit chat.html
            if (currentPage.endsWith("chat.html")) {
                window.location.href = "login.html"; // Redirect guests
            }
        }
    } catch (error) {
        console.error("Error checking session:", error);
        if (window.location.pathname.endsWith("chat.html")) {
            window.location.href = "login.html"; // Fail-safe redirect
        }
    }
}
