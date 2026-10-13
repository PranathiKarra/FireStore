const XLSX = require("xlsx");
const path = require("path");

const excelPath = path.join(__dirname, "..", "products.xlsx.xlsx");

const workbook = XLSX.readFile(excelPath);

const sheet = workbook.Sheets["Individual Item List"];

console.log("\nSHEET RANGE:");
console.log(sheet["!ref"]);

console.log("\nFIRST 10 ROWS:");
const rows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: "",
});

rows.slice(45, 55).forEach((row, index) => {
  console.log(`Row ${index + 1}:`, row);
});

console.log("\nTOTAL ROWS:");
console.log(rows.length);