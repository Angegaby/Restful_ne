import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import * as reportsService from './reports.service';
import {
  buildComprehensivePdf,
  buildPdfBuffer,
  comprehensiveToCsv,
  comprehensiveToPdfSections,
  toCsv,
} from './reports.export';
import { sendSuccess } from '../../lib/response';
import { parsePaginationSafe } from '../../lib/pagination';
import { ValidationError } from '../../lib/errors';

const formatSchema = z.enum(['pdf', 'csv']);

type ReportType = 'inventory' | 'inspections' | 'compliance' | 'maintenance' | 'summary';

async function getReportData(type: ReportType, userId: string, role: UserRole) {
  switch (type) {
    case 'inventory':
      return reportsService.inventoryReport(userId, role);
    case 'inspections':
      return reportsService.inspectionReport(userId, role);
    case 'compliance':
      return reportsService.complianceReport(userId, role);
    case 'maintenance':
      return reportsService.maintenanceReport(userId, role, 1, 5000);
    case 'summary':
      return reportsService.comprehensiveReportForExport(userId, role);
  }
}

function pdfSectionsFromType(type: ReportType, data: Record<string, unknown>) {
  if (type === 'summary') {
    return comprehensiveToPdfSections(
      data as Awaited<ReturnType<typeof reportsService.comprehensiveReportForExport>>
    );
  }

  const d = data as Record<string, unknown>;
  const lines: string[] = [];

  if (type === 'inventory') {
    lines.push(
      `Total in stock: ${d.total}`,
      `Daily added: ${d.dailySummary}`,
      `Monthly added: ${d.monthlySummary}`,
      `Yearly added: ${d.yearlySummary}`
    );
    const items = (d.items as { serialNumber: string; location: string }[]) ?? [];
    if (items.length) {
      return [
        { heading: 'Stock Summary', lines },
        {
          heading: 'Equipment Register',
          lines: items.map(
            (e) => `${e.serialNumber} — ${(e as { location: string }).location}`
          ),
        },
      ];
    }
  } else if (type === 'inspections') {
    lines.push(
      `Pending: ${d.pending}`,
      `Overdue: ${d.overdue}`,
      `Completed: ${d.completed}`,
      `Total: ${d.total}`
    );
    const recent = (d.recent as { serialNumber: string; location: string; status: string }[]) ?? [];
    return [
      { heading: 'Inspection Status', lines },
      {
        heading: 'Inspection Records',
        lines: recent.map(
          (r) => `${r.serialNumber} @ ${r.location} — ${(r as { scheduledDate?: string }).scheduledDate ?? ''} [${r.status}]`
        ),
      },
    ];
  } else if (type === 'compliance') {
    lines.push(
      `Compliance: ${d.compliancePercent}% (${d.complianceStatus})`,
      `Expired count: ${d.expiredCount}`,
      `Upcoming (30d): ${d.upcomingExpirationsCount}`
    );
    const expired = (d.expired as { serialNumber: string; location: string; expiryDate: string }[]) ?? [];
    return [
      { heading: 'Compliance Summary', lines },
      {
        heading: 'Expired Extinguishers',
        lines: expired.map((e) => `${e.serialNumber} — ${e.location} — ${e.expiryDate}`),
      },
    ];
  } else {
    lines.push(`Total maintenance logs: ${d.totalLogs}`);
    const history =
      (d.maintenanceHistory as {
        serialNumber: string;
        location: string;
        maintenanceDate: string;
        actionTaken: string;
        inspector: string;
      }[]) ?? [];
    return [
      { heading: 'Maintenance Summary', lines },
      {
        heading: 'Maintenance History',
        lines: history.map(
          (m) =>
            `${m.maintenanceDate} | ${m.serialNumber} @ ${m.location} | ${m.actionTaken} | ${m.inspector}`
        ),
      },
    ];
  }

  return [{ heading: 'Summary', lines }];
}

function csvFromType(type: ReportType, data: Record<string, unknown>): string {
  if (type === 'summary') {
    return comprehensiveToCsv(
      data as Awaited<ReturnType<typeof reportsService.comprehensiveReportForExport>>
    );
  }

  const d = data as Record<string, unknown>;
  const rows: Record<string, unknown>[] = [];

  if (type === 'inventory') {
    rows.push(
      { metric: 'Total in stock', value: d.total },
      { metric: 'Daily added', value: d.dailySummary },
      { metric: 'Monthly added', value: d.monthlySummary },
      { metric: 'Yearly added', value: d.yearlySummary }
    );
    for (const item of (d.items as Record<string, unknown>[]) ?? []) {
      rows.push(item);
    }
  } else if (type === 'inspections') {
    rows.push(
      { metric: 'Pending', value: d.pending },
      { metric: 'Overdue', value: d.overdue },
      { metric: 'Completed', value: d.completed },
      { metric: 'Total', value: d.total }
    );
    for (const r of (d.recent as Record<string, unknown>[]) ?? []) {
      rows.push(r);
    }
  } else if (type === 'compliance') {
    rows.push(
      { metric: 'Compliance %', value: d.compliancePercent },
      { metric: 'Status', value: d.complianceStatus },
      { metric: 'Expired count', value: d.expiredCount }
    );
    for (const e of (d.expired as Record<string, unknown>[]) ?? []) {
      rows.push(e);
    }
  } else {
    rows.push({ metric: 'Total logs', value: d.totalLogs });
    for (const m of (d.maintenanceHistory as Record<string, unknown>[]) ?? []) {
      rows.push(m);
    }
  }

  return toCsv(rows, `${type} report`);
}

export async function inventory(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await reportsService.inventoryReport(req.user!.id, req.user!.role));
  } catch (e) {
    next(e);
  }
}

export async function inspections(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await reportsService.inspectionReport(req.user!.id, req.user!.role));
  } catch (e) {
    next(e);
  }
}

export async function compliance(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await reportsService.complianceReport(req.user!.id, req.user!.role));
  } catch (e) {
    next(e);
  }
}

export async function maintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePaginationSafe(req.query as Record<string, unknown>);
    sendSuccess(
      res,
      await reportsService.maintenanceReport(req.user!.id, req.user!.role, page, limit)
    );
  } catch (e) {
    next(e);
  }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePaginationSafe(req.query as Record<string, unknown>);
    sendSuccess(
      res,
      await reportsService.comprehensiveReport(req.user!.id, req.user!.role, page, limit)
    );
  } catch (e) {
    next(e);
  }
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await reportsService.dashboardStats(req.user!.id, req.user!.role);
    sendSuccess(res, stats);
  } catch (e) {
    next(e);
  }
}

/** Full comprehensive report export (PDF or CSV) */
export async function exportSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const formatResult = formatSchema.safeParse(req.query.format);
    if (!formatResult.success) {
      throw new ValidationError([{ field: 'format', message: 'Format must be pdf or csv' }]);
    }

    const data = await reportsService.comprehensiveReportForExport(
      req.user!.id,
      req.user!.role
    );

    if (formatResult.data === 'csv') {
      const csv = comprehensiveToCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="fems-comprehensive-report.csv"'
      );
      return res.send(csv);
    }

    const buffer = await buildComprehensivePdf(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="fems-comprehensive-report.pdf"'
    );
    return res.send(buffer);
  } catch (e) {
    next(e);
  }
}

export async function exportReport(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.params.type as ReportType;
    const validTypes: ReportType[] = [
      'inventory',
      'inspections',
      'compliance',
      'maintenance',
      'summary',
    ];
    if (!validTypes.includes(type)) {
      throw new ValidationError([{ field: 'type', message: 'Invalid report type' }]);
    }

    const formatResult = formatSchema.safeParse(req.query.format);
    if (!formatResult.success) {
      throw new ValidationError([{ field: 'format', message: 'Format must be pdf or csv' }]);
    }

    const data = await getReportData(type, req.user!.id, req.user!.role);
    const title =
      type === 'summary'
        ? 'Comprehensive FEMS Report'
        : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

    if (formatResult.data === 'csv') {
      const csv = csvFromType(type, data as Record<string, unknown>);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      return res.send(csv);
    }

    const sections = pdfSectionsFromType(type, data as Record<string, unknown>);
    const buffer = await buildPdfBuffer(title, sections);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    return res.send(buffer);
  } catch (e) {
    next(e);
  }
}
