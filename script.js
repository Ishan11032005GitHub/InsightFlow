/*
  script.js
*/

function generateReport() {
    // Read user input
    const input = document.getElementById("dataInput").value.trim();

    // Basic validation
    if (input === "") {
        alert("Please enter some data.");
        return;
    }

    /*
      Placeholder logic:
      In later stages, this will parse CSV/JSON data.
      For now, we simulate automation.
    */

    // Simulated values
    const total = 500;
    const average = 83.3;
    const maximum = 95;
    const minimum = 60;

    // Update UI with results
    document.getElementById("total").innerText = total;
    document.getElementById("average").innerText = average;
    document.getElementById("maximum").innerText = maximum;
    document.getElementById("minimum").innerText = minimum;
}
