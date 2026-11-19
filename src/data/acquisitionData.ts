import { AcquisitionFolder, AcquisitionFile, AcquisitionFileType } from '@/types/acquisition';

// Clean initial state: Starts completely empty as requested
export const INITIAL_ACQUISITION_FOLDERS: AcquisitionFolder[] = [];

export const INITIAL_ACQUISITION_FILES: AcquisitionFile[] = [];

export function resolveFileType(filename: string): AcquisitionFileType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'doc';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
