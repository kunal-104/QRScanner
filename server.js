require('dotenv').config({ path: '.env.local' });
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());

// Secure Environment Variable Handling
const {
  GOOGLE_CREDENTIALS,
  SPREADSHEET_ID,
  GOOGLE_API_KEY
} = process.env;

// Validate Environment Variables
if (!GOOGLE_CREDENTIALS) {
  console.error("❌ GOOGLE_CREDENTIALS not set");
  process.exit(1);
}

if (!SPREADSHEET_ID) {
  console.error("❌ SPREADSHEET_ID not set");
  process.exit(1);
}

if (!GOOGLE_API_KEY) {
  console.error("❌ GOOGLE_API_KEY not set");
  process.exit(1);
}

// Secure Authentication Setup
let auth;
try {
  const credentials = JSON.parse(GOOGLE_CREDENTIALS);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
} catch (error) {
  console.error("❌ Error parsing Google Credentials:", error);
  process.exit(1);
}

const sheets = google.sheets({ version: "v4", auth });

let storedNames = [];

// Async function with proper error handling
async function fetchStoredNames() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:A?key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.values && data.values.length > 0) {
        storedNames = data.values.flat(); // Store names in an array
        console.log("✅ Stored Names:", storedNames);
      return storedNames;
    } else {
      console.log("❌ No data found in column A.");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching stored names:", error);
    return [];
  }
}

// Fetch names on server startup
fetchStoredNames();

async function getGuests() {
    console.log("inside getguests func in server.js");
const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1?key=${GOOGLE_API_KEY}`;
const response = await fetch(url);
const data = await response.json();
console.log(data.values);  // Logs all rows from Google Sheets
}

getGuests();



// 🔹 Function to Get Row Number from Stored Data
function getRowNumber(name) {
    const rowIndex = storedNames.indexOf(name);
    return rowIndex !== -1 ? rowIndex + 1 : null; // Adjust for header row
}

// 🔹 Check if Attendance is Already Marked
async function isAttendanceMarked(rowIndex) {
    try {
        const RANGE = `Sheet1!B${rowIndex}`; // Column B (Attendance)
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        return data.values && data.values[0] && data.values[0][0] === "✅ Present";
    } catch (error) {
        console.error("❌ Error checking attendance:", error);
        return false;
    }
}

// 🔹 Mark Attendance in Google Sheets
async function markAttendance(rowIndex) {
    try {
        const RANGE = `Sheet1!B${rowIndex}`; // Column B for attendance
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
            valueInputOption: "RAW",
            resource: { values: [["✅ Present"]] }
        });

        console.log(`✅ Attendance marked for Row ${rowIndex}`);
    } catch (error) {
        console.error("❌ Error marking attendance:", error);
    }
}

// 🔹 API to Check QR Code & Mark Attendance
app.post("/api/check-attendance", async (req, res) => {
    const { qrData } = req.body;

    console.log(`🔍 Scanned QR Code: ${qrData}`);
    
    const rowIndex = getRowNumber(qrData);
    if (!rowIndex) {
        return res.json({ success: false, message: "❌ Name not found. Please register." });
    }

    const alreadyMarked = await isAttendanceMarked(rowIndex);
    if (alreadyMarked) {
        return res.json({ success: false, message: "⚠️ QR is already scanned! For entry, you need to register." });
    }

    await markAttendance(rowIndex);
    return res.json({ success: true, message: `✅ Attendance marked for ${qrData}` });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));









// const express = require("express");
// const bodyParser = require("body-parser");
// const { google } = require("googleapis");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// app.use(express.static("public"));
// app.use(bodyParser.json());

// // 🔹 Google Sheets Authentication
// const auth = new google.auth.GoogleAuth({
//     keyFile: "react-native-maps-441406-2c68e22d50ce.json", // Replace with your JSON file path
//     scopes: ["https://www.googleapis.com/auth/spreadsheets"]
// });
// const sheets = google.sheets({ version: "v4", auth });

// // Google Sheet ID & Sheet Name
// const API_KEY = "AIzaSyCACmA9NwFINrLSw7F6mo1P8PJzVdswIPA";  // Replace with your API Key
// // const SHEET_NAME = "Sheet1"; // Change if needed


// // const QUERY_RANGE = "Sheet1!A:B"; // Adjust as needed
// const SPREADSHEET_ID = "1LG8akyNt1ViNRLVyUuJtssVtFEK9NhywUZMe9bLCjWk";

// // 🔹 Store Names from Column A on Server Startup
// let storedNames = [];


// async function getGuests() {
//     console.log("inside getguests func in server.js");
// const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1?key=${API_KEY}`;
// const response = await fetch(url);
// const data = await response.json();
// console.log(data.values);  // Logs all rows from Google Sheets
// }

// // getGuests();







// // Google Sheets API
// async function updateAttendance(rowIndex) {
//     const sheets = google.sheets({ version: "v4", auth });
//     const RANGE = `Sheet1!C${rowIndex}`; // Column C for attendance

//     await sheets.spreadsheets.values.update({
//         spreadsheetId: SPREADSHEET_ID,
//         range: RANGE,
//         valueInputOption: "RAW",
//         resource: { values: [["✅ Present"]] }
//     });

//     console.log(`Attendance marked for Row ${rowIndex}`);
// }

// // Example: Mark attendance in row 5


// async function findNameRowNumber(name) {
//     try {
//         const query = encodeURIComponent(`SELECT A`);
//         const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tq=${query}&sheet=Sheet1`;

//         const response = await fetch(url);
//         const text = await response.text();
//         console.log(text); // Debug response

//         const jsonData = JSON.parse(text.substring(47, text.length - 2)); // Google Sheets adds extra characters

//         if (!jsonData.table || !jsonData.table.rows || jsonData.table.rows.length === 0) {
//             console.log(`❌ Sheet is empty or not accessible.`);
//             return null;
//         }

//         // Extract column A values into an array
//         const namesArray = jsonData.table.rows.map(row => row.c[0]?.v || null).filter(v => v !== null);
        
//         console.log("🔍 Names in column A:", namesArray); // Debug log

//         // Find the index of the matching name
//         const rowIndex = namesArray.indexOf(name);
//         if (rowIndex === -1) {
//             console.log(`❌ Name '${name}' not found.`);
//             return null;
//         }

//         const rowNumber = rowIndex + 1; // Adjusting for header row
//         console.log(`✅ Found '${name}' at row number: ${rowNumber}`);
//         updateAttendance(rowNumber);
//         return rowNumber;
//     } catch (error) {
//         console.error("❌ Error fetching row number:", error);
//         return null;
//     }
// }







// // 🔹 API to Check QR Code & Mark Attendance
// app.post("/api/check-attendance", async (req, res) => {
//     // console.log("we get into the check attendance area ");
//     const { qrData } = req.body;
//     // console.log("qrData: ",qrData);

//     findNameRowNumber(qrData);

// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
