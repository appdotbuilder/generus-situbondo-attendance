
import { db } from '../db';
import { materialsTable, usersTable } from '../db/schema';
import { type CreateMaterialInput, type Material } from '../schema';
import { eq } from 'drizzle-orm';

export async function createMaterial(input: CreateMaterialInput, userId: number): Promise<Material> {
  try {
    const result = await db.insert(materialsTable)
      .values({
        judul: input.judul,
        deskripsi: input.deskripsi || null,
        file_url: input.file_url || null,
        file_name: input.file_name || null,
        created_by: userId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Material creation failed:', error);
    throw error;
  }
}

export async function getAllMaterials(): Promise<Material[]> {
  try {
    const results = await db.select()
      .from(materialsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch materials:', error);
    throw error;
  }
}

export async function getMaterialById(id: number): Promise<Material | null> {
  try {
    const results = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch material by ID:', error);
    throw error;
  }
}

export async function updateMaterial(id: number, input: Partial<CreateMaterialInput>, userId: number): Promise<Material | null> {
  try {
    // First check if material exists
    const existing = await getMaterialById(id);
    if (!existing) {
      return null;
    }

    const updateData: Partial<typeof materialsTable.$inferInsert> = {};
    
    if (input.judul !== undefined) updateData.judul = input.judul;
    if (input.deskripsi !== undefined) updateData.deskripsi = input.deskripsi;
    if (input.file_url !== undefined) updateData.file_url = input.file_url;
    if (input.file_name !== undefined) updateData.file_name = input.file_name;

    const results = await db.update(materialsTable)
      .set(updateData)
      .where(eq(materialsTable.id, id))
      .returning()
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Material update failed:', error);
    throw error;
  }
}

export async function deleteMaterial(id: number, userId: number): Promise<boolean> {
  try {
    // First check if material exists
    const existing = await getMaterialById(id);
    if (!existing) {
      return false;
    }

    const results = await db.delete(materialsTable)
      .where(eq(materialsTable.id, id))
      .returning()
      .execute();

    return results.length > 0;
  } catch (error) {
    console.error('Material deletion failed:', error);
    throw error;
  }
}

export async function uploadMaterialFile(fileBuffer: Buffer, fileName: string, userId: number): Promise<{ success: boolean; fileUrl: string; error?: string }> {
  // This is a placeholder implementation for file upload functionality
  // In a real implementation, this would:
  // 1. Validate file type and size
  // 2. Store file in a secure location (local storage, S3, etc.)
  // 3. Generate a secure URL for file access
  // 4. Return the file URL for storage in the database
  
  try {
    // Validate file size (example: max 10MB)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return {
        success: false,
        fileUrl: '',
        error: 'File size exceeds 10MB limit'
      };
    }

    // Validate file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        success: false,
        fileUrl: '',
        error: 'File type not supported. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX'
      };
    }

    // For now, return a mock URL
    const mockFileUrl = `/uploads/materials/${Date.now()}_${fileName}`;
    
    return {
      success: true,
      fileUrl: mockFileUrl
    };
  } catch (error) {
    console.error('File upload failed:', error);
    return {
      success: false,
      fileUrl: '',
      error: 'File upload failed'
    };
  }
}
