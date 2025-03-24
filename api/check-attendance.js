// /api/check-attendance.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { qrData } = req.body;

    try {
      // Google Sheets Authentication
      const auth = new google.auth.GoogleAuth({
        keyFile: "react-native-maps-441406-e96b63a3f845.json", // Replace with your JSON file path
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });

      const sheets = google.sheets({ version: "v4", auth });

      // Sheet Configuration
      const SHEET_ID = "1LG8akyNt1ViNRLVyUuJtssVtFEK9NhywUZMe9bLCjWk";
      const SHEET_NAME = "Sheet1";

      // Step 1: Get Sheet Data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:B`
      });

      let rows = response.data.values;
      if (!rows) {
        return res.status(404).json({ message: "No data found!" });
      }

      // Step 2: Find QR Data in Sheet
      let rowIndex = rows.findIndex(row => row[1] === qrData);
      if (rowIndex === -1) {
        return res.status(404).json({ message: "Guest not found!" });
      }

      rowIndex += 1; // Adjust for Google Sheets row indexing

      // Step 3: Mark Attendance
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!C${rowIndex}`,
        valueInputOption: "RAW",
        resource: { values: [["✅ Present"]] }
      });

      res.status(200).json({ message: `Attendance marked for Row ${rowIndex}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update attendance", details: err.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}