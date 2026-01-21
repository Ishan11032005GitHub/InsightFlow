let csvData = null;
let barChart = null;
let pieChart = null;
let lastReport = null;

// Global references to elements
let generateBtn;
let downloadBtn;
let fileInput;
let dataInput;
let tableContainer;
let reportTableElement;
let insightElement;

// ========================== VALIDATION FUNCTIONS ==========================

// Show validation message
function showValidation(type, message) {
    const box = document.getElementById("validationMessage");
    if (!box) return;

    box.classList.remove("hidden", "validation-error", "validation-success");

    if (type === "error") {
        box.classList.add("validation-error");
        box.innerHTML = `<i data-lucide="alert-circle"></i> ${message}`;
    } else {
        box.classList.add("validation-success");
        box.innerHTML = `<i data-lucide="check-circle"></i> ${message}`;
    }

    box.classList.add("validation-show");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

// Hide validation
function hideValidation() {
    const box = document.getElementById("validationMessage");
    if (!box) return;
    box.classList.add("hidden");
    box.classList.remove("validation-show");
}

// ============================================================================

document.addEventListener('DOMContentLoaded', () => {

    // Element references
    generateBtn = document.getElementById("generateBtn");
    downloadBtn = document.getElementById("downloadBtn");
    fileInput = document.getElementById("fileInput");
    dataInput = document.getElementById("dataInput");
    tableContainer = document.getElementById("tableContainer");
    reportTableElement = document.getElementById("reportTable");
    insightElement = document.getElementById("insightText");

    // Event listeners
    if (fileInput) fileInput.addEventListener("change", handleFile);
    if (dataInput) dataInput.addEventListener("input", handleManualInput);
    if (generateBtn) generateBtn.addEventListener("click", generateReport);
    if (downloadBtn) downloadBtn.addEventListener("click", downloadCSV);

    // Dark Mode Logic
    const themeToggleBtn = document.getElementById('themeToggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        updateThemeIcon(true);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    function updateThemeIcon(isDark) {
        if (!themeToggleBtn) return;
        themeToggleBtn.innerHTML = isDark
            ? '<i data-lucide="sun"></i> Light Mode'
            : '<i data-lucide="moon"></i> Dark Mode';

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Mobile Sidebar Logic
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ============================= FILE INPUT HANDLING =============================

function handleFile(event) {
    const file = event.target.files[0];
    hideValidation();

    if (!file) return;

    if (!file.name.endsWith(".csv")) {
        showValidation("error", "Please upload a valid CSV file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        try {
            csvData = parseCSV(e.target.result);
            renderPreview(csvData);

            showValidation("success", "CSV uploaded successfully!");
            generateBtn.classList.remove("hidden");
        } catch {
            showValidation("error", "Invalid CSV structure. Please check your file.");
        }
    };
    reader.readAsText(file);
}

// ============================= MANUAL INPUT HANDLING =============================

function handleManualInput() {
    const input = dataInput.value.trim();
    hideValidation();

    if (input === "") {
        generateBtn.classList.add("hidden");
        return;
    }

    const isValid = /^[0-9,\s]+$/.test(input);

    if (!isValid) {
        showValidation("error", "Only numbers and commas are allowed (Example: 10, 20, 30).");
        generateBtn.classList.add("hidden");
        return;
    }

    showValidation("success", "Valid numeric input detected. You can generate a report.");
    csvData = null;
    generateBtn.classList.remove("hidden");
}

// ============================= CSV PARSER =============================

function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line =>
        line.split(",").map(v => Number(v.trim()))
    );
    return { headers, rows };
}

// ============================= PREVIEW TABLE =============================

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
    tableContainer.innerHTML = html;
}

// ============================= REPORT GENERATION =============================

function generateReport() {
    hideValidation();

    if (!csvData && dataInput.value.trim() === "") {
        showValidation("error", "Please upload a file or enter numeric data.");
        return;
    }

    let data = csvData;

    if (!data) {
        const values = dataInput.value.split(",").map(v => Number(v.trim()));
        data = { headers: ["Values"], rows: values.map(v => [v]) };
    }

    if (data.rows.flat().some(isNaN)) {
        showValidation("error", "Input contains invalid numbers.");
        return;
    }

    document.getElementById("loadingSpinner").classList.remove("hidden");
    generateBtn.disabled = true;

    setTimeout(() => {
        const report = [];

        data.headers.forEach((header, colIndex) => {
            const values = data.rows.map(r => r[colIndex]);
            const total = values.reduce((a, b) => a + b, 0);
            const avg = total / values.length;
            const max = Math.max(...values);
            const min = Math.min(...values);

            report.push({ header, total, avg, max, min });
        });

        renderReportTable(report);
        generateCharts(report);
        generateInsights(report);

        lastReport = report;

        downloadBtn.classList.remove("hidden");

        document.getElementById("loadingSpinner").classList.add("hidden");
        generateBtn.disabled = false;
    }, 800);
}

// ============================= RENDER REPORT TABLE =============================

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
    tableContainer.innerHTML = html;
}

// ============================= CHARTS =============================

function generateCharts(report) {
    const labels = report.map(r => r.header);
    const averages = report.map(r => r.avg);
    const totals = report.map(r => r.total);

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    const barCtx = document.getElementById("barChart");
    barChart = new Chart(barCtx, {
        type: "bar",
        data: {
            labels,
            datasets: [{ label: "Average Values", data: averages }]
        }
    });

    const pieCtx = document.getElementById("pieChart");
    pieChart = new Chart(pieCtx, {
        type: "pie",
        data: {
            labels,
            datasets: [{ data: totals }]
        }
    });
}

// ============================= INSIGHTS =============================

function generateInsights(report) {
    const avgOfAvgs =
        report.reduce((s, r) => s + r.avg, 0) / report.length;

    insightElement.innerText =
        avgOfAvgs >= 75
            ? "Overall dataset performance is strong across columns."
            : "Overall dataset performance shows room for improvement.";
}

// ============================= CSV DOWNLOAD =============================

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
