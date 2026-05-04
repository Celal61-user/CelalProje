const endpoints = {
    labs: "/api/labs",
    computers: "/api/computers",
    students: "/api/students",
    dashboard: "/api/dashboard/summary"
};

const state = {
    labs: [],
    computers: [],
    students: [],
    summary: null,
    currentPage: "dashboard"
};

const pageConfig = {
    dashboard: { eyebrow: "Yönetim", title: "Gösterge Paneli", actionText: "" },
    labs: { eyebrow: "Yönetim", title: "Laboratuvarlar", actionText: "Yeni Laboratuvar" },
    computers: { eyebrow: "Envanter", title: "Bilgisayarlar", actionText: "Yeni Bilgisayar" },
    students: { eyebrow: "Kullanıcılar", title: "Öğrenciler", actionText: "Yeni Öğrenci" }
};

document.addEventListener("DOMContentLoaded", async () => {
    const user = requireRole("Admin");
    if (!user) {
        return;
    }

    document.getElementById("adminWelcome").textContent = user.fullName;
    document.getElementById("logoutButton").addEventListener("click", logout);
    document.getElementById("sidebarNav").addEventListener("click", handleNavigation);
    document.getElementById("primaryActionButton").addEventListener("click", handlePrimaryAction);

    bindForms();
    bindModalCloseButtons();
    await initialize();
});

async function initialize() {
    await loadAllData();
    loadPage("dashboard");
}

async function loadAllData() {
    setSystemStatus("Güncelleniyor", "warning");
    const results = await Promise.all([
        request({ url: endpoints.dashboard }),
        request({ url: endpoints.labs }),
        request({ url: endpoints.students }),
        request({ url: endpoints.computers })
    ]);

    state.summary = results[0].data;
    state.labs = results[1].data;
    state.students = results[2].data;
    state.computers = results[3].data;
    setSystemStatus("Hazır", "success");
}

function bindForms() {
    document.getElementById("labForm").addEventListener("submit", submitLabForm);
    document.getElementById("computerForm").addEventListener("submit", submitComputerForm);
    document.getElementById("studentForm").addEventListener("submit", submitStudentForm);
}

function bindModalCloseButtons() {
    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => closeModal(button.dataset.closeModal));
    });
}

function handleNavigation(event) {
    const button = event.target.closest("[data-page]");
    if (!button) {
        return;
    }

    loadPage(button.dataset.page);
}

function handlePrimaryAction() {
    if (state.currentPage === "labs") {
        openLabModal();
    } else if (state.currentPage === "computers") {
        openComputerModal();
    } else if (state.currentPage === "students") {
        openStudentModal();
    }
}

function loadPage(page) {
    state.currentPage = page;
    updatePageHeader(page);
    updateSidebar(page);

    const content = document.getElementById("pageContent");
    if (page === "dashboard") {
        content.innerHTML = renderDashboardPage();
    } else if (page === "labs") {
        content.innerHTML = renderLabsPage();
    } else if (page === "computers") {
        content.innerHTML = renderComputersPage();
    } else if (page === "students") {
        content.innerHTML = renderStudentsPage();
    }
}

function updatePageHeader(page) {
    const config = pageConfig[page];
    document.getElementById("pageEyebrow").textContent = config.eyebrow;
    document.getElementById("pageTitle").textContent = config.title;

    const button = document.getElementById("primaryActionButton");
    if (config.actionText) {
        button.textContent = config.actionText;
        button.hidden = false;
    } else {
        button.hidden = true;
    }
}

function updateSidebar(page) {
    document.querySelectorAll("#sidebarNav [data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });
}

function renderDashboardPage() {
    const stats = [
        ["Laboratuvar", state.summary.totalLabs],
        ["Bilgisayar", state.summary.totalComputers],
        ["Aktif Bilgisayar", state.summary.activeComputers],
        ["Bakımdaki Bilgisayar", state.summary.maintenanceComputers],
        ["Öğrenci", state.summary.totalStudents]
    ];

    return `
        <section class="lrp-stats-grid">
            ${stats.map(([label, value]) => `
                <article class="lrp-stat-card">
                    <div class="lrp-stat-label">${label}</div>
                    <div class="lrp-stat-value">${value}</div>
                </article>
            `).join("")}
        </section>
        <section class="lrp-grid-2">
            <div class="lrp-card">
                <h3 class="lrp-card-title">Laboratuvar Özeti</h3>
                <div class="lrp-grid">
                    ${state.labs.map(lab => `
                        <article class="lrp-card">
                            <h4 class="lrp-card-title">${lab.name}</h4>
                            <div class="lrp-muted">${lab.location}</div>
                            <div class="lrp-grid-2" style="margin-top: 14px;">
                                <div>
                                    <div class="lrp-muted">Kapasite</div>
                                    <strong>${lab.capacity}</strong>
                                </div>
                                <div>
                                    <div class="lrp-muted">Bilgisayar</div>
                                    <strong>${lab.computerCount}</strong>
                                </div>
                            </div>
                        </article>
                    `).join("")}
                </div>
            </div>
            <div class="lrp-table-card">
                <h3 class="lrp-card-title">Son Durum</h3>
                <div class="lrp-table-wrap">
                    <table class="lrp-table">
                        <thead>
                            <tr>
                                <th>Demirbaş Kodu</th>
                                <th>Ad</th>
                                <th>Laboratuvar</th>
                                <th>Durum</th>
                                <th>Sorumlu Öğrenci</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.computers.map(computer => `
                                <tr>
                                    <td>${computer.assetCode}</td>
                                    <td>${computer.name}</td>
                                    <td>${computer.labName}</td>
                                    <td>${renderStatus(computer.status)}</td>
                                    <td>${computer.responsibleStudentName ?? "-"}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    `;
}

function renderLabsPage() {
    return `
        <section class="lrp-grid-3">
            ${state.labs.map(lab => `
                <article class="lrp-card">
                    <h3 class="lrp-card-title">${lab.name}</h3>
                    <div class="lrp-muted">${lab.location}</div>
                    <div class="lrp-grid-2" style="margin: 16px 0;">
                        <div>
                            <div class="lrp-muted">Kapasite</div>
                            <strong>${lab.capacity}</strong>
                        </div>
                        <div>
                            <div class="lrp-muted">Aktif</div>
                            <strong>${lab.activeComputerCount}</strong>
                        </div>
                    </div>
                    <div class="lrp-actions">
                        <button class="lrp-button lrp-button-ghost" onclick="editLab(${lab.id})">Düzenle</button>
                        <button class="lrp-button lrp-button-danger" onclick="deleteLab(${lab.id})">Sil</button>
                    </div>
                </article>
            `).join("")}
        </section>
    `;
}

function renderComputersPage() {
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
                            <th>Donanım</th>
                            <th>Durum</th>
                            <th>Laboratuvar</th>
                            <th>Sorumlu Öğrenci</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.computers.map(computer => `
                            <tr>
                                <td>${computer.assetCode}</td>
                                <td>${computer.name}</td>
                                <td>${computer.brand}</td>
                                <td>${computer.processor}</td>
                                <td>${computer.ramGb} GB</td>
                                <td>${computer.serialNumber}</td>
                                <td>${renderHardware(computer)}</td>
                                <td>${renderStatus(computer.status)}</td>
                                <td>${computer.labName}</td>
                                <td>${computer.responsibleStudentName ?? "-"}</td>
                                <td>
                                    <div class="lrp-actions">
                                        <button class="lrp-button lrp-button-ghost" onclick="editComputer(${computer.id})">Düzenle</button>
                                        <button class="lrp-button lrp-button-danger" onclick="deleteComputer(${computer.id})">Sil</button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function renderStudentsPage() {
    return `
        <section class="lrp-table-card">
            <div class="lrp-table-wrap">
                <table class="lrp-table">
                    <thead>
                        <tr>
                            <th>Ad Soyad</th>
                            <th>Öğrenci No</th>
                            <th>E-posta</th>
                            <th>Hesap</th>
                            <th>Sorumlu Olduğu PC</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.students.map(student => `
                            <tr>
                                <td>${student.firstName} ${student.lastName}</td>
                                <td>${student.studentNumber}</td>
                                <td>${student.email}</td>
                                <td>${student.hasUserAccount ? '<span class="lrp-pill lrp-pill-success">Oluştu</span>' : '<span class="lrp-pill">Yok</span>'}</td>
                                <td>${student.responsibleComputerCount}</td>
                                <td>
                                    <div class="lrp-actions">
                                        <button class="lrp-button lrp-button-ghost" onclick="editStudent(${student.id})">Düzenle</button>
                                        <button class="lrp-button lrp-button-danger" onclick="deleteStudent(${student.id})">Sil</button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function renderStatus(status) {
    const map = {
        1: ["Aktif", "active"],
        2: ["Bakımda", "maintenance"],
        3: ["Pasif", "passive"]
    };

    const [label, className] = map[status] ?? ["Bilinmiyor", "passive"];
    return `<span class="lrp-status ${className}">${label}</span>`;
}

function renderHardware(computer) {
    const items = [];
    if (computer.hasHdmi) items.push("HDMI");
    if (computer.hasVeyon) items.push("Veyon");
    return items.length > 0 ? items.join(", ") : "-";
}

function openLabModal() {
    resetForm("lab");
    openModal("labModal");
}

function openComputerModal() {
    resetForm("computer");
    fillLabSelect();
    fillStudentSelect();
    openModal("computerModal");
}

function openStudentModal() {
    resetForm("student");
    openModal("studentModal");
}

function openModal(id) {
    document.getElementById(id).classList.add("open");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}

function fillLabSelect() {
    document.getElementById("computerLabId").innerHTML = state.labs
        .map(lab => `<option value="${lab.id}">${lab.name}</option>`)
        .join("");
}

function fillStudentSelect() {
    const select = document.getElementById("computerStudentId");
    select.innerHTML = `<option value="">Atama Yok</option>${state.students
        .map(student => `<option value="${student.id}">${student.studentNumber} - ${student.firstName} ${student.lastName}</option>`)
        .join("")}`;
}

async function submitLabForm(event) {
    event.preventDefault();
    const id = document.getElementById("labId").value;
    const payload = {
        name: document.getElementById("labName").value.trim(),
        location: document.getElementById("labLocation").value.trim(),
        capacity: Number(document.getElementById("labCapacity").value)
    };

    await saveEntity(id, endpoints.labs, payload);
    closeModal("labModal");
    await refreshAndReload();
}

async function submitComputerForm(event) {
    event.preventDefault();
    const id = document.getElementById("computerId").value;
    const studentId = document.getElementById("computerStudentId").value;
    const payload = {
        name: document.getElementById("computerName").value.trim(),
        brand: document.getElementById("computerBrand").value.trim(),
        processor: document.getElementById("computerProcessor").value.trim(),
        ramGb: Number(document.getElementById("computerRamGb").value),
        serialNumber: document.getElementById("computerSerialNumber").value.trim(),
        hasHdmi: document.getElementById("computerHasHdmi").checked,
        hasVeyon: document.getElementById("computerHasVeyon").checked,
        status: Number(document.getElementById("computerStatus").value),
        labId: Number(document.getElementById("computerLabId").value),
        responsibleStudentId: studentId ? Number(studentId) : null
    };

    await saveEntity(id, endpoints.computers, payload);
    closeModal("computerModal");
    await refreshAndReload();
}

async function submitStudentForm(event) {
    event.preventDefault();
    const id = document.getElementById("studentId").value;
    const payload = {
        firstName: document.getElementById("studentFirstName").value.trim(),
        lastName: document.getElementById("studentLastName").value.trim(),
        studentNumber: document.getElementById("studentNumber").value.trim(),
        email: document.getElementById("studentEmail").value.trim()
    };

    await saveEntity(id, endpoints.students, payload);
    closeModal("studentModal");
    await refreshAndReload();
}

async function saveEntity(id, endpoint, payload) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${endpoint}/${id}` : endpoint;

    await request({
        url,
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

async function deleteLab(id) {
    await confirmAndDelete(`${endpoints.labs}/${id}`);
}

async function deleteComputer(id) {
    await confirmAndDelete(`${endpoints.computers}/${id}`);
}

async function deleteStudent(id) {
    await confirmAndDelete(`${endpoints.students}/${id}`);
}

async function confirmAndDelete(url) {
    if (!confirm("Kaydı silmek istediğinize emin misiniz?")) {
        return;
    }

    await request({ url, method: "DELETE" });
    await refreshAndReload();
}

async function refreshAndReload() {
    await loadAllData();
    loadPage(state.currentPage);
}

function editLab(id) {
    const lab = state.labs.find(item => item.id === id);
    if (!lab) return;

    resetForm("lab");
    document.getElementById("labId").value = lab.id;
    document.getElementById("labName").value = lab.name;
    document.getElementById("labLocation").value = lab.location;
    document.getElementById("labCapacity").value = lab.capacity;
    openModal("labModal");
}

function editComputer(id) {
    const computer = state.computers.find(item => item.id === id);
    if (!computer) return;

    resetForm("computer");
    fillLabSelect();
    fillStudentSelect();
    document.getElementById("computerId").value = computer.id;
    document.getElementById("computerName").value = computer.name;
    document.getElementById("computerBrand").value = computer.brand;
    document.getElementById("computerProcessor").value = computer.processor;
    document.getElementById("computerRamGb").value = computer.ramGb;
    document.getElementById("computerSerialNumber").value = computer.serialNumber;
    document.getElementById("computerHasHdmi").checked = computer.hasHdmi;
    document.getElementById("computerHasVeyon").checked = computer.hasVeyon;
    document.getElementById("computerStatus").value = computer.status;
    document.getElementById("computerLabId").value = computer.labId;
    document.getElementById("computerStudentId").value = computer.responsibleStudentId ?? "";
    openModal("computerModal");
}

function editStudent(id) {
    const student = state.students.find(item => item.id === id);
    if (!student) return;

    resetForm("student");
    document.getElementById("studentId").value = student.id;
    document.getElementById("studentFirstName").value = student.firstName;
    document.getElementById("studentLastName").value = student.lastName;
    document.getElementById("studentNumber").value = student.studentNumber;
    document.getElementById("studentEmail").value = student.email;
    openModal("studentModal");
}

function resetForm(type) {
    if (type === "lab") {
        document.getElementById("labForm").reset();
        document.getElementById("labId").value = "";
    } else if (type === "computer") {
        document.getElementById("computerForm").reset();
        document.getElementById("computerId").value = "";
    } else if (type === "student") {
        document.getElementById("studentForm").reset();
        document.getElementById("studentId").value = "";
    }
}

function setSystemStatus(text, style) {
    const badge = document.getElementById("systemStatus");
    badge.textContent = text;
    badge.className = style === "success"
        ? "lrp-pill lrp-pill-success"
        : "lrp-pill";
}

window.editLab = editLab;
window.deleteLab = deleteLab;
window.editComputer = editComputer;
window.deleteComputer = deleteComputer;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
