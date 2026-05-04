document.addEventListener("DOMContentLoaded", () => {
    const user = requireRole("Student");
    if (!user) {
        return;
    }

    document.getElementById("studentWelcome").textContent = `Hos geldin, ${user.fullName}`;
    document.getElementById("logoutButton").addEventListener("click", logout);
});
