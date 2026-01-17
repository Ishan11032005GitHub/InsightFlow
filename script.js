let csvData = null;
let barChart = null;
let pieChart = null;
let lastReport = null;

// Global references to elements to be used in functions
let generateBtn;
let downloadBtn;
let barDownload;
let pieDownload;
let fileInput;
let dataInput;
let tableContainer;
let reportTableElement;
let insightElement;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize element references
    generateBtn = document.getElementById("generateBtn");
    downloadBtn = document.getElementById("downloadBtn");
    barDownload = document.getElementById("barDownload");
    pieDownload = document.getElementById("pieDownload");
    fileInput = document.getElementById("fileInput");
    dataInput = document.getElementById("dataInput");
    tableContainer = document.getElementById("tableContainer");
    reportTableElement = document.getElementById("reportTable");
    insightElement = document.getElementById("insightText");

    // Event Listeners
    if (fileInput) fileInput.addEventListener("change", handleFile);
    if (dataInput) dataInput.addEventListener("input", handleManualInput);
    if (generateBtn) generateBtn.addEventListener('click', generateReport);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCSV);
    if (barDownload) barDownload.addEventListener('click', () => downloadChart('barChart'));
    if (pieDownload) pieDownload.addEventListener('click', () => downloadChart('pieChart'));

    // --- Dark Mode Logic ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const body = document.body;

    // Check saved preference
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

    // --- Mobile Sidebar Logic ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                e.target !== mobileMenuBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Initialize Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (dataInput) dataInput.value = "";

    const reader = new FileReader();
    reader.onload = e => {
        csvData = parseCSV(e.target.result);
        renderPreview(csvData);

        if (generateBtn) generateBtn.classList.remove("hidden");
    };
    reader.readAsText(file);
}

function handleManualInput() {
    const input = dataInput.value.trim();
    if (input !== "") {
        csvData = null;
        if (generateBtn) generateBtn.classList.remove("hidden");
    }
}

function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line =>
        line.split(",").map(v => Number(v.trim()))
    );
    return { headers, rows };
}

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
    if (tableContainer) tableContainer.innerHTML = html;
}

function generateReport() {
    let data = csvData;

    if (!data) {
        const input = dataInput.value.trim();
        if (!input) return alert("Upload CSV or enter numeric data.");

        data = {
            headers: ["Values"],
            rows: input.split(",").map(v => [Number(v.trim())])
        };
    }

    // Filter out invalid rows if needed, or check for NaN
    if (data.rows.flat().some(isNaN)) {
        return alert("Invalid numeric data detected.");
    }

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

    if (downloadBtn) downloadBtn.classList.remove("hidden");
    if (barDownload) barDownload.classList.remove("hidden");
    if (pieDownload) pieDownload.classList.remove("hidden");

    // Refresh icons since new content might have icons (though tables don't here)
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

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
    if (reportTableElement) reportTableElement.innerHTML = html;
}

function generateCharts(report) {
    const labels = report.map(r => r.header);
    const averages = report.map(r => r.avg);
    const totals = report.map(r => r.total);

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    const barCtx = document.getElementById("barChart");
    if (barCtx) {
        barChart = new Chart(barCtx, {
            type: "bar",
            data: {
                labels,
                datasets: [{ label: "Average Values", data: averages }]
            }
        });
    }

    const pieCtx = document.getElementById("pieChart");
    if (pieCtx) {
        pieChart = new Chart(pieCtx, {
            type: "pie",
            data: {
                labels,
                datasets: [{ data: totals }]
            }
        });
    }
}

function generateInsights(report) {
    const avgOfAvgs =
        report.reduce((s, r) => s + r.avg, 0) / report.length;

    if (insightElement) {
        insightElement.innerText =
            avgOfAvgs >= 75
                ? "Overall dataset performance is strong across columns."
                : "Overall dataset performance shows room for improvement.";
    }
}

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

function downloadChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${canvasId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}
