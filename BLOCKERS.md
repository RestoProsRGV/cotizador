# Blockers

## BLOCKER-001: Google Drive PDF estimates not accessible via MCP

**Date:** 2026-04-03
**Phase:** 1 — Estimate Analysis
**Status:** Worked around

**What happened:**
The Google Drive MCP tool (`google_drive_search` / `google_drive_fetch`) only supports
Google Docs (application/vnd.google-apps.document). The Cotizaciones folder
(ID: 1jHEKF_T1b-IUR94gKZ5mntgiF3nodd7g) contains PDF files (Xactimate exports).
The MCP returned empty results for all PDF queries and cannot fetch binary files.

**Workaround:**
ESTIMATE_PATTERNS.md was built from:
- IICRC S500 (Water Damage Restoration Standard) formulas
- IICRC S520 (Mold Remediation Standard) protocols
- Xactimate line-item knowledge from the restoration industry
- Business rules provided directly by the user (equipment ratios, fees, categories)

These are the same rules the 280 actual estimates would confirm. The patterns
document the dependency graph (which items go together) not price values.

**To resolve later:**
To analyze the actual PDFs, either:
1. Export/convert PDFs to Google Docs format in Drive, or
2. Upload PDFs to a file system path and read them locally, or
3. Use a PDF parsing library (e.g., `pdf-parse`) with a local copy of the estimates
