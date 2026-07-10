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
 * Download template for import
 */
export async function downloadImportTemplate(workspaceId: string, format: 'csv' | 'xlsx' = 'xlsx'): Promise<void> {
  const response = await api.get(
    apiRoutes.TASKS.BOARD_IMPORT_TEMPLATE?.(workspaceId) || `/workspaces/${workspaceId}/board/import/template`,
    {
      params: { format },
      responseType: 'blob',
    }
  );

  const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `import-issue-template.${format}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
