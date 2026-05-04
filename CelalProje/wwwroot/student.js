const studentState = {
    user: null,
    data: null,
    currentPage: "overview"
};

const studentPageConfig = {
    overview: { eyebrow: "Portal", title: "Genel Bakış" },
    details: { eyebrow: "Portal", title: "Teknik Detaylar" }
};

document.addEventListener("DOMContentLoaded", async () => {
    const user = requireRole("Student");
    if (!user) {
        return;
    }

    studentState.user = user;
    document.getElementById("studentWelcome").textContent = user.fullName;
    document.getElementById("logoutButton").addEventListener("click", logout);
    document.getElementById("studentSidebarNav").addEventListener("click", handleStudentNavigation);

    const response = await request({ url: `/api/students/portal/${encodeURIComponent(user.username)}` });
    studentState.data = response.data;
    loadStudentPage("overview");
});

function handleStudentNavigation(event) {
    const button = event.target.closest("[data-page]");
    if (!button) {
        return;
    }

    loadStudentPage(button.dataset.page);
}

function loadStudentPage(page) {
    studentState.currentPage = page;
    document.getElementById("studentPageEyebrow").textContent = studentPageConfig[page].eyebrow;
    document.getElementById("studentPageTitle").textContent = studentPageConfig[page].title;

    document.querySelectorAll("#studentSidebarNav [data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const content = document.getElementById("studentPageContent");
    content.innerHTML = page === "overview" ? renderStudentOverview() : renderStudentDetails();
}

function renderStudentOverview() {
    const computers = studentState.data.computers;
    const activeCount = computers.filter(computer => computer.status === 1).length;
    const hdmiCount = computers.filter(computer => computer.hasHdmi).length;
    const veyonCount = computers.filter(computer => computer.hasVeyon).length;

    return `
        <section class="lrp-stats-grid">
            ${[
                ["Öğrenci No", studentState.data.studentNumber],
                ["Zimmetli Bilgisayar", computers.length],
                ["Aktif Bilgisayar", activeCount],
                ["HDMI", hdmiCount],
                ["Veyon", veyonCount]
            ].map(([label, value]) => `
                <article class="lrp-stat-card">
                    <div class="lrp-stat-label">${label}</div>
                    <div class="lrp-stat-value">${value}</div>
                </article>
            `).join("")}
        </section>
        <section class="lrp-grid-2">
            ${computers.length > 0 ? computers.map(computer => `
                <article class="lrp-card">
                    <h3 class="lrp-card-title">${computer.assetCode}</h3>
                    <div class="lrp-muted">${computer.name}</div>
                    <div class="lrp-grid-2" style="margin-top: 14px;">
                        <div><div class="lrp-muted">Laboratuvar</div><strong>${computer.labName}</strong></div>
                        <div><div class="lrp-muted">Konum</div><strong>${computer.labLocation}</strong></div>
                        <div><div class="lrp-muted">Marka</div><strong>${computer.brand}</strong></div>
                        <div><div class="lrp-muted">RAM</div><strong>${computer.ramGb} GB</strong></div>
                    </div>
                    <div style="margin-top: 14px;">${renderStudentStatus(computer.status)}</div>
                </article>
            `).join("") : `<div class="lrp-empty">Bu hesaba bağlı bir bilgisayar ataması yok.</div>`}
        </section>
    `;
}

function renderStudentDetails() {
    const computers = studentState.data.computers;

    if (computers.length === 0) {
        return `<section class="lrp-empty">Bu hesaba bağlı bir bilgisayar ataması yok.</section>`;
    }

    return `
        <section class="lrp-table-card">
            <div class="lrp-table-wrap">
                <table class="lrp-table">
                    <thead>
                        <tr>
                            <th>Demirbaş Kodu</th>
                            <th>Ad</th>
                            <th>Marka</th>
                            <th>İşlemci</th>
                            <th>RAM</th>
                            <th>Seri No</th>
                            <th>HDMI</th>
                            <th>Veyon</th>
                            <th>Durum</th>
                            <th>Laboratuvar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${computers.map(computer => `
                            <tr>
                                <td>${computer.assetCode}</td>
                                <td>${computer.name}</td>
                                <td>${computer.brand}</td>
                                <td>${computer.processor}</td>
                                <td>${computer.ramGb} GB</td>
                                <td>${computer.serialNumber}</td>
                                <td>${computer.hasHdmi ? "Var" : "Yok"}</td>
                                <td>${computer.hasVeyon ? "Var" : "Yok"}</td>
                                <td>${renderStudentStatus(computer.status)}</td>
                                <td>${computer.labName}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function renderStudentStatus(status) {
    const map = {
        1: ["Aktif", "active"],
        2: ["Bakımda", "maintenance"],
        3: ["Pasif", "passive"]
    };

    const [label, className] = map[status] ?? ["Bilinmiyor", "passive"];
    return `<span class="lrp-status ${className}">${label}</span>`;
}
