/**
 * A robust CSV parser that can handle commas within quoted item titles.
 */
function robustParseCSV(csvText) {
    const data = [];
    const lines = csvText.trim().split('\n');
    const headers = lines.shift().split(',').map(h => h.trim());
    
    lines.forEach(line => {
        if (!line.trim()) return;
        const row = {};
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        
        for(let i=0; i<headers.length; i++) {
            if (headers[i] && values[i]) {
                let value = values[i];
                value = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
                row[headers[i]] = value.trim();
            }
        }
        data.push(row);
    });
    return data;
}

// Main function to create the plot
async function createPlot() {
    const response = await fetch("cpdr_published_cases.csv");
    const csvText = await response.text();
    let data = robustParseCSV(csvText);

    // This variable controls how many nations to display
    const numberOfNationsToShow = 5; 

    const startYear = 1980;
    // Analyze the 'complainant_nation' column
    data = data.filter(d => d['complainant_nation']);

    const nationCounts = {};
    data.forEach(d => {
        const nation = d['complainant_nation'];
        const nations = (nation || '').split(',').map(n => n.trim());
        nations.forEach(n => {
            if (n) { nationCounts[n] = (nationCounts[n] || 0) + 1; }
        });
    });

    const topNations = Object.entries(nationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, numberOfNationsToShow)
        .map(([nation]) => nation);
    
    console.log(`Top ${numberOfNationsToShow} Complainant Nations:`, topNations);

    const filteredData = data.filter(d => {
        const year = parseInt(d['year_claim_resolved']);
        return !isNaN(year) && year >= startYear;
    });

    const claimsByYear = new Map();
    filteredData.forEach(d => {
        const nations = (d['complainant_nation'] || '').split(',').map(n => n.trim());
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
        
        const x_values = [`${startYear}-01-01`];
        const y_values = [0];
        const text_values = [`Starting point for ${nation}`];

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
        return { x: x_values, y: y_values, mode: 'lines+markers', name: nation, text: text_values, hovertemplate: '%{text}<extra></extra>', line: { width: 3 } };
    });

    const layout = {
        title: '', 
        xaxis: { title: 'Year Claim Resolved', type: 'date', range: [`${startYear}-01-01`, new Date().toISOString().split('T')[0]] },
        yaxis: { title: 'Total Number of Claims', rangemode: 'tozero' },
        hovermode: 'x unified',
        legend: {
            traceorder: 'normal',
            // **THE FIX IS HERE:** The title is now correct for this chart.
            title: {
                text: 'Complainant Nation'
            }
        },
        margin: { l: 80, r: 50, b: 50, t: 50 }
    };
    
    Plotly.newPlot('chart', traces, layout, {responsive: true});
}

// Run the function
createPlot().catch(error => {
    console.error("Failed to create the plot:", error);
});