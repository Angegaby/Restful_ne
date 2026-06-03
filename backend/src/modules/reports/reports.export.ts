import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

export type ComprehensiveExportData = {
  stock: {
    totalInStock: number;
    dailyAdded: number;
    monthlyAdded: number;
    yearlyAdded: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  inspectionStatus: {
    pending: number;
    overdue: number;
    completed: number;
    total: number;
    recent: {
      serialNumber: string;
      location: string;
      scheduledDate: string;
      scheduledTime?: string;
      status: string;
      requestedBy?: string;
    }[];
  };
  expiredExtinguishers: {
    serialNumber: string;
    location: string;
    expiryDate: string;
    status: string;
  }[];
  expiredCount: number;
  upcomingExpirations: { serialNumber: string; location: string; expiryDate: string }[];
  upcomingExpirationsCount: number;
  compliancePercent: number;
  complianceStatus: string;
  maintenanceHistory: {
    serialNumber: string;
    location: string;
    maintenanceDate: string;
    actionTaken: string;
    issuesIdentified: string;
    notes: string;
    inspector: string;
  }[];
  maintenanceTotalLogs: number;
  generatedAt: string;
};

export function toCsv(rows: Record<string, unknown>[], title?: string): string {
  if (rows.length === 0) {
    return stringify(title ? [[title], ['No data']] : [['No data']]);
  }
  const headers = Object.keys(rows[0]);
  const headerRow = title ? [[title], headers] : [headers];
  return stringify([
    ...headerRow,
    ...rows.map((r) => headers.map((h) => String(r[h] ?? ''))),
  ]);
}

function csvSectionTitle(title: string): Record<string, string> {
  return { Section: title, Detail: '', Value: '' };
}

export function comprehensiveToCsv(data: ComprehensiveExportData): string {
  const rows: Record<string, string>[] = [];

  rows.push({ Section: 'FIRE EXTINGUISHER STOCK', Detail: '', Value: '' });
  rows.push({ Section: '', Detail: 'Total in stock', Value: String(data.stock.totalInStock) });
  rows.push({ Section: '', Detail: 'Added today (daily)', Value: String(data.stock.dailyAdded) });
  rows.push({ Section: '', Detail: 'Added this month', Value: String(data.stock.monthlyAdded) });
  rows.push({ Section: '', Detail: 'Added this year', Value: String(data.stock.yearlyAdded) });
  for (const s of data.stock.byStatus) {
    rows.push({ Section: '', Detail: `Status: ${s.status}`, Value: String(s.count) });
  }

  rows.push(csvSectionTitle('INSPECTION STATUS'));
  rows.push({ Section: '', Detail: 'Pending', Value: String(data.inspectionStatus.pending) });
  rows.push({ Section: '', Detail: 'Overdue', Value: String(data.inspectionStatus.overdue) });
  rows.push({ Section: '', Detail: 'Completed', Value: String(data.inspectionStatus.completed) });
  rows.push({ Section: '', Detail: 'Total', Value: String(data.inspectionStatus.total) });

  rows.push({
    Section: 'INSPECTION RECORDS',
    Detail: 'Serial | Location | Date | Time | Status | Requested By',
    Value: '',
  });
  for (const i of data.inspectionStatus.recent) {
    rows.push({
      Section: '',
      Detail: i.serialNumber,
      Value: `${i.location} | ${i.scheduledDate} | ${i.scheduledTime ?? ''} | ${i.status} | ${i.requestedBy ?? ''}`,
    });
  }

  rows.push(csvSectionTitle('EXPIRED & COMPLIANCE'));
  rows.push({
    Section: '',
    Detail: 'Compliance %',
    Value: `${data.compliancePercent}% (${data.complianceStatus})`,
  });
  rows.push({ Section: '', Detail: 'Expired count', Value: String(data.expiredCount) });
  rows.push({
    Section: '',
    Detail: 'Expiring in 30 days',
    Value: String(data.upcomingExpirationsCount),
  });

  rows.push({
    Section: 'EXPIRED EXTINGUISHERS',
    Detail: 'Serial | Location | Expiry Date | Status',
    Value: '',
  });
  for (const e of data.expiredExtinguishers) {
    rows.push({
      Section: '',
      Detail: e.serialNumber,
      Value: `${e.location} | ${e.expiryDate} | ${e.status}`,
    });
  }

  rows.push({
    Section: 'MAINTENANCE HISTORY',
    Detail: `Total logs: ${data.maintenanceTotalLogs}`,
    Value: 'Serial | Location | Date | Action | Issues | Notes | Inspector',
  });
  for (const m of data.maintenanceHistory) {
    rows.push({
      Section: '',
      Detail: m.serialNumber,
      Value: `${m.location} | ${m.maintenanceDate} | ${m.actionTaken} | ${m.issuesIdentified} | ${m.notes} | ${m.inspector}`,
    });
  }

  rows.push({ Section: 'Generated at', Detail: data.generatedAt, Value: '' });

  return stringify([
    ['Section', 'Detail', 'Value'],
    ...rows.map((r) => [r.Section, r.Detail, r.Value]),
  ]);
}

export function comprehensiveToPdfSections(
  data: ComprehensiveExportData
): { heading: string; lines: string[] }[] {
  const sections: { heading: string; lines: string[] }[] = [];

  sections.push({
    heading: 'Fire Extinguisher Stock',
    lines: [
      `Total in stock: ${data.stock.totalInStock}`,
      `Added today (daily): ${data.stock.dailyAdded}`,
      `Added this month: ${data.stock.monthlyAdded}`,
      `Added this year: ${data.stock.yearlyAdded}`,
      ...data.stock.byStatus.map((s) => `${s.status}: ${s.count}`),
    ],
  });

  sections.push({
    heading: 'Inspection Status',
    lines: [
      `Pending: ${data.inspectionStatus.pending}`,
      `Overdue: ${data.inspectionStatus.overdue}`,
      `Completed: ${data.inspectionStatus.completed}`,
      `Total: ${data.inspectionStatus.total}`,
    ],
  });

  if (data.inspectionStatus.recent.length > 0) {
    sections.push({
      heading: 'Inspection Records',
      lines: data.inspectionStatus.recent.map(
        (i) =>
          `${i.serialNumber} @ ${i.location} — ${i.scheduledDate} ${i.scheduledTime ?? ''} [${i.status}]${i.requestedBy ? ` (${i.requestedBy})` : ''}`
      ),
    });
  }

  sections.push({
    heading: 'Expired & Compliance',
    lines: [
      `Compliance: ${data.compliancePercent}% (${data.complianceStatus})`,
      `Expired units: ${data.expiredCount}`,
      `Expiring within 30 days: ${data.upcomingExpirationsCount}`,
    ],
  });

  if (data.expiredExtinguishers.length > 0) {
    sections.push({
      heading: 'Expired Extinguishers',
      lines: data.expiredExtinguishers.map(
        (e) => `${e.serialNumber} — ${e.location} — expires ${e.expiryDate} (${e.status})`
      ),
    });
  }

  sections.push({
    heading: `Maintenance History (${data.maintenanceTotalLogs} total)`,
    lines:
      data.maintenanceHistory.length > 0
        ? data.maintenanceHistory.map(
            (m) =>
              `${m.maintenanceDate} | ${m.serialNumber} @ ${m.location} | ${m.actionTaken} | Issues: ${m.issuesIdentified} | Inspector: ${m.inspector}`
          )
        : ['No maintenance records'],
  });

  return sections;
}

export async function buildPdfBuffer(
  title: string,
  sections: { heading: string; lines: string[] }[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('TZW LTD — Fire Extinguisher Management System', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(9).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown(1.5);

    for (const section of sections) {
      doc.fontSize(12).fillColor('#b91c1c').text(section.heading, { underline: true });
      doc.fillColor('#000000');
      doc.moveDown(0.4);
      doc.fontSize(10);
      for (const line of section.lines) {
        doc.text(line, { width: 500 });
      }
      doc.moveDown(0.8);
    }

    doc.end();
  });
}

export async function buildComprehensivePdf(data: ComprehensiveExportData): Promise<Buffer> {
  return buildPdfBuffer('Comprehensive FEMS Report', comprehensiveToPdfSections(data));
}
