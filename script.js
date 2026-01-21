let csvData = null;
let barChart = null;
let pieChart = null;
let lastReport = null;

// Global references
let generateBtn;
let downloadBtn;
let fileInput;
let dataInput;
let insightElement;

// ======================= TOAST NOTIFICATION SYSTEM =======================

function showToast(type, message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.classList.add("toast");

    if (type === "success") toast.classList.add("toast-success");
    else if (type === "error") toast.classList.add("toast-error");
    else toast.classList.add("toast-info");

    toast.innerHTML = `
        <i data-lucide="${type === "error" ? "alert-triangle" :
            type === "success" ? "check-circle" : "info"}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    lucide?.createIcons();

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// ========================== VALIDATION UI ===============================

function showValidation(type, message) {
    const box = document.getElementById("validationMessage");
    if (!box) return;

    box.classList.remove("hidden", "validation-error", "validation-success");

    if (type === "error") {
        box.classList.add("validation-error");
        box.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
        showToast("error", message);
    } else {
        box.classList.add("validation-success");
        box.innerHTML = `<i data-lucide="check-circle"></i> ${message}`;
        showToast("success", message);
    }

    box.classList.add("validation-show");
    lucide?.createIcons();
}

function hideValidation() {
    const box = document.getElementById("validationMessage");
    if (!box) return;

    box.classList.add("hidden");
    box.classList.remove("validation-show");
}

// ========================== SKELETON LOADER ===============================

function showTableSkeleton() {
    document.getElementById("tableSkeleton").style.display = "block";
    document.getElementById("tableContent").style.display = "none";
}

function hideTableSkeleton() {
    document.getElementById("tableSkeleton").style.display = "none";
    document.getElementById("tableContent").style.display = "block";
}

// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {

    generateBtn = document.getElementById("generateBtn");
    downloadBtn = document.getElementById("downloadBtn");
    fileInput = document.getElementById("fileInput");
    dataInput = document.getElementById("dataInput");
    insightElement = document.getElementById("insightText");

    fileInput?.addEventListener("change", handleFile);
    dataInput?.addEventListener("input", handleManualInput);
    generateBtn?.addEventListener("click", generateReport);
    downloadBtn?.addEventListener("click", downloadCSV);

    // ---------------- DARK MODE ----------------

    const themeToggleBtn = document.getElementById("themeToggle");
    const body = document.body;

    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        updateDarkIcon(true);
    }

    themeToggleBtn?.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDark = body.classList.contains("dark-mode");

        localStorage.setItem("theme", isDark ? "dark" : "light");
        updateDarkIcon(isDark);
    });

    function updateDarkIcon(isDark) {
        themeToggleBtn.innerHTML = isDark
            ? '<i data-lucide="sun"></i> Light Mode'
            : '<i data-lucide="moon"></i> Dark Mode';

        lucide?.createIcons();
    }

    // ---------------- MULTI-THEME COLOR SWITCHER ----------------

    const themeButtons = document.querySelectorAll(".theme-btn");
    const savedTheme = localStorage.getItem("colorTheme") || "blue";

    document.documentElement.setAttribute("data-theme", savedTheme);

    themeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.getAttribute("data-theme");

            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("colorTheme", theme);

            showToast("info", `${theme.toUpperCase()} theme applied`);
        });
    });

    // ---------------- MOBILE SIDEBAR ----------------

    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");

    mobileMenuBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (sidebar.classList.contains("open") &&
            !sidebar.contains(e.target) &&
            e.target !== mobileMenuBtn) {
            sidebar.classList.remove("open");
        }
    });

    lucide?.createIcons();
});

// ==========================================================================
// FILE INPUT HANDLING
// ==========================================================================

function handleFile(event) {
    const file = event.target.files[0];
    hideValidation();

    if (!file) return;

    if (!file.name.endsWith(".csv")) {
        showValidation("error", "Please upload a valid CSV file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            csvData = parseCSV(e.target.result);
            renderPreview(csvData);

            showValidation("success", "CSV uploaded successfully.");
            generateBtn.classList.remove("hidden");

        } catch {
            showValidation("error", "Invalid CSV structure.");
        }
    };

    reader.readAsText(file);
}

// ==========================================================================
// MANUAL INPUT HANDLING
// ==========================================================================

function handleManualInput() {
    const input = dataInput.value.trim();
    hideValidation();

    if (input === "") {
        generateBtn.classList.add("hidden");
        return;
    }

    const valid = /^[0-9,\s]+$/.test(input);

    if (!valid) {
        showValidation("error", "Only numbers and commas allowed.");
        generateBtn.classList.add("hidden");
        return;
    }

    csvData = null;
    generateBtn.classList.remove("hidden");
    showValidation("success", "Valid numeric input detected.");
}

// ==========================================================================
// CSV PARSER
// ==========================================================================

function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line =>
        line.split(",").map(v => Number(v.trim()))
    );
    return { headers, rows };
}

// ==========================================================================
// PREVIEW TABLE
// ==========================================================================

function renderPreview(data) {
    let html = "<table><tr>";
    data.headers.forEach(h => html += `<th>${h}</th>`);
    html += "</tr>";

    data.rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => html += `<td>${cell}</td>`);
        html += "</tr>";
    });

    html += "</table>";

    document.getElementById("tableContent").innerHTML = html;
}

// ==========================================================================
// REPORT GENERATION
// ==========================================================================

function generateReport() {
    hideValidation();

    if (!csvData && dataInput.value.trim() === "") {
        showValidation("error", "Upload CSV or enter numeric data.");
        return;
    }

    showTableSkeleton();

    document.getElementById("loadingSpinner").classList.remove("hidden");
    generateBtn.disabled = true;

    setTimeout(() => {

        let data = csvData;

        if (!data) {
            const values = dataInput.value.split(",").map(v => Number(v.trim()));
            data = { headers: ["Values"], rows: values.map(v => [v]) };
        }

        if (data.rows.flat().some(isNaN)) {
            showValidation("error", "Input contains invalid numbers.");
            return;
        }

        const report = [];

        data.headers.forEach((header, colIndex) => {
            const values = data.rows.map(row => row[colIndex]);

            const total = values.reduce((a, b) => a + b, 0);
            const avg = total / values.length;
            const max = Math.max(...values);
            const min = Math.min(...values);

            report.push({ header, total, avg, max, min });
        });

        hideTableSkeleton();

        renderReportTable(report);
        generateCharts(report);
        generateInsights(report);

        lastReport = report;

        downloadBtn.classList.remove("hidden");

        showToast("success", "Report generated successfully!");

        document.getElementById("loadingSpinner").classList.add("hidden");
        generateBtn.disabled = false;

    }, 800);
}

// ==========================================================================
// RENDER TABLE
// ==========================================================================

function renderReportTable(report) {
    let html =
        "<table><tr><th>Column</th><th>Total</th><th>Average</th><th>Max</th><th>Min</th></tr>";

    report.forEach(r => {
        html += `<tr>
            <td>${r.header}</td>
            <td>${r.total}</td>
            <td>${r.avg.toFixed(2)}</td>
            <td>${r.max}</td>
            <td>${r.min}</td>
        </tr>`;
    });

    html += "</table>";
    document.getElementById("tableContent").innerHTML = html;
}

// ==========================================================================
// CHARTS
// ==========================================================================

function generateCharts(report) {
    const labels = report.map(r => r.header);
    const averages = report.map(r => r.avg);
    const totals = report.map(r => r.total);

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{ label: "Average Values", data: averages }]
        }
    });

    pieChart = new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels,
            datasets: [{ data: totals }]
        }
    });
}

// ==========================================================================
// INSIGHTS
// ==========================================================================

function generateInsights(report) {
    const avgOfAvgs = report.reduce((s, r) => s + r.avg, 0) / report.length;

    insightElement.innerText =
        avgOfAvgs >= 75
            ? "Overall dataset performance is strong."
            : "Dataset performance shows room for improvement.";
}

// ==========================================================================
// CSV DOWNLOAD
// ==========================================================================

function downloadCSV() {
    if (!lastReport) return;

    let csv = "Column,Total,Average,Maximum,Minimum\n";

    lastReport.forEach(r => {
        csv += `${r.header},${r.total},${r.avg.toFixed(2)},${r.max},${r.min}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_report.csv";
    a.click();

    URL.revokeObjectURL(url);
}
