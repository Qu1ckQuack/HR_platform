"use client";

import { useState, type RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export type ExportPdfButtonProps = {
  targetRef: RefObject<HTMLElement | null>;
  filename?: string;
  label?: string;
  className?: string;
  orientation?: "portrait" | "landscape";
};

export async function exportToPDF(
  element: HTMLElement,
  filename: string = "export.pdf",
  orientation: "portrait" | "landscape" = "landscape"
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const { default: jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 1,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const printWidth = pageWidth - margin * 2;
  const printHeight = (canvas.height * printWidth) / canvas.width;
  const maxPageContentHeight = pageHeight - margin * 2;

  let remainingHeight = printHeight;
  let currentY = margin;

  pdf.addImage(imgData, "JPEG", margin, currentY, printWidth, printHeight);
  remainingHeight -= maxPageContentHeight;

  while (remainingHeight > 0) {
    currentY -= maxPageContentHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, currentY, printWidth, printHeight);
    remainingHeight -= maxPageContentHeight;
  }

  pdf.save(filename);
}

export function useExportTable({
  targetRef,
  filename = "export.pdf",
  orientation = "landscape",
}: {
  targetRef: RefObject<HTMLElement | null>;
  filename?: string;
  orientation?: "portrait" | "landscape";
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = targetRef.current;

    if (!element) {
      window.alert("ไม่พบข้อมูลสำหรับส่งออก");
      return;
    }

    try {
      setIsExporting(true);
      await exportToPDF(element, filename, orientation);
    } catch (error) {
      console.error("Export PDF error:", error);
      window.alert("ไม่สามารถส่งออกไฟล์ PDF ได้");
    } finally {
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting, exportToPDF };
}

export function ExportPdfButton({
  targetRef,
  filename = "employee-report.pdf",
  label = "ส่งออก",
  className = "min-h-11 rounded-md border border-gray-400 px-3 text-sm cursor-pointer hover:cursor-pointer disabled:opacity-60",
  orientation = "landscape",
}: ExportPdfButtonProps) {
  const { handleExport, isExporting } = useExportTable({
    targetRef,
    filename,
    orientation,
  });

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      <FontAwesomeIcon icon={faDownload} className="mr-1 h-4 w-4" />
      {label}
    </button>
  );
}

export default ExportPdfButton;