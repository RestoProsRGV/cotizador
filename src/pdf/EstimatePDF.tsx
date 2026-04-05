/**
 * EstimatePDF — React-PDF document for the estimate.
 * Rendered server-side or in-browser via @react-pdf/renderer.
 *
 * Layout:
 *   Header: RestoPros logo (RP circle) right, client info left
 *   Estimate ID + date
 *   Line items grouped by module with subtotals
 *   Grand total
 *   Footer: contact info + validity note
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register Inter — fallback to Helvetica if not available
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

// RestoPros brand blue
const BLUE = "#2196F3";
const DARK = "#2C3E50";
const GRAY = "#8E8E93";
const BORDER = "#E0E0E0";
const TEXT = "#1A1A1A";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    color: TEXT,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    backgroundColor: "#FFFFFF",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  companyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 700,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
    color: BLUE,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 700,
    color: DARK,
    marginBottom: 2,
  },
  clientAddress: {
    fontSize: 9,
    color: GRAY,
  },
  // Metadata row
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  metaLabel: { fontSize: 8, color: GRAY, marginBottom: 2 },
  metaValue: { fontSize: 9, fontWeight: 600, color: TEXT },
  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "#F5F5F5",
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionSubtotal: { fontSize: 8, fontWeight: 600, color: DARK },
  // Line items
  itemRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  itemName: { flex: 1, fontSize: 9, color: TEXT },
  itemQty: { width: 36, fontSize: 9, textAlign: "right", color: GRAY },
  itemUnit: { width: 28, fontSize: 9, textAlign: "right", color: GRAY },
  itemPrice: { width: 44, fontSize: 9, textAlign: "right", color: GRAY },
  itemTotal: { width: 52, fontSize: 9, textAlign: "right", fontWeight: 600, color: TEXT },
  // Column headers
  colHeaders: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAFAFA",
  },
  colHeader: { fontSize: 7, color: GRAY, textTransform: "uppercase" },
  // Grand total
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderColor: DARK,
  },
  totalLabel: { fontSize: 12, fontWeight: 700, color: DARK },
  totalAmount: { fontSize: 16, fontWeight: 700, color: BLUE },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: GRAY },
});

export interface PDFLineItem {
  id: string;
  module: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface EstimatePDFProps {
  estimateId: string;
  clientName: string;
  jobAddress: string;
  createdAt: string;
  jobType: string;
  category: string | null;
  lineItems: PDFLineItem[];
  /** Base64 PNG data URL of customer signature, if signed */
  customerSignatureUrl?: string | null;
  /** ISO timestamp of approval */
  approvedAt?: string | null;
}

const MODULE_LABELS: Record<string, string> = {
  GEN:  "General",
  PREP: "Prep Work",
  DEM:  "Demolition",
  CLN:  "Cleaning",
  EQP:  "Equipment",
  WTR:  "Water",
  DEB:  "Debris",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shortId(id: string): string {
  return `EST-${id.slice(0, 6).toUpperCase()}`;
}

const MODULE_DISPLAY_ORDER = ["GEN", "PREP", "DEM", "CLN", "EQP"];

export function EstimatePDF({
  estimateId,
  clientName,
  jobAddress,
  createdAt,
  jobType,
  category,
  lineItems,
  customerSignatureUrl,
  approvedAt,
}: EstimatePDFProps) {
  // Group by module in display order; WTR merged into GEN
  const byMod: Record<string, PDFLineItem[]> = {};
  for (const item of lineItems) {
    const key = item.module === "WTR" ? "GEN" : item.module;
    if (!byMod[key]) byMod[key] = [];
    byMod[key].push(item);
  }
  const grouped = MODULE_DISPLAY_ORDER
    .filter((m) => byMod[m] !== undefined)
    .map((mod) => ({
      module: mod,
      label: MODULE_LABELS[mod] ?? mod,
      items: byMod[mod] ?? [],
    }));

  const grandTotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const jobLabel = category
    ? `Water — ${category.toUpperCase().replace("CAT", "Cat ")}`
    : jobType.charAt(0).toUpperCase() + jobType.slice(1);

  return (
    <Document
      title={`Estimate ${shortId(estimateId)} — ${clientName}`}
      author="RestoPros"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>RestoPros</Text>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.clientAddress}>{jobAddress}</Text>
          </View>
          <View style={styles.companyCircle}>
            <Text style={styles.companyInitials}>RP</Text>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>ESTIMATE #</Text>
            <Text style={styles.metaValue}>{shortId(estimateId)}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>{formatDate(createdAt)}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>JOB TYPE</Text>
            <Text style={styles.metaValue}>{jobLabel}</Text>
          </View>
        </View>

        {/* Column headers */}
        <View style={styles.colHeaders}>
          <Text style={[styles.colHeader, { flex: 1 }]}>Description</Text>
          <Text style={[styles.colHeader, { width: 36, textAlign: "right" }]}>Qty</Text>
          <Text style={[styles.colHeader, { width: 28, textAlign: "right" }]}>Unit</Text>
          <Text style={[styles.colHeader, { width: 44, textAlign: "right" }]}>Unit $</Text>
          <Text style={[styles.colHeader, { width: 52, textAlign: "right" }]}>Total</Text>
        </View>

        {/* Line items by module */}
        {grouped.map(({ module, label, items }) => {
          const subtotal = items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
          );
          return (
            <View key={module} wrap={false}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{label}</Text>
                <Text style={styles.sectionSubtotal}>${fmt(subtotal)}</Text>
              </View>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity}</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                  <Text style={styles.itemPrice}>${fmt(item.unit_price)}</Text>
                  <Text style={styles.itemTotal}>${fmt(item.quantity * item.unit_price)}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Grand total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${fmt(grandTotal)}</Text>
        </View>

        {/* Signature section */}
        {customerSignatureUrl ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 8, color: GRAY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Customer Signature
            </Text>
            {/* react-pdf Image accepts base64 data URLs */}
            <Image src={customerSignatureUrl as string} style={{ height: 60 }} />
            {approvedAt && (
              <Text style={{ fontSize: 7, color: GRAY, marginTop: 4 }}>
                Approved on {formatDate(approvedAt)}
              </Text>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 24 }}>
            <View style={{ borderTopWidth: 1, borderColor: BORDER, width: "50%", paddingTop: 6 }}>
              <Text style={{ fontSize: 7, color: GRAY }}>Approved by: ___________________________</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            RestoPros · McAllen, TX · restoprosrgv@gmail.com
          </Text>
          <Text style={styles.footerText}>
            This estimate is valid for 14 days.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
