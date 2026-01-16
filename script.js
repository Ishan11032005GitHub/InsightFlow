let csvData = null;
let barChart = null;
let pieChart = null;
let lastReport = null;

const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const barDownload = document.getElementById("barDownload");
const pieDownload = document.getElementById("pieDownload");

document.getElementById("fileInput").addEventListener("change", handleFile);
document.getElementById("dataInput").addEventListener("input", handleManualInput);

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Clear manual input
    document.getElementById("dataInput").value = "";

    const reader = new FileReader();
    reader.onload = e => {
        csvData = parseCSV(e.target.result);
        renderPreview(csvData);

        // Show Generate button
        generateBtn.classList.remove("hidden");
    };
    reader.readAsText(file);
}

function handleManualInput() {
    const input = document.getElementById("dataInput").value.trim();
    if (input !== "") {
        csvData = null;
        generateBtn.classList.remove("hidden");
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
    document.getElementById("tableContainer").innerHTML = html;
}

function generateReport() {
    let data = csvData;

    if (!data) {
        const input = document.getElementById("dataInput").value.trim();
        if (!input) return alert("Upload CSV or enter numeric data.");

        data = {
            headers: ["Values"],
            rows: input.split(",").map(v => [Number(v.trim())])
        };
    }

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

    // Show download buttons AFTER report generation
    downloadBtn.classList.remove("hidden");
    barDownload.classList.remove("hidden");
    pieDownload.classList.remove("hidden");
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
    document.getElementById("reportTable").innerHTML = html;
}

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

function generateInsights(report) {
    const avgOfAvgs =
        report.reduce((s, r) => s + r.avg, 0) / report.length;

    document.getElementById("insightText").innerText =
        avgOfAvgs >= 75
            ? "Overall dataset performance is strong across columns."
            : "Overall dataset performance shows room for improvement.";
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
    const link = document.createElement("a");
    link.download = `${canvasId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}
// DARK MODE TOGGLE
const toggleButton = document.getElementById("themeToggle");

toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        toggleButton.textContent = "☀️ Light Mode";
    } else {
        toggleButton.textContent = "🌙 Dark Mode";
    }
});
