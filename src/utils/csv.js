/**
 * Robust CSV Parsing Utility
 * Handles quoted fields, escaped quotes, and newlines within quotes.
 */

export const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let insideQuotes = false;

  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote ("") -> actual quote (")
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (char === "\n" && !insideQuotes) {
      // End of row
      currentRow.push(currentField.trim());
      if (currentRow.length > 0 && currentRow.some((f) => f)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // Add last field/row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 0 && currentRow.some((f) => f)) {
      rows.push(currentRow);
    }
  }

  return rows;
};
