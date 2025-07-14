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
    let publicCount = 0;
    let privateCount = 0;
    let unknownCount = 0;

    data.forEach(d => {
        const type = d['respondent_type'] || ''; // Handle potential blank values
        // Categorize each case based on the 'respondent_type' string
        if (type.includes('Public')) {
            publicCount++;
        } else if (type.includes('Private')) {
            privateCount++;
        } else {
            unknownCount++; // Count cases where the type is not specified
        }
    });

    const totalCount = publicCount + privateCount; // We will only plot Public and Private
    
    // Calculate percentages
    const publicPercentage = (publicCount / totalCount * 100);
    const privatePercentage = (privateCount / totalCount * 100);
    
    // --- Create the Bar Chart Trace ---
    const trace = {
        x: ['Public', 'Private'], // The labels for the bars
        y: [publicPercentage, privatePercentage], // The height of the bars (percentages)
        // This 'customdata' holds the actual case numbers for the hover text
        customdata: [publicCount, privateCount], 
        // This defines what shows up on hover
        hovertemplate: '<b>%{x} Defendants</b><br>' +
                       'Percentage: %{y:.1f}%<br>' +
                       'Number of Cases: %{customdata}<extra></extra>',
        type: 'bar',
        marker: {
            // Set different colors for each bar
            color: ['rgba(2, 64, 115, 0.8)', 'rgba(232, 129, 3, 0.8)'],
            line: {
                color: ['rgba(2, 64, 115, 1)', 'rgba(232, 129, 3, 1)'],
                width: 2
            }
        }
    };

    // --- Define the Layout ---
    const layout = {
        title: '', // Title is in the HTML
        xaxis: {
            title: 'Defendant Type'
        },
        yaxis: {
            title: 'Percentage of Total Cases',
            range: [0, 100], // Set Y-axis to go from 0 to 100
            ticksuffix: '%' // Add a '%' symbol to the y-axis ticks
        },
        showlegend: false // Hide the legend as it's not needed for a simple bar chart
    };

    // --- Render the Plot ---
    Plotly.newPlot('chart', [trace], layout, {responsive: true});
    
    // Log the counts to the console for verification
    console.log(`Public Cases: ${publicCount}`);
    console.log(`Private Cases: ${privateCount}`);
    console.log(`Unknown/Not Specified: ${unknownCount}`);
}

// Run the function
createPlot().catch(error => {
    console.error("Failed to create the plot:", error);
});