
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { materialsTable, usersTable } from '../db/schema';
import { type CreateMaterialInput } from '../schema';
import { 
  createMaterial, 
  getAllMaterials, 
  getMaterialById, 
  updateMaterial, 
  deleteMaterial,
  uploadMaterialFile 
} from '../handlers/materials';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  password: 'testpass',
  role: 'koordinator' as const,
  full_name: 'Test User',
  is_active: true
};

// Test material input
const testMaterialInput: CreateMaterialInput = {
  judul: 'Test Material',
  deskripsi: 'A test material for learning',
  file_url: '/files/test-material.pdf',
  file_name: 'test-material.pdf'
};

describe('Materials Handlers', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  describe('createMaterial', () => {
    it('should create a material successfully', async () => {
      const result = await createMaterial(testMaterialInput, testUserId);

      expect(result.judul).toEqual('Test Material');
      expect(result.deskripsi).toEqual('A test material for learning');
      expect(result.file_url).toEqual('/files/test-material.pdf');
      expect(result.file_name).toEqual('test-material.pdf');
      expect(result.created_by).toEqual(testUserId);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save material to database', async () => {
      const result = await createMaterial(testMaterialInput, testUserId);

      const materials = await db.select()
        .from(materialsTable)
        .where(eq(materialsTable.id, result.id))
        .execute();

      expect(materials).toHaveLength(1);
      expect(materials[0].judul).toEqual('Test Material');
      expect(materials[0].created_by).toEqual(testUserId);
    });

    it('should handle optional fields', async () => {
      const minimalInput: CreateMaterialInput = {
        judul: 'Minimal Material'
      };

      const result = await createMaterial(minimalInput, testUserId);

      expect(result.judul).toEqual('Minimal Material');
      expect(result.deskripsi).toBeNull();
      expect(result.file_url).toBeNull();
      expect(result.file_name).toBeNull();
      expect(result.created_by).toEqual(testUserId);
    });
  });

  describe('getAllMaterials', () => {
    it('should return empty array when no materials exist', async () => {
      const results = await getAllMaterials();
      expect(results).toEqual([]);
    });

    it('should return all materials', async () => {
      // Create test materials
      await createMaterial(testMaterialInput, testUserId);
      await createMaterial({
        judul: 'Second Material',
        deskripsi: 'Another test material'
      }, testUserId);

      const results = await getAllMaterials();

      expect(results).toHaveLength(2);
      expect(results[0].judul).toEqual('Test Material');
      expect(results[1].judul).toEqual('Second Material');
    });
  });

  describe('getMaterialById', () => {
    it('should return material when found', async () => {
      const created = await createMaterial(testMaterialInput, testUserId);
      const result = await getMaterialById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.judul).toEqual('Test Material');
    });

    it('should return null when material not found', async () => {
      const result = await getMaterialById(999);
      expect(result).toBeNull();
    });
  });

  describe('updateMaterial', () => {
    it('should update material successfully', async () => {
      const created = await createMaterial(testMaterialInput, testUserId);
      
      const updateInput = {
        judul: 'Updated Material',
        deskripsi: 'Updated description'
      };

      const result = await updateMaterial(created.id, updateInput, testUserId);

      expect(result).not.toBeNull();
      expect(result!.judul).toEqual('Updated Material');
      expect(result!.deskripsi).toEqual('Updated description');
      expect(result!.file_url).toEqual('/files/test-material.pdf'); // Should keep original
      expect(result!.file_name).toEqual('test-material.pdf'); // Should keep original
    });

    it('should return null when material not found', async () => {
      const result = await updateMaterial(999, { judul: 'New Title' }, testUserId);
      expect(result).toBeNull();
    });

    it('should update only provided fields', async () => {
      const created = await createMaterial(testMaterialInput, testUserId);
      
      const result = await updateMaterial(created.id, { judul: 'New Title Only' }, testUserId);

      expect(result).not.toBeNull();
      expect(result!.judul).toEqual('New Title Only');
      expect(result!.deskripsi).toEqual('A test material for learning'); // Should keep original
    });
  });

  describe('deleteMaterial', () => {
    it('should delete material successfully', async () => {
      const created = await createMaterial(testMaterialInput, testUserId);
      
      const result = await deleteMaterial(created.id, testUserId);
      expect(result).toBe(true);

      // Verify material is deleted
      const found = await getMaterialById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when material not found', async () => {
      const result = await deleteMaterial(999, testUserId);
      expect(result).toBe(false);
    });
  });

  describe('uploadMaterialFile', () => {
    it('should validate file size limit', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const result = await uploadMaterialFile(largeBuffer, 'large-file.pdf', testUserId);

      expect(result.success).toBe(false);
      expect(result.fileUrl).toEqual('');
      expect(result.error).toMatch(/size exceeds.*limit/i);
    });

    it('should validate file extensions', async () => {
      const buffer = Buffer.from('test content');
      
      const result = await uploadMaterialFile(buffer, 'test.txt', testUserId);

      expect(result.success).toBe(false);
      expect(result.fileUrl).toEqual('');
      expect(result.error).toMatch(/file type not supported/i);
    });

    it('should accept valid file types', async () => {
      const buffer = Buffer.from('test pdf content');
      
      const result = await uploadMaterialFile(buffer, 'document.pdf', testUserId);

      expect(result.success).toBe(true);
      expect(result.fileUrl).toMatch(/\/uploads\/materials\/.*document\.pdf/);
      expect(result.error).toBeUndefined();
    });

    it('should accept multiple valid extensions', async () => {
      const buffer = Buffer.from('test content');
      const validFiles = ['doc.docx', 'sheet.xlsx', 'presentation.pptx'];

      for (const fileName of validFiles) {
        const result = await uploadMaterialFile(buffer, fileName, testUserId);
        expect(result.success).toBe(true);
        expect(result.fileUrl).toContain(fileName);
      }
    });
  });
});
