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
    let data = parseCSV(csvText);

    const startYear = 1980;
    // **CHANGE**: Filter by the complainant nation column
    data = data.filter(d => d['complainant_nation']);

    // 1. Get the top 5 complainant nations
    const nationCounts = {};
    data.forEach(d => {
        // **CHANGE**: Use the complainant nation column
        const nation = d['complainant_nation'];
        const nations = nation.split(',').map(n => n.trim());
        nations.forEach(n => {
            if (n) {
                nationCounts[n] = (nationCounts[n] || 0) + 1;
            }
        });
    });

    const topNations = Object.entries(nationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([nation]) => nation);

    const filteredData = data.filter(d => {
        const year = parseInt(d['year_claim_resolved']);
        return !isNaN(year) && year >= startYear;
    });

    // 3. Group claims by nation and then by year
    const claimsByYear = new Map();
    filteredData.forEach(d => {
        // **CHANGE**: Use the complainant nation column
        const nations = d['complainant_nation'].split(',').map(n => n.trim());
        const year = parseInt(d['year_claim_resolved']);

        nations.forEach(nation => {
            if (topNations.includes(nation)) {
                if (!claimsByYear.has(nation)) claimsByYear.set(nation, new Map());
                if (!claimsByYear.get(nation).has(year)) claimsByYear.get(nation).set(year, 0);
                claimsByYear.get(nation).set(year, claimsByYear.get(nation).get(year) + 1);
            }
        });
    });
    
    const traces = topNations.map(nation => {
        let cumulativeCount = 0;
        const nationData = claimsByYear.get(nation);
        
        const x_values = [];
        const y_values = [];
        const text_values = [];

        x_values.push(`${startYear}-01-01`);
        y_values.push(0);
        text_values.push(`Starting point for ${nation}`);

        if (nationData) {
            const sortedYears = Array.from(nationData.keys()).sort();
            sortedYears.forEach(year => {
                const yearlyClaims = nationData.get(year);
                cumulativeCount += yearlyClaims;
                x_values.push(`${year}-01-01`);
                y_values.push(cumulativeCount);
                text_values.push(`<b>${nation}</b><br>Year: ${year}<br>New Claims in Year: ${yearlyClaims}<br>Total Claims: ${cumulativeCount}`);
            });
        }

        return {
            x: x_values,
            y: y_values,
            mode: 'lines+markers',
            name: nation,
            text: text_values,
            hovertemplate: '%{text}<extra></extra>',
            line: { width: 3 }
        };
    });

    // --- Define the Layout for the Plot ---
    const layout = {
        title: '', 
        xaxis: {
            title: 'Year Claim Resolved',
            type: 'date',
            range: [`${startYear}-01-01`, new Date().toISOString().split('T')[0]]
        },
        yaxis: {
            title: 'Total Number of Claims',
            rangemode: 'tozero'
        },
        hovermode: 'x unified',
        legend: {
            traceorder: 'normal',
            title: {
                // **CHANGE**: Update the legend title
                text: 'Complainant Nation'
            }
        },
        margin: {
            l: 80, // left margin
            r: 50, // right margin
            b: 50, // bottom margin
            t: 50  // top margin
        }
    };
    
    // --- Render the Plot ---
    Plotly.newPlot('chart', traces, layout, {responsive: true});
}

// Run the function to create the plot
createPlot().catch(error => {
    console.error("Failed to create the plot:", error);
});