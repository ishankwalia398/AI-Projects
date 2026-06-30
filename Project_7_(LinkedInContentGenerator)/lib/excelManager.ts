import * as exceljs from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { ContentRow, ContentStatus } from './types';

class Mutex {
  private queue: Promise<any> = Promise.resolve();

  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    const next = this.queue.then(() => callback());
    this.queue = next.catch(() => {});
    return next;
  }
}

export class ExcelManager {
  private filePath: string;
  private mutex: Mutex;

  constructor() {
    // Save to the root of ContentGenerator_Agent workspace
    this.filePath = path.join(process.cwd(), 'content_calendar.xlsx');
    this.mutex = new Mutex();
    this.ensureFileExistsSync();
  }

  private ensureFileExistsSync() {
    if (!fs.existsSync(this.filePath)) {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Calendar');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Topic', key: 'topic', width: 30 },
        { header: 'LinkedIn POST', key: 'linkedInPost', width: 50 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'LinkedIn Image', key: 'linkedInImage', width: 40 },
        { header: 'Last Updated', key: 'lastUpdated', width: 25 },
        { header: 'Updated By', key: 'updatedBy', width: 20 },
        { header: 'Error Log', key: 'errorLog', width: 30 },
      ];
      // Format header row style
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate 800
      };
      workbook.xlsx.writeFile(this.filePath).catch((err) => {
        console.error('Failed to create initial Excel file:', err);
      });
    }
  }

  private getCellValue(cell: exceljs.Cell): string {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object') {
      if (cell.value instanceof Date) {
        return cell.value.toISOString();
      }
      if ('result' in cell.value && cell.value.result !== null && cell.value.result !== undefined) {
        return String(cell.value.result);
      }
      if ('text' in cell.value && cell.value.text !== undefined) {
        return String(cell.value.text);
      }
      return String((cell.value as any).richText?.map((rt: any) => rt.text).join('') || JSON.stringify(cell.value));
    }
    return String(cell.value);
  }

  /**
   * Reads all rows from the Excel sheet.
   */
  async readRows(): Promise<ContentRow[]> {
    return this.mutex.runExclusive(async () => {
      const rows: ContentRow[] = [];
      if (!fs.existsSync(this.filePath)) {
        return rows;
      }
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(this.filePath);
      const worksheet = workbook.getWorksheet('Calendar') || workbook.worksheets[0];
      if (!worksheet) return rows;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const date = this.getCellValue(row.getCell(1));
        const topic = this.getCellValue(row.getCell(2));
        const linkedInPost = this.getCellValue(row.getCell(3));
        const status = this.getCellValue(row.getCell(4)) as ContentStatus;
        const linkedInImage = this.getCellValue(row.getCell(5));
        const lastUpdated = this.getCellValue(row.getCell(6));
        const updatedBy = this.getCellValue(row.getCell(7));
        const errorLog = this.getCellValue(row.getCell(8));

        if (date) {
          rows.push({
            date,
            topic,
            linkedInPost,
            status: status || 'Pending',
            linkedInImage,
            lastUpdated,
            updatedBy,
            errorLog,
          });
        }
      });
      return rows;
    });
  }

  /**
   * Overwrites the sheet with a new set of rows.
   */
  async writeRows(rows: ContentRow[]): Promise<void> {
    return this.mutex.runExclusive(async () => {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Calendar');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Topic', key: 'topic', width: 30 },
        { header: 'LinkedIn POST', key: 'linkedInPost', width: 50 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'LinkedIn Image', key: 'linkedInImage', width: 40 },
        { header: 'Last Updated', key: 'lastUpdated', width: 25 },
        { header: 'Updated By', key: 'updatedBy', width: 20 },
        { header: 'Error Log', key: 'errorLog', width: 30 },
      ];

      // Format header row style
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };

      for (const row of rows) {
        worksheet.addRow([
          row.date,
          row.topic,
          row.linkedInPost,
          row.status,
          row.linkedInImage,
          row.lastUpdated || new Date().toISOString(),
          row.updatedBy || 'System',
          row.errorLog || '',
        ]);
      }

      await workbook.xlsx.writeFile(this.filePath);
    });
  }

  /**
   * Atomically appends or updates a row for a specific date.
   */
  async updateRow(date: string, updates: Partial<ContentRow>, agentName: string): Promise<void> {
    // Read, mutate, write atomically
    const rows = await this.readRows();
    const existingIndex = rows.findIndex((r) => r.date === date);
    const nowStr = new Date().toISOString();

    if (existingIndex > -1) {
      rows[existingIndex] = {
        ...rows[existingIndex],
        ...updates,
        lastUpdated: nowStr,
        updatedBy: agentName,
      };
    } else {
      // Append new if it doesn't exist
      rows.push({
        date,
        topic: updates.topic || '',
        linkedInPost: updates.linkedInPost || '',
        status: updates.status || 'Pending',
        linkedInImage: updates.linkedInImage || '',
        lastUpdated: nowStr,
        updatedBy: agentName,
        errorLog: updates.errorLog || '',
      });
    }
    await this.writeRows(rows);
  }

  /**
   * Retrieves file modification info for the Excel log.
   */
  getFileStats() {
    if (!fs.existsSync(this.filePath)) {
      return {
        modifiedTime: 'N/A',
        sizeBytes: 0,
      };
    }
    const stats = fs.statSync(this.filePath);
    return {
      modifiedTime: stats.mtime.toISOString(),
      sizeBytes: stats.size,
    };
  }

  /**
   * Helper to download the raw file path
   */
  getRawFilePath(): string {
    return this.filePath;
  }
}

// Single instance exported for the application
export const excelManager = new ExcelManager();
