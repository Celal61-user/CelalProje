document.addEventListener("DOMContentLoaded", async () => {
    const user = requireRole("Student");
    if (!user) {
        return;
    }

    document.getElementById("studentWelcome").textContent = `Hoş geldin, ${user.fullName}`;
    document.getElementById("logoutButton").addEventListener("click", logout);

    const data = await fetchStudentPortal(user.username);
    renderStudentStats(data);
    renderStudentCards(data.computers);
    renderStudentTable(data.computers);
});

async function fetchStudentPortal(username) {
    const response = await fetch(`/api/students/portal/${encodeURIComponent(username)}`);
    if (!response.ok) {
        throw new Error("Öğrenci paneli yüklenemedi.");
    }

    return response.json();
}

function renderStudentStats(data) {
    const activeCount = data.computers.filter(computer => computer.status === 1).length;
    const hdmiCount = data.computers.filter(computer => computer.hasHdmi).length;
    const veyonCount = data.computers.filter(computer => computer.hasVeyon).length;

    const items = [
        ["Öğrenci No", data.studentNumber],
        ["Zimmetli Bilgisayar", data.computers.length],
        ["Aktif Bilgisayar", activeCount],
        ["HDMI", hdmiCount],
        ["Veyon", veyonCount]
    ];

    document.getElementById("studentStats").innerHTML = items.map(([label, value]) => `
        <article class="stat-card">
            <span>${label}</span>
            <strong>${value}</strong>
        </article>
    `).join("");
}

function renderStudentCards(computers) {
    const container = document.getElementById("studentComputerCards");

    if (computers.length === 0) {
        container.innerHTML = `
            <article class="student-empty-card">
                <h3>Zimmetli bilgisayar bulunamadı</h3>
                <p>Bu hesaba bağlı bir bilgisayar ataması yok.</p>
            </article>
        `;
        return;
    }

    container.innerHTML = computers.map(computer => `
        <article class="lab-card">
            <h3>${computer.assetCode}</h3>
            <p class="lab-meta">Ad: ${computer.name}</p>
            <p class="lab-meta">Laboratuvar: ${computer.labName}</p>
            <p class="lab-meta">Konum: ${computer.labLocation}</p>
            <p class="lab-meta">Durum: ${renderStudentStatusText(computer.status)}</p>
        </article>
    `).join("");
}

function renderStudentTable(computers) {
    if (computers.length === 0) {
        document.getElementById("studentComputerTable").innerHTML = "";
        return;
    }

    const table = `
        <table>
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
    `;

    document.getElementById("studentComputerTable").innerHTML = table;
}

function renderStudentStatus(status) {
    const map = {
        1: ["Aktif", "status-active"],
        2: ["Bakımda", "status-maintenance"],
        3: ["Pasif", "status-passive"]
    };

    const [label, className] = map[status] ?? ["Bilinmiyor", "status-passive"];
    return `<span class="status-pill ${className}">${label}</span>`;
}

function renderStudentStatusText(status) {
    const map = {
        1: "Aktif",
        2: "Bakımda",
        3: "Pasif"
    };

    return map[status] ?? "Bilinmiyor";
}
