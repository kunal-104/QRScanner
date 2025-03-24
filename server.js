const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// 🔹 Google Sheets Authentication
const auth = new google.auth.GoogleAuth({
    keyFile: "react-native-maps-441406-e96b63a3f845.json", // Replace with your JSON file path
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});
const sheets = google.sheets({ version: "v4", auth });

// Google Sheet ID & Sheet Name
const SHEET_ID = "1LG8akyNt1ViNRLVyUuJtssVtFEK9NhywUZMe9bLCjWk"; // Replace with your actual Google Sheet ID
const SHEET_NAME = "Sheet1"; // Change if needed

// 🔹 API to Check QR Code & Mark Attendance
app.post("/check-attendance", async (req, res) => {
    const { qrData } = req.body;

    try {
        // Step 1: Get Sheet Data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:B` // Adjust column range as needed
        });

        let rows = response.data.values;
        if (!rows) return res.json({ message: "No data found!" });

        // Step 2: Find QR Data in Sheet
        let rowIndex = rows.findIndex(row => row[1] === qrData);
        if (rowIndex === -1) return res.json({ message: "Guest not found!" });

        rowIndex += 1; // Adjust for Google Sheets row indexing

        // Step 3: Mark Attendance ✅
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!C${rowIndex}`,
            valueInputOption: "RAW",
            resource: { values: [["✅ Present"]] }
        });

        res.json({ message: `Attendance marked for Row ${rowIndex}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update attendance" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
