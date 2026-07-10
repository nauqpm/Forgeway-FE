import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';

export interface CsvRowResult {
  rowIndex: number;
  title: string;
  status: 'valid' | 'error' | 'warning';
  errors: string[];
  warnings: string[];
  data?: Record<string, unknown>;
}

export interface ImportCsvPreviewResponse {
  sessionToken: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  rows: CsvRowResult[];
}

export interface ImportBulkTaskResult {
  rowIndex: number;
  title: string;
  status: 'created' | 'failed';
  taskKey?: string;
  error?: string;
}

export interface ImportBulkResult {
  created: number;
  failed: number;
  results: ImportBulkTaskResult[];
}

/**
 * Preview CSV import (upload file to BE)
 */
export async function previewCsvImport(
  workspaceId: string,
  file: File
): Promise<ImportCsvPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    apiRoutes.TASKS.BOARD_IMPORT_PREVIEW(workspaceId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data?.data || response.data;
}

/**
 * Confirm CSV import using session token
 */
export async function confirmCsvImport(
  workspaceId: string,
  sessionToken: string
): Promise<ImportBulkResult> {
  const response = await api.post(
    apiRoutes.TASKS.BOARD_IMPORT_CONFIRM(workspaceId),
    { sessionToken }
  );

  return response.data?.data || response.data;
}

/**
 * Generate and download CSV template
 */
export function downloadCsvTemplate(): void {
  const headers = [
    'title',
    'description',
    'type',
    'priority',
    'status',
    'assigneeEmail',
    'storyPoints',
    'startDate',
    'dueDate',
  ];

  const sampleRow = [
    'Example task',
    'Description for task',
    'task',
    'medium',
    'todo',
    'user@example.com',
    '5',
    '2026-01-01',
    '2026-01-15',
  ];

  const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'import-issue-template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
