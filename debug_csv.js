import fs from "fs";

// Simple CSV parser simulation since we can't easily import the one from src/utils in node without type:module or babel
// But the logic is simple enough to replicate for debugging
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => {
    // Basic split, doesn't handle quoted commas but likely sufficient for this file
    // The previous tool output showed standard CSV
    return line.split(",");
  });
}

const csvContent = fs.readFileSync("backup/oral.csv", "utf8");
const rows = parseCSV(csvContent);

// Identify header
const headerRowIndex = rows.findIndex((row) =>
  row.some((cell) => cell.includes("순서") || cell.includes("Order")),
);
const dataRows = headerRowIndex !== -1 ? rows.slice(headerRowIndex + 1) : rows;

console.log(`Total Data Rows: ${dataRows.length}`);

// Simulate Current Logic
const existingKeys = new Set();
let addedCount = 0;
let duplicateCount = 0;
const results = [];

dataRows.forEach((row, index) => {
  if (row.length < 3) return;

  const category = row[1] || "";
  const name = row[2] || "";
  const univ = row[3] || "";
  const presenter = row[4] || ""; // Index 4 is Presenter
  const topic = row[6] || "";

  if (!name || !univ) return;

  // CURRENT LOGIC: Name + Univ
  const key = `${name.trim().toLowerCase()}|${univ.trim().toLowerCase()}`;

  if (existingKeys.has(key)) {
    console.log(
      `[DUPLICATE DETECTED] Row ${index + headerRowIndex + 2} (Seq ${row[0]}): ${name} | ${univ} -> SKIPPED`,
    );
    duplicateCount++;
  } else {
    results.push({ seq: row[0], name, univ, presenter });
    existingKeys.add(key);
    addedCount++;
  }
});

console.log(`\n--- SUMMARY ---`);
console.log(`Added: ${addedCount}`);
console.log(`Skipped: ${duplicateCount}`);
console.log(`9th item in result: `, results[8]); // Index 8 is 9th item? No, user said 9th CSV data (Seq 9) is at 6.
console.log(`6th item in result: `, results[5]);
console.log(`Seq 9 expected at: Index 8. Found at: ?`);

const foundSeq9 = results.find((r) => r.seq == "9");
const indexSeq9 = results.indexOf(foundSeq9);
console.log(
  `Item with Seq '9' is at Index: ${indexSeq9} (Position ${indexSeq9 + 1})`,
);
