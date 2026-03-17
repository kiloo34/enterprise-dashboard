/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function processSample() {
    const inputFile = path.join(__dirname, 'qrisaj.csv');
    const outputFile = path.join(__dirname, 'app', 'constants', 'qrisSample.json');

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let rowCount = 0;
    let headers = [];
    const extractedData = [];

    let totalTransactions = 0;
    let settledAmount = 0;
    let unsettledAmount = 0;
    let totalDiscrepancyAmount = 0;
    let matchCount = 0;
    let unmatchCount = 0;
    let suspectCount = 0;

    for await (const line of rl) {
        if (rowCount === 0) {
            headers = line.split(';');
            rowCount++;
            continue;
        }

        if (!line.trim()) continue;

        const cols = line.split(';');

        const timestamp = cols[6];
        const stan = cols[1]; // REF_BILLER
        const merchant = cols[4] || "Unknown Merchant";
        const nominal = parseFloat(cols[7]) || 0;
        const bankStatus = cols[10]; // STATUS
        const reconStatus = cols[18]; // STATUS_REKON

        totalTransactions++;

        let modeledReconStatus = "MATCHED";
        if (reconStatus === 'NORMAL') {
            settledAmount += nominal;
            matchCount++;
            modeledReconStatus = "MATCHED";
        } else if (reconStatus === 'PENYELESAIAN REKON' || bankStatus === 'FAILED') {
            unsettledAmount += nominal;
            totalDiscrepancyAmount += nominal;
            unmatchCount++;
            modeledReconStatus = "UNMATCHED";
        } else {
            suspectCount++;
            modeledReconStatus = "SUSPECT";
        }

        if (extractedData.length < 50) {
            extractedData.push({
                id: `TRX-${rowCount}`,
                timestamp: timestamp || "2026-01-02 07:24:21.000",
                stan: stan || `STAN-${Math.floor(Math.random() * 100000)}`,
                merchant: merchant,
                nominal: nominal,
                bankStatus: bankStatus || "SUCCEED",
                artajasaStatus: "SUCCEED",
                reconStatus: modeledReconStatus
            });
        }

        if (rowCount > 20000) break; // Analyze substantial subset

        rowCount++;
    }

    // Multiply to model whole file numbers somewhat (190MB csv is huge, probably millions of rows)
    // Our subset is 20000 rows. Extrapolating for visual scale
    const scale = 20;

    const result = {
        metrics: {
            totalTransactions: totalTransactions * scale,
            settledAmount: settledAmount * scale,
            unsettledAmount: unsettledAmount * scale,
            totalDiscrepancyAmount: totalDiscrepancyAmount * scale
        },
        chartData: [
            { name: "Matched", value: matchCount * scale, color: "#10B981" },
            { name: "Unmatched", value: unmatchCount * scale, color: "#EF4444" },
            { name: "Suspect", value: suspectCount * scale, color: "#F59E0B" }
        ],
        tableData: extractedData
    };

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`Sample data created at ${outputFile}`);
}

processSample().catch(console.error);
