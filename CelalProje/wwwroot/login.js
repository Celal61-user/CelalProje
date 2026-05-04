document.addEventListener("DOMContentLoaded", () => {
    const currentUser = getAuthUser();
    if (currentUser) {
        redirectByRole(currentUser);
        return;
    }

    document.getElementById("loginForm").addEventListener("submit", submitLoginForm);
});

async function submitLoginForm(event) {
    event.preventDefault();

    const errorElement = document.getElementById("loginError");
    errorElement.textContent = "";

    const payload = {
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
    };

    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        errorElement.textContent = "Kullanici adi veya sifre hatali.";
        return;
    }

    const user = await response.json();
    setAuthUser(user);
    window.location.href = user.redirectUrl;
}
