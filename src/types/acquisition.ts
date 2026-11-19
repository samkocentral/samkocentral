export type AcquisitionFileType = 'pdf' | 'image' | 'excel' | 'doc' | 'other';

export interface AcquisitionFolder {
  id: string;
  name: string;
  parentId: string | null; // null represents root level
  portal?: 'propco' | 'opco';
  property?: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AcquisitionFile {
  id: string;
  name: string;
  folderId: string | null; // null represents root level
  portal?: 'propco' | 'opco';
  fileType: AcquisitionFileType;
  extension: string;
  size: string;
  sizeBytes?: number;
  dataUrl?: string; // base64 or object URL for direct viewing/downloading
  uploadedAt: string;
  uploadedBy: string;
  property?: string;
  version: string;
  notes?: string;
}

