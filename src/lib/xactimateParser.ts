/**
 * Xactimate Excel export parser.
 *
 * Reads the Xactimate price list export (.xlsx) and extracts price items.
 * Column mapping (0-indexed):
 *   Col 2  (index 2)  — Description
 *   Col 8  (index 8)  — Unit Cost
 *   Col 9  (index 9)  — Unit
 *   Col 28 (index 28) — Category (Cat)
 *   Col 29 (index 29) — Selection (Sel)
 *
 * Generates xactimate_code as `${Cat}/${Sel}` (e.g. "WTR/DRY")
 */

import * as XLSX from "xlsx";

export interface ParsedPriceItem {
  xactimate_code: string;
  name: string;
  unit: string;
  unit_price: number;
}

export interface ParseResult {
  items: ParsedPriceItem[];
  skipped: number;
  errors: string[];
}

export function parseXactimatePriceList(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];

        const items: ParsedPriceItem[] = [];
        const errors: string[] = [];
        let skipped = 0;

        // Skip header row (row 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) { skipped++; continue; }

          const cat = String(row[28] ?? "").trim();
          const sel = String(row[29] ?? "").trim();
          const desc = String(row[2] ?? "").trim();
          const unitCostRaw = row[8];
          const unit = String(row[9] ?? "").trim();

          if (!cat || !sel || !desc) { skipped++; continue; }

          const unitCost = typeof unitCostRaw === "number"
            ? unitCostRaw
            : parseFloat(String(unitCostRaw ?? "0").replace(/[^0-9.-]/g, ""));

          if (isNaN(unitCost) || unitCost < 0) {
            errors.push(`Row ${i + 1}: invalid unit cost "${unitCostRaw}"`);
            skipped++;
            continue;
          }

          items.push({
            xactimate_code: `${cat}/${sel}`,
            name: desc,
            unit: unit || "EA",
            unit_price: Math.round(unitCost * 100) / 100,
          });
        }

        resolve({ items, skipped, errors });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
