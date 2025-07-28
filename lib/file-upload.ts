// lib/file-upload.ts
'use server';

import "server-only";
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  buffer: Buffer;
}

export async function saveUploadedFile(
  file: File, 
  uploadDir: string = 'uploads/email-attachments'
): Promise<UploadedFile> {
  try {
    // Create upload directory if it doesn't exist
    const fullUploadDir = path.join(process.cwd(), 'public', uploadDir);
    if (!existsSync(fullUploadDir)) {
      await mkdir(fullUploadDir, { recursive: true });
    }

    // Generate unique filename
    const id = uuidv4();
    const extension = path.extname(file.name);
    const fileName = `${id}${extension}`;
    const filePath = path.join(fullUploadDir, fileName);
    const relativePath = path.join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return {
      id,
      fileName,
      originalFileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filePath: relativePath,
      buffer,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to save uploaded file');
  }
}

// Server-side validation with async (if you need it)
export async function validateAndSaveFile(
  file: File,
  uploadDir?: string
): Promise<{ success: boolean; file?: UploadedFile; error?: string }> {
  try {
    // Import validation from the client-side file
    const { validateAttachment } = await import('./file-validation');
    
    // Validate file
    const validation = validateAttachment(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Save file
    const uploadedFile = await saveUploadedFile(file, uploadDir);
    return { success: true, file: uploadedFile };

  } catch (error) {
    console.error('File validation and save error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    };
  }
}
