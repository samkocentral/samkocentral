import { NextRequest, NextResponse } from 'next/server';
import {
  getCollectionData,
  createDocument,
  updateDocument,
  deleteDocument,
  bulkCreateDocuments,
} from '@/lib/serverData';
import { AcquisitionFolder, AcquisitionFile } from '@/types/acquisition';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const portal = searchParams.get('portal'); // 'propco' | 'opco' | 'all' | null
  const folderId = searchParams.get('folderId'); // optional filter by folder

  let allFolders: AcquisitionFolder[] = await getCollectionData('acquisitionFolders');
  let allFiles: AcquisitionFile[] = await getCollectionData('acquisitionFiles');

  let filteredFolders = [...allFolders];
  let filteredFiles = [...allFiles];

  if (portal && portal !== 'all') {
    filteredFolders = filteredFolders.filter(
      (f) => !f.portal || f.portal === portal || (f.portal as any) === 'both'
    );
    filteredFiles = filteredFiles.filter(
      (f) => !f.portal || f.portal === portal || (f.portal as any) === 'both'
    );
  }

  if (folderId !== null && folderId !== undefined && folderId !== 'all') {
    const targetParent = folderId === 'root' || folderId === '' ? null : folderId;
    filteredFolders = filteredFolders.filter((f) => f.parentId === targetParent);
    filteredFiles = filteredFiles.filter((f) => f.folderId === targetParent);
  }

  return NextResponse.json({
    success: true,
    folders: filteredFolders,
    files: filteredFiles,
    allFolders,
    allFiles,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'sync';

    // 1. Create a new folder
    if (action === 'create_folder') {
      const newFolder: AcquisitionFolder = await createDocument('acquisitionFolders', {
        id: body.id || `fld-${Date.now()}`,
        name: body.name || 'New Folder',
        parentId: body.parentId !== undefined ? body.parentId : null,
        portal: body.portal || 'propco',
        property: body.property || 'Portfolio-wide',
        description: body.description || '',
        color: body.color || '#e8c97a',
        createdAt: body.createdAt || new Date().toISOString(),
      });
      const allFolders: AcquisitionFolder[] = await getCollectionData('acquisitionFolders');
      return NextResponse.json({ success: true, folder: newFolder, folders: allFolders });
    }

    // 2. Edit / Rename folder
    if (action === 'edit_folder') {
      const updated = await updateDocument('acquisitionFolders', body.id, {
        name: body.name,
        description: body.description,
        property: body.property,
        color: body.color,
        portal: body.portal,
      });
      const allFolders: AcquisitionFolder[] = await getCollectionData('acquisitionFolders');
      return NextResponse.json({ success: true, folder: updated, folders: allFolders });
    }

    // 3. Move folder (to another folder or to root)
    if (action === 'move_folder') {
      const targetParentId =
        body.targetFolderId === 'root' || body.targetFolderId === '' ? null : body.targetFolderId;
      if (targetParentId === body.id) {
        return NextResponse.json(
          { success: false, error: 'Cannot move folder into itself' },
          { status: 400 }
        );
      }
      const updated = await updateDocument('acquisitionFolders', body.id, {
        parentId: targetParentId,
      });
      const allFolders: AcquisitionFolder[] = await getCollectionData('acquisitionFolders');
      return NextResponse.json({ success: true, folder: updated, folders: allFolders });
    }

    // 4. Delete folder & cascade delete its files/subfolders
    if (action === 'delete_folder') {
      const folderIdToDelete = body.id;
      const allFolders: AcquisitionFolder[] = await getCollectionData('acquisitionFolders');
      const allFiles: AcquisitionFile[] = await getCollectionData('acquisitionFiles');

      // Find all nested child folder IDs recursively
      const childFolderIds = new Set<string>([folderIdToDelete]);
      let changed = true;
      while (changed) {
        changed = false;
        allFolders.forEach((f) => {
          if (f.parentId && childFolderIds.has(f.parentId) && !childFolderIds.has(f.id)) {
            childFolderIds.add(f.id);
            changed = true;
          }
        });
      }

      // Delete child folders
      for (const fId of childFolderIds) {
        await deleteDocument('acquisitionFolders', fId);
      }

      // Delete files inside deleted folders
      for (const file of allFiles) {
        if (file.folderId && childFolderIds.has(file.folderId)) {
          await deleteDocument('acquisitionFiles', file.id);
        }
      }

      const remFolders = await getCollectionData('acquisitionFolders');
      const remFiles = await getCollectionData('acquisitionFiles');

      return NextResponse.json({
        success: true,
        deletedFolderIds: Array.from(childFolderIds),
        folders: remFolders,
        files: remFiles,
      });
    }

    // 5. Upload new file
    if (action === 'upload_file') {
      const newFile: AcquisitionFile = await createDocument('acquisitionFiles', {
        id: body.id || `file-${Date.now()}`,
        name: body.name || 'Untitled Document',
        folderId: body.folderId === 'root' || body.folderId === '' ? null : (body.folderId ?? null),
        portal: body.portal || 'propco',
        fileType: body.fileType || 'other',
        extension: body.extension || 'pdf',
        size: body.size || '1.0 MB',
        sizeBytes: body.sizeBytes || 1024 * 1024,
        dataUrl: body.dataUrl || undefined,
        uploadedAt: body.uploadedAt || new Date().toISOString(),
        uploadedBy: body.uploadedBy || 'Super Admin',
        property: body.property || 'Portfolio-wide',
        version: body.version || 'v1.0',
        notes: body.notes || '',
      });
      const allFiles = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, file: newFile, files: allFiles });
    }

    // 6. Bulk upload files
    if (action === 'bulk_upload_files') {
      const items = Array.isArray(body.files) ? body.files : [];
      if (items.length > 0) {
        await bulkCreateDocuments('acquisitionFiles', items);
      }
      const allFiles = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, count: items.length, files: allFiles });
    }

    // 7. Edit file metadata
    if (action === 'edit_file') {
      const updated = await updateDocument('acquisitionFiles', body.id, {
        name: body.name,
        notes: body.notes,
        property: body.property,
        portal: body.portal,
      });
      const allFiles = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, file: updated, files: allFiles });
    }

    // 8. Re-upload / Replace file version
    if (action === 'reupload_file') {
      const updated = await updateDocument('acquisitionFiles', body.id, {
        name: body.name,
        extension: body.extension,
        fileType: body.fileType,
        size: body.size,
        sizeBytes: body.sizeBytes,
        dataUrl: body.dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: body.uploadedBy,
        version: body.version,
        notes: body.notes,
      });
      const allFiles = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, file: updated, files: allFiles });
    }

    // 9. Move file(s) across folders / subfolders / root
    if (action === 'move_file') {
      const targetFolderId =
        body.targetFolderId === 'root' || body.targetFolderId === '' ? null : body.targetFolderId;
      const fileIds: string[] = Array.isArray(body.fileIds) ? body.fileIds : [body.id];

      for (const fileId of fileIds) {
        await updateDocument('acquisitionFiles', fileId, { folderId: targetFolderId });
      }

      const allFiles = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, movedFileIds: fileIds, files: allFiles });
    }

    // 10. Delete file(s)
    if (action === 'delete_file') {
      const fileIds: string[] = Array.isArray(body.fileIds) ? body.fileIds : [body.id];
      for (const fileId of fileIds) {
        await deleteDocument('acquisitionFiles', fileId);
      }
      const allFiles = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, deletedFileIds: fileIds, files: allFiles });
    }

    // 11. Sync entire state (upsert folders and files from client)
    if (action === 'sync') {
      if (Array.isArray(body.folders) && body.folders.length > 0) {
        for (const f of body.folders) {
          await updateDocument('acquisitionFolders', f.id, f);
        }
      }
      if (Array.isArray(body.files) && body.files.length > 0) {
        for (const fl of body.files) {
          await updateDocument('acquisitionFiles', fl.id, fl);
        }
      }
      const folders = await getCollectionData('acquisitionFolders');
      const files = await getCollectionData('acquisitionFiles');
      return NextResponse.json({ success: true, folders, files });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
