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

function request(options) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || "GET", options.url, true);

        if (options.headers) {
            Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key]);
            });
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) {
                return;
            }

            const responseText = xhr.responseText || "";
            let data = null;

            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch {
                data = responseText;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ status: xhr.status, data });
            } else {
                reject({ status: xhr.status, data });
            }
        };

        xhr.onerror = () => reject({ status: 0, data: null });
        xhr.send(options.body || null);
    });
}
