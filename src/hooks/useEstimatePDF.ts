/**
 * useEstimatePDF — fetches estimate data and triggers PDF download.
 * Used from the Total screen's "Download PDF" button.
 */
import { useState } from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import { supabase } from "@/lib/supabase";
import { EstimatePDF, type PDFLineItem } from "@/pdf/EstimatePDF";

export function useEstimatePDF(estimateId: string) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadPDF() {
    setGenerating(true);
    setError(null);

    try {
      // Fetch estimate
      const { data: estimate, error: estErr } = await supabase
        .from("estimates")
        .select("id, client_name, job_address, job_type, category, created_at")
        .eq("id", estimateId)
        .single();
      if (estErr || !estimate) throw new Error("Estimate not found");

      // Fetch line items
      const { data: items, error: itemsErr } = await supabase
        .from("line_items")
        .select("id, module, name, quantity, unit, unit_price")
        .eq("estimate_id", estimateId)
        .order("sort_order");
      if (itemsErr) throw new Error("Could not load line items");

      // Generate PDF blob
      const props = {
        estimateId: estimate.id,
        clientName: estimate.client_name,
        jobAddress: estimate.job_address,
        createdAt: estimate.created_at,
        jobType: estimate.job_type,
        category: estimate.category,
        lineItems: (items ?? []) as PDFLineItem[],
      };
      const element = React.createElement(
        EstimatePDF,
        props,
      ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

      const blob = await pdf(element).toBlob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimate-${estimateId.slice(0, 6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  return { downloadPDF, generating, error };
}
