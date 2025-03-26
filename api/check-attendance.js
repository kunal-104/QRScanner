require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");

// Secure Environment Variable Handling
const { GOOGLE_CREDENTIALS, SPREADSHEET_ID } = process.env;

if (!GOOGLE_CREDENTIALS || !SPREADSHEET_ID) {
  throw new Error("❌ Missing Google credentials or Spreadsheet ID.");
}

// Secure Authentication Setup
const credentials = JSON.parse(GOOGLE_CREDENTIALS);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// Fetch stored names on demand
async function fetchStoredNames() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:A",
    });

    return res.data.values ? res.data.values.flat() : [];
  } catch (error) {
    console.error("❌ Error fetching stored names:", error);
    return [];
  }
}

// 🔹 Check if Attendance is Already Marked
async function isAttendanceMarked(rowIndex) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!B${rowIndex}`,
    });

    return res.data.values && res.data.values[0][0] === "✅ Present";
  } catch (error) {
    console.error("❌ Error checking attendance:", error);
    return false;
  }
}

// 🔹 Mark Attendance in Google Sheets
async function markAttendance(rowIndex) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!B${rowIndex}`,
      valueInputOption: "RAW",
      resource: { values: [["✅ Present"]] },
    });

    console.log(`✅ Attendance marked for Row ${rowIndex}`);
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
  }
}

// 🔹 API Endpoint for Vercel
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { qrData } = req.body;
  console.log(`🔍 Scanned QR Code: ${qrData}`);

  const storedNames = await fetchStoredNames();
  const rowIndex = storedNames.indexOf(qrData) + 1; // Adjust for header row

  if (!rowIndex) {
    return res.json({ success: false, message: "❌ Name not found. Please register." });
  }

  if (await isAttendanceMarked(rowIndex)) {
    return res.json({ success: false, message: "⚠️ QR already scanned!" });
  }

  await markAttendance(rowIndex);
  return res.json({ success: true, message: `✅ Attendance marked for ${qrData}` });
};
