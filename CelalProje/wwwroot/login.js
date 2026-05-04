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

    const payload = JSON.stringify({
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
    });

    try {
        const response = await request({
            url: "/api/auth/login",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        setAuthUser(response.data);
        window.location.href = response.data.redirectUrl;
    } catch {
        errorElement.textContent = "Kullanıcı adı veya şifre hatalı.";
    }
}
