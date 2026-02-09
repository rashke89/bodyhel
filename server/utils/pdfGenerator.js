const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const QRCode = require("qrcode");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

const COLORS = {
  primary: rgb(0.173, 0.412, 0.459), // #2C6975
  accent: rgb(0.42, 0.698, 0.627), // #6BB2A0
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.85, 0.85, 0.85),
  red: rgb(0.8, 0.1, 0.1),
  green: rgb(0.1, 0.6, 0.1),
  yellow: rgb(0.7, 0.55, 0.0),
};

function drawHeader(page, font, fontBold) {
  const width = page.getWidth();
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText("BodyHel", {
    x: MARGIN,
    y,
    size: 22,
    font: fontBold,
    color: COLORS.primary,
  });
  y -= 16;
  page.drawText("Republika Srbija", { x: MARGIN, y, size: 9, font, color: COLORS.gray });
  y -= 12;
  page.drawText("Zdravstvena ustanova BodyHel", { x: MARGIN, y, size: 9, font, color: COLORS.gray });
  y -= 10;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1,
    color: COLORS.primary,
  });

  return y - 15;
}

function drawFooter(page, font, pageNum) {
  const width = page.getWidth();
  const y = 30;
  const dateStr = new Date().toLocaleDateString("sr-RS");

  page.drawLine({
    start: { x: MARGIN, y: y + 10 },
    end: { x: width - MARGIN, y: y + 10 },
    thickness: 0.5,
    color: COLORS.lightGray,
  });

  page.drawText(`Generisano: ${dateStr}`, { x: MARGIN, y, size: 8, font, color: COLORS.gray });
  const pageText = `Strana ${pageNum}`;
  const pageTextWidth = font.widthOfTextAtSize(pageText, 8);
  page.drawText(pageText, { x: width - MARGIN - pageTextWidth, y, size: 8, font, color: COLORS.gray });
}

function drawSectionTitle(page, fontBold, text, y) {
  page.drawText(text, { x: MARGIN, y, size: 12, font: fontBold, color: COLORS.primary });
  return y - 18;
}

function drawLabelValue(page, font, fontBold, label, value, x, y, maxWidth) {
  page.drawText(`${label}: `, { x, y, size: 10, font: fontBold, color: COLORS.gray });
  const labelWidth = fontBold.widthOfTextAtSize(`${label}: `, 10);
  const val = String(value || "-");
  page.drawText(val, { x: x + labelWidth, y, size: 10, font, color: COLORS.black, maxWidth: maxWidth ? maxWidth - labelWidth : undefined });
  return y - 15;
}

// =========================================
// Prescription PDF
// =========================================
async function generatePrescriptionPDF(prescription) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawHeader(page, font, fontBold);

  // QR Code
  if (prescription.ePrescriptionId) {
    try {
      const qrDataUrl = await QRCode.toDataURL(prescription.ePrescriptionId, { width: 100, margin: 1 });
      const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      page.drawImage(qrImage, { x: PAGE_WIDTH - MARGIN - 90, y: y - 70, width: 80, height: 80 });
    } catch (e) {
      // QR generation failed, continue without it
    }
  }

  // Title
  const titleText = "RECEPT";
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 20);
  page.drawText(titleText, {
    x: (PAGE_WIDTH - titleWidth) / 2,
    y,
    size: 20,
    font: fontBold,
    color: COLORS.primary,
  });
  y -= 35;

  // e-Recept ID
  if (prescription.ePrescriptionId) {
    const idText = `e-Recept: ${prescription.ePrescriptionId}`;
    const idWidth = font.widthOfTextAtSize(idText, 9);
    page.drawText(idText, { x: (PAGE_WIDTH - idWidth) / 2, y, size: 9, font, color: COLORS.gray });
    y -= 25;
  }

  // Patient
  const patient = prescription.patient || {};
  y = drawSectionTitle(page, fontBold, "PACIJENT", y);
  y = drawLabelValue(page, font, fontBold, "Ime i prezime", `${patient.firstName || ""} ${patient.lastName || ""}`, MARGIN, y);
  if (patient.patientId) {
    y = drawLabelValue(page, font, fontBold, "ID pacijenta", patient.patientId, MARGIN, y);
  }
  if (patient.dateOfBirth) {
    y = drawLabelValue(page, font, fontBold, "Datum rodjenja", new Date(patient.dateOfBirth).toLocaleDateString("sr-RS"), MARGIN, y);
  }
  y -= 10;

  // Doctor
  const doctor = prescription.doctor || {};
  y = drawSectionTitle(page, fontBold, "DOKTOR", y);
  y = drawLabelValue(page, font, fontBold, "Ime i prezime", `${doctor.firstName || ""} ${doctor.lastName || ""}`, MARGIN, y);
  if (doctor.specialization) {
    y = drawLabelValue(page, font, fontBold, "Specijalizacija", doctor.specialization, MARGIN, y);
  }
  if (doctor.licenseNumber) {
    y = drawLabelValue(page, font, fontBold, "Broj licence", doctor.licenseNumber, MARGIN, y);
  }
  y -= 10;

  // Diagnosis
  if (prescription.diagnosis && (prescription.diagnosis.code || prescription.diagnosis.description)) {
    y = drawSectionTitle(page, fontBold, "DIJAGNOZA", y);
    const diagText = [prescription.diagnosis.code, prescription.diagnosis.description].filter(Boolean).join(" - ");
    y = drawLabelValue(page, font, fontBold, "Dijagnoza", diagText, MARGIN, y, CONTENT_WIDTH);
    y -= 10;
  }

  // Medications table
  y = drawSectionTitle(page, fontBold, "LEKOVI", y);

  const cols = [
    { label: "Lek", x: MARGIN, w: 120 },
    { label: "Doza", x: MARGIN + 125, w: 70 },
    { label: "Ucestalost", x: MARGIN + 200, w: 90 },
    { label: "Trajanje", x: MARGIN + 295, w: 80 },
    { label: "Uputstvo", x: MARGIN + 380, w: 115 },
  ];

  // Table header
  page.drawRectangle({ x: MARGIN, y: y - 3, width: CONTENT_WIDTH, height: 16, color: rgb(0.94, 0.94, 0.94) });
  cols.forEach((col) => {
    page.drawText(col.label, { x: col.x + 3, y: y, size: 8, font: fontBold, color: COLORS.primary });
  });
  y -= 18;

  // Table rows
  const medications = prescription.medications || [];
  for (const med of medications) {
    if (y < 80) {
      drawFooter(page, font, pdfDoc.getPageCount());
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = drawHeader(page, font, fontBold);
    }

    page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 10 }, thickness: 0.5, color: COLORS.lightGray });

    const dose = med.dosage ? `${med.dosage.amount || ""} ${med.dosage.unit || ""}`.trim() : "-";

    page.drawText(truncate(med.name || "-", 18), { x: cols[0].x + 3, y, size: 9, font, color: COLORS.black });
    page.drawText(truncate(dose, 10), { x: cols[1].x + 3, y, size: 9, font, color: COLORS.black });
    page.drawText(truncate(med.frequency || "-", 13), { x: cols[2].x + 3, y, size: 9, font, color: COLORS.black });
    page.drawText(truncate(med.duration || "-", 11), { x: cols[3].x + 3, y, size: 9, font, color: COLORS.black });
    page.drawText(truncate(med.instructions || "-", 16), { x: cols[4].x + 3, y, size: 9, font, color: COLORS.black });

    y -= 16;
  }
  y -= 10;

  // Notes
  if (prescription.notes) {
    y = drawSectionTitle(page, fontBold, "NAPOMENA", y);
    page.drawText(truncate(prescription.notes, 200), { x: MARGIN, y, size: 10, font, color: COLORS.black, maxWidth: CONTENT_WIDTH });
    y -= 20;
  }

  // Issue date
  y -= 10;
  const issueDateStr = prescription.issueDate ? new Date(prescription.issueDate).toLocaleDateString("sr-RS") : "-";
  y = drawLabelValue(page, font, fontBold, "Datum izdavanja", issueDateStr, MARGIN, y);

  drawFooter(page, font, pdfDoc.getPageCount());
  return pdfDoc.save();
}

// =========================================
// Lab Result PDF
// =========================================
async function generateLabResultPDF(labResult) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawHeader(page, font, fontBold);

  // Title
  const titleText = "LABORATORIJSKI NALAZ";
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 18);
  page.drawText(titleText, { x: (PAGE_WIDTH - titleWidth) / 2, y, size: 18, font: fontBold, color: COLORS.primary });
  y -= 30;

  // Order info
  if (labResult.orderNumber) {
    y = drawLabelValue(page, font, fontBold, "Broj nalaza", labResult.orderNumber, MARGIN, y);
  }
  y = drawLabelValue(page, font, fontBold, "Naziv testa", labResult.testName || "-", MARGIN, y);
  y = drawLabelValue(page, font, fontBold, "Tip testa", labResult.testType || "-", MARGIN, y);
  y -= 5;

  // Patient
  const patient = labResult.patient || {};
  y = drawSectionTitle(page, fontBold, "PACIJENT", y);
  y = drawLabelValue(page, font, fontBold, "Ime i prezime", `${patient.firstName || ""} ${patient.lastName || ""}`, MARGIN, y);
  if (patient.patientId) {
    y = drawLabelValue(page, font, fontBold, "ID pacijenta", patient.patientId, MARGIN, y);
  }
  y -= 5;

  // Doctor
  const orderedBy = labResult.orderedBy || {};
  y = drawLabelValue(page, font, fontBold, "Narucio", `${orderedBy.firstName || ""} ${orderedBy.lastName || ""}`, MARGIN, y);
  if (labResult.orderedDate) {
    y = drawLabelValue(page, font, fontBold, "Datum narucivanja", new Date(labResult.orderedDate).toLocaleDateString("sr-RS"), MARGIN, y);
  }
  if (labResult.resultDate) {
    y = drawLabelValue(page, font, fontBold, "Datum rezultata", new Date(labResult.resultDate).toLocaleDateString("sr-RS"), MARGIN, y);
  }
  y -= 10;

  // Results table
  const results = labResult.results || [];
  if (results.length > 0) {
    y = drawSectionTitle(page, fontBold, "REZULTATI", y);

    const resCols = [
      { label: "Parametar", x: MARGIN, w: 140 },
      { label: "Vrednost", x: MARGIN + 145, w: 80 },
      { label: "Jedinica", x: MARGIN + 230, w: 70 },
      { label: "Ref. opseg", x: MARGIN + 305, w: 100 },
      { label: "Status", x: MARGIN + 410, w: 85 },
    ];

    // Table header
    page.drawRectangle({ x: MARGIN, y: y - 3, width: CONTENT_WIDTH, height: 16, color: rgb(0.94, 0.94, 0.94) });
    resCols.forEach((col) => {
      page.drawText(col.label, { x: col.x + 3, y, size: 8, font: fontBold, color: COLORS.primary });
    });
    y -= 18;

    for (const result of results) {
      if (y < 80) {
        drawFooter(page, font, pdfDoc.getPageCount());
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = drawHeader(page, font, fontBold);
      }

      page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 10 }, thickness: 0.5, color: COLORS.lightGray });

      const flagColor =
        result.flag === "critical" || result.flag === "high"
          ? COLORS.red
          : result.flag === "low"
          ? COLORS.yellow
          : COLORS.green;

      const flagLabel =
        result.flag === "normal" ? "Normalan" : result.flag === "high" ? "Visok" : result.flag === "low" ? "Nizak" : result.flag === "critical" ? "Kritican" : result.flag || "-";

      page.drawText(truncate(result.parameter || "-", 20), { x: resCols[0].x + 3, y, size: 9, font, color: COLORS.black });
      page.drawText(truncate(String(result.value ?? "-"), 11), { x: resCols[1].x + 3, y, size: 9, font, color: COLORS.black });
      page.drawText(truncate(result.unit || "-", 10), { x: resCols[2].x + 3, y, size: 9, font, color: COLORS.black });
      page.drawText(truncate(result.referenceRange || "-", 14), { x: resCols[3].x + 3, y, size: 9, font, color: COLORS.black });
      page.drawText(flagLabel, { x: resCols[4].x + 3, y, size: 9, font: fontBold, color: flagColor });

      y -= 16;
    }
    y -= 10;
  }

  // Findings
  if (labResult.findings) {
    y = drawSectionTitle(page, fontBold, "NALAZ", y);
    page.drawText(truncate(labResult.findings, 500), { x: MARGIN, y, size: 10, font, color: COLORS.black, maxWidth: CONTENT_WIDTH, lineHeight: 14 });
    y -= Math.min(labResult.findings.length / 4, 60) + 15;
  }

  // Interpretation
  if (labResult.interpretation) {
    y = drawSectionTitle(page, fontBold, "INTERPRETACIJA", y);
    page.drawText(truncate(labResult.interpretation, 500), { x: MARGIN, y, size: 10, font, color: COLORS.black, maxWidth: CONTENT_WIDTH, lineHeight: 14 });
    y -= 20;
  }

  // Reviewed by
  if (labResult.reviewedBy) {
    y -= 10;
    const reviewer = labResult.reviewedBy;
    y = drawLabelValue(page, font, fontBold, "Pregledao", `${reviewer.firstName || ""} ${reviewer.lastName || ""}`, MARGIN, y);
    if (labResult.reviewedAt) {
      y = drawLabelValue(page, font, fontBold, "Datum pregleda", new Date(labResult.reviewedAt).toLocaleDateString("sr-RS"), MARGIN, y);
    }
  }

  drawFooter(page, font, pdfDoc.getPageCount());
  return pdfDoc.save();
}

// =========================================
// Report PDF
// =========================================
async function generateReportPDF(reportData, reportType) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawHeader(page, font, fontBold);

  const typeLabels = {
    appointments: "PREGLEDI",
    prescriptions: "RECEPTI",
    "lab-results": "LAB REZULTATI",
    demographics: "DEMOGRAFIJA",
  };

  // Title
  const titleText = `IZVESTAJ - ${typeLabels[reportType] || reportType.toUpperCase()}`;
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 18);
  page.drawText(titleText, { x: (PAGE_WIDTH - titleWidth) / 2, y, size: 18, font: fontBold, color: COLORS.primary });
  y -= 25;

  // Period
  if (reportData.startDate || reportData.endDate) {
    const startStr = reportData.startDate ? new Date(reportData.startDate).toLocaleDateString("sr-RS") : "-";
    const endStr = reportData.endDate ? new Date(reportData.endDate).toLocaleDateString("sr-RS") : "-";
    const periodText = `Period: ${startStr} - ${endStr}`;
    const periodWidth = font.widthOfTextAtSize(periodText, 10);
    page.drawText(periodText, { x: (PAGE_WIDTH - periodWidth) / 2, y, size: 10, font, color: COLORS.gray });
    y -= 25;
  }

  // Statistics
  const stats = reportData.statistics || reportData;

  function renderStats(obj, indent) {
    for (const [key, value] of Object.entries(obj)) {
      if (y < 80) {
        drawFooter(page, font, pdfDoc.getPageCount());
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = drawHeader(page, font, fontBold);
      }

      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        // Section header
        y -= 5;
        page.drawText(formatKey(key), { x: MARGIN + indent, y, size: 11, font: fontBold, color: COLORS.primary });
        y -= 16;
        renderStats(value, indent + 15);
      } else {
        // Key-value pair
        const label = formatKey(key);
        page.drawText(`${label}:`, { x: MARGIN + indent, y, size: 10, font: fontBold, color: COLORS.gray });
        const labelW = fontBold.widthOfTextAtSize(`${label}: `, 10);
        page.drawText(String(value ?? "-"), { x: MARGIN + indent + labelW, y, size: 10, font, color: COLORS.black });
        y -= 15;
      }
    }
  }

  renderStats(stats, 0);

  drawFooter(page, font, pdfDoc.getPageCount());
  return pdfDoc.save();
}

// =========================================
// Helpers
// =========================================
function truncate(str, maxLen) {
  if (!str) return "-";
  str = String(str);
  return str.length > maxLen ? str.substring(0, maxLen - 2) + ".." : str;
}

function formatKey(key) {
  const labels = {
    total: "Ukupno",
    byStatus: "Po statusu",
    byType: "Po tipu",
    byDoctor: "Po doktoru",
    dailyCount: "Dnevni pregled",
    byGender: "Po polu",
    byAgeGroup: "Po starosnoj grupi",
    byCity: "Po gradu",
    medicationsPrescribed: "Propisani lekovi",
    pending: "Na cekanju",
    completed: "Zavrseni",
    male: "Muski",
    female: "Zenski",
    other: "Ostalo",
    scheduled: "Zakazano",
    confirmed: "Potvrdeno",
    cancelled: "Otkazano",
    "in-progress": "U toku",
    "no-show": "Nije dosao",
    active: "Aktivno",
    expired: "Isteklo",
    ordered: "Naruceno",
    collected: "Prikupljeno",
    consultation: "Konsultacija",
    checkup: "Pregled",
    systematic: "Sistematski",
    dental: "Stomatologija",
    emergency: "Hitno",
    telemedicine: "Telemedicina",
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
}

module.exports = {
  generatePrescriptionPDF,
  generateLabResultPDF,
  generateReportPDF,
};
