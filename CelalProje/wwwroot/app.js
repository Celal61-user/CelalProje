const endpoints = {
    labs: "/api/labs",
    computers: "/api/computers",
    students: "/api/students",
    dashboard: "/api/dashboard/summary"
};

const state = {
    labs: [],
    computers: [],
    students: []
};

document.addEventListener("DOMContentLoaded", () => {
    const user = requireRole("Admin");
    if (!user) {
        return;
    }

    document.getElementById("adminWelcome").textContent = `Hos geldiniz, ${user.fullName}`;
    document.getElementById("logoutButton").addEventListener("click", logout);
    bindDialogButtons();
    bindForms();
    initialize();
});

async function initialize() {
    await Promise.all([loadDashboard(), loadLabs(), loadStudents(), loadComputers()]);
}

function bindDialogButtons() {
    document.querySelectorAll("[data-dialog-target]").forEach(button => {
        button.addEventListener("click", () => {
            resetForm(button.dataset.dialogTarget);
            document.getElementById(button.dataset.dialogTarget).showModal();
        });
    });
}

function bindForms() {
    document.getElementById("labForm").addEventListener("submit", submitLabForm);
    document.getElementById("computerForm").addEventListener("submit", submitComputerForm);
    document.getElementById("studentForm").addEventListener("submit", submitStudentForm);
}

async function loadDashboard() {
    const summary = await requestJson(endpoints.dashboard);
    const items = [
        ["Laboratuvar", summary.totalLabs],
        ["Bilgisayar", summary.totalComputers],
        ["Aktif Bilgisayar", summary.activeComputers],
        ["Bakimdaki Bilgisayar", summary.maintenanceComputers],
        ["Ogrenci", summary.totalStudents]
    ];

    document.getElementById("statsGrid").innerHTML = items.map(([label, value]) => `
        <article class="stat-card">
            <span>${label}</span>
            <strong>${value}</strong>
        </article>
    `).join("");
}

async function loadLabs() {
    state.labs = await requestJson(endpoints.labs);
    renderLabs();
    fillLabSelect();
}

async function loadStudents() {
    state.students = await requestJson(endpoints.students);
    renderStudents();
    fillStudentSelect();
}

async function loadComputers() {
    state.computers = await requestJson(endpoints.computers);
    renderComputers();
}

function renderLabs() {
    const container = document.getElementById("labsList");
    container.innerHTML = state.labs.map(lab => `
        <article class="lab-card">
            <h3>${lab.name}</h3>
            <p class="lab-meta">Konum: ${lab.location}</p>
            <p class="lab-meta">Kapasite: ${lab.capacity}</p>
            <p class="lab-meta">Bilgisayar: ${lab.computerCount}</p>
            <div class="row-actions">
                <button onclick="editLab(${lab.id})">Duzenle</button>
                <button class="danger" onclick="deleteLab(${lab.id})">Sil</button>
            </div>
        </article>
    `).join("");
}

function renderComputers() {
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Demirbas Kodu</th>
                    <th>Ad</th>
                    <th>Marka</th>
                    <th>Islemci</th>
                    <th>RAM</th>
                    <th>Seri No</th>
                    <th>Donanim</th>
                    <th>Durum</th>
                    <th>Laboratuvar</th>
                    <th>Sorumlu Ogrenci</th>
                    <th>Islem</th>
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
                            <div class="row-actions">
                                <button onclick="editComputer(${computer.id})">Duzenle</button>
                                <button class="danger" onclick="deleteComputer(${computer.id})">Sil</button>
                            </div>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    document.getElementById("computersTable").innerHTML = table;
}

function renderStudents() {
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Ad Soyad</th>
                    <th>Ogrenci No</th>
                    <th>E-posta</th>
                    <th>Hesap</th>
                    <th>Sorumlu Oldugu PC</th>
                    <th>Islem</th>
                </tr>
            </thead>
            <tbody>
                ${state.students.map(student => `
                    <tr>
                        <td>${student.firstName} ${student.lastName}</td>
                        <td>${student.studentNumber}</td>
                        <td>${student.email}</td>
                        <td>${student.hasUserAccount ? "Olustu" : "-"}</td>
                        <td>${student.responsibleComputerCount}</td>
                        <td>
                            <div class="row-actions">
                                <button onclick="editStudent(${student.id})">Duzenle</button>
                                <button class="danger" onclick="deleteStudent(${student.id})">Sil</button>
                            </div>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    document.getElementById("studentsTable").innerHTML = table;
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

function renderStatus(status) {
    const map = {
        1: ["Aktif", "status-active"],
        2: ["Bakimda", "status-maintenance"],
        3: ["Pasif", "status-passive"]
    };
    const [label, className] = map[status] ?? ["Bilinmiyor", "status-passive"];
    return `<span class="status-pill ${className}">${label}</span>`;
}

function renderHardware(computer) {
    const items = [];
    if (computer.hasHdmi) {
        items.push("HDMI");
    }
    if (computer.hasVeyon) {
        items.push("Veyon");
    }
    return items.length > 0 ? items.join(", ") : "-";
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
    closeDialog("labDialog");
    await refreshAll();
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
    closeDialog("computerDialog");
    await refreshAll();
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
    closeDialog("studentDialog");
    await refreshAll();
}

async function saveEntity(id, endpoint, payload) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${endpoint}/${id}` : endpoint;

    await fetchJson(url, {
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
    if (!confirm("Kaydi silmek istediginize emin misiniz?")) {
        return;
    }

    await fetchJson(url, { method: "DELETE" });
    await refreshAll();
}

async function refreshAll() {
    document.getElementById("systemStatus").textContent = "Guncelleniyor";
    await Promise.all([loadDashboard(), loadLabs(), loadStudents(), loadComputers()]);
    document.getElementById("systemStatus").textContent = "Hazir";
}

function editLab(id) {
    const lab = state.labs.find(item => item.id === id);
    if (!lab) return;

    document.getElementById("labId").value = lab.id;
    document.getElementById("labName").value = lab.name;
    document.getElementById("labLocation").value = lab.location;
    document.getElementById("labCapacity").value = lab.capacity;
    document.getElementById("labDialog").showModal();
}

function editComputer(id) {
    const computer = state.computers.find(item => item.id === id);
    if (!computer) return;

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
    document.getElementById("computerDialog").showModal();
}

function editStudent(id) {
    const student = state.students.find(item => item.id === id);
    if (!student) return;

    document.getElementById("studentId").value = student.id;
    document.getElementById("studentFirstName").value = student.firstName;
    document.getElementById("studentLastName").value = student.lastName;
    document.getElementById("studentNumber").value = student.studentNumber;
    document.getElementById("studentEmail").value = student.email;
    document.getElementById("studentDialog").showModal();
}

function resetForm(dialogId) {
    const forms = {
        labDialog: ["labId", "labName", "labLocation", "labCapacity"],
        computerDialog: ["computerId", "computerName", "computerBrand", "computerProcessor", "computerRamGb", "computerSerialNumber", "computerStatus", "computerLabId", "computerStudentId", "computerHasHdmi", "computerHasVeyon"],
        studentDialog: ["studentId", "studentFirstName", "studentLastName", "studentNumber", "studentEmail"]
    };

    for (const fieldId of forms[dialogId]) {
        const element = document.getElementById(fieldId);
        if (!element) continue;
        if (element.type === "checkbox") {
            element.checked = false;
        } else if (element.tagName === "SELECT") {
            element.selectedIndex = 0;
        } else {
            element.value = "";
        }
    }
}

function closeDialog(dialogId) {
    document.getElementById(dialogId).close();
}

async function requestJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(await extractError(response));
    }

    return response.json();
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        alert(await extractError(response));
        throw new Error("Request failed");
    }

    return response;
}

async function extractError(response) {
    try {
        const data = await response.json();
        return data.message ?? "Bir hata olustu.";
    } catch {
        return "Bir hata olustu.";
    }
}

window.editLab = editLab;
window.deleteLab = deleteLab;
window.editComputer = editComputer;
window.deleteComputer = deleteComputer;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
