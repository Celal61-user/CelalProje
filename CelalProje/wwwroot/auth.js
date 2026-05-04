function getAuthUser() {
    const raw = localStorage.getItem("lrpUser");
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem("lrpUser");
        return null;
    }
}

function setAuthUser(user) {
    localStorage.setItem("lrpUser", JSON.stringify(user));
}

function clearAuthUser() {
    localStorage.removeItem("lrpUser");
}

function redirectByRole(user) {
    if (!user) {
        window.location.href = "/login.html";
        return;
    }

    window.location.href = user.role === "Admin" ? "/index.html" : "/student.html";
}

function requireRole(role) {
    const user = getAuthUser();

    if (!user) {
        window.location.href = "/login.html";
        return null;
    }

    if (user.role !== role) {
        redirectByRole(user);
        return null;
    }

    return user;
}

function logout() {
    clearAuthUser();
    window.location.href = "/login.html";
}
