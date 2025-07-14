/**
 * A simple CSV parser to convert CSV text into an array of objects.
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const rowObject = {};
        for (let j = 0; j < headers.length; j++) {
            rowObject[headers[j]] = values[j] ? values[j].trim() : '';
        }
        data.push(rowObject);
    }
    return data;
}

// Main function to create the plot
async function createPlot() {
    const response = await fetch("cpdr_published_cases.csv");
    const csvText = await response.text();
    const data = parseCSV(csvText);

    // --- Data Processing ---

    // Define the exact categories you want to display
    const targetCategories = [
        "Object(s) relinquished",
        "Object(s) not relinquished",
        "Some objects relinquished",
        "Unresolved"
    ];

    // Initialize counters for each category
    const statusCounts = {};
    targetCategories.forEach(cat => { statusCounts[cat] = 0; });
    let otherCount = 0; // To count any cases that don't match

    // Loop through the data and count each case status
    data.forEach(d => {
        const status = (d['case_status'] || '').trim();
        if (targetCategories.includes(status)) {
            statusCounts[status]++;
        } else if (status) {
            otherCount++; // Count statuses that aren't in our target list
        }
    });

    const labels = Object.keys(statusCounts);
    const values = Object.values(statusCounts);

    // --- Create the Pie Chart Trace ---
    const trace = {
        labels: labels,
        values: values,
        type: 'pie',
        // This defines what shows up on hover
        hovertemplate: '<b>%{label}</b><br>' +
                       'Percentage: %{percent}<br>' +
                       'Number of Cases: %{value}<extra></extra>',
        // This defines the text that appears directly on the slices
        textinfo: 'percent',
        insidetextorientation: 'horizontal'
    };

    // --- Define the Layout ---
    const layout = {
        title: '', // Title is in the HTML
        showlegend: true, // Display the legend to the side
        legend: {
            x: 1,
            xanchor: 'left',
            y: 0.5
        },
        height: 600, // Make the chart container a bit taller
        margin: { l: 20, r: 250, b: 20, t: 20 } // Adjust margins to prevent legend overlap
    };

    // --- Render the Plot ---
    Plotly.newPlot('chart', [trace], layout, {responsive: true});
    
    // Log other statuses to the console for verification
    console.log(`Found and counted ${otherCount} cases with other statuses.`);
}

// Run the function
createPlot().catch(error => {
    console.error("Failed to create the plot:", error);
});