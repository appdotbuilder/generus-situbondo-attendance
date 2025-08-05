
import { db } from '../db';
import { generusTable } from '../db/schema';
import { type CreateGenerusInput, type UpdateGenerusInput, type Generus } from '../schema';
import { eq } from 'drizzle-orm';

export async function createGenerus(input: CreateGenerusInput): Promise<Generus> {
  try {
    const result = await db.insert(generusTable)
      .values({
        nama_lengkap: input.nama_lengkap,
        tempat_lahir: input.tempat_lahir,
        tanggal_lahir: input.tanggal_lahir,
        kelompok_sambung: input.kelompok_sambung,
        jenis_kelamin: input.jenis_kelamin,
        jenjang: input.jenjang,
        status: input.status,
        profesi: input.profesi || null,
        keahlian: input.keahlian || null,
        keterangan: input.keterangan || null,
        foto_url: input.foto_url || null
      })
      .returning()
      .execute();

    const generus = result[0];
    return {
      ...generus,
      tanggal_lahir: new Date(generus.tanggal_lahir)
    };
  } catch (error) {
    console.error('Generus creation failed:', error);
    throw error;
  }
}

export async function getAllGenerus(): Promise<Generus[]> {
  try {
    const results = await db.select()
      .from(generusTable)
      .execute();

    return results.map(generus => ({
      ...generus,
      tanggal_lahir: new Date(generus.tanggal_lahir)
    }));
  } catch (error) {
    console.error('Failed to fetch all generus:', error);
    throw error;
  }
}

export async function getGenerusById(id: number): Promise<Generus | null> {
  try {
    const results = await db.select()
      .from(generusTable)
      .where(eq(generusTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const generus = results[0];
    return {
      ...generus,
      tanggal_lahir: new Date(generus.tanggal_lahir)
    };
  } catch (error) {
    console.error('Failed to fetch generus by ID:', error);
    throw error;
  }
}

export async function updateGenerus(input: UpdateGenerusInput): Promise<Generus | null> {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.nama_lengkap !== undefined) updateData.nama_lengkap = input.nama_lengkap;
    if (input.tempat_lahir !== undefined) updateData.tempat_lahir = input.tempat_lahir;
    if (input.tanggal_lahir !== undefined) updateData.tanggal_lahir = input.tanggal_lahir;
    if (input.kelompok_sambung !== undefined) updateData.kelompok_sambung = input.kelompok_sambung;
    if (input.jenis_kelamin !== undefined) updateData.jenis_kelamin = input.jenis_kelamin;
    if (input.jenjang !== undefined) updateData.jenjang = input.jenjang;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.profesi !== undefined) updateData.profesi = input.profesi;
    if (input.keahlian !== undefined) updateData.keahlian = input.keahlian;
    if (input.keterangan !== undefined) updateData.keterangan = input.keterangan;
    if (input.foto_url !== undefined) updateData.foto_url = input.foto_url;

    // Set updated_at timestamp
    updateData.updated_at = new Date();

    const results = await db.update(generusTable)
      .set(updateData)
      .where(eq(generusTable.id, input.id))
      .returning()
      .execute();

    if (results.length === 0) {
      return null;
    }

    const generus = results[0];
    return {
      ...generus,
      tanggal_lahir: new Date(generus.tanggal_lahir)
    };
  } catch (error) {
    console.error('Generus update failed:', error);
    throw error;
  }
}

export async function deleteGenerus(id: number): Promise<boolean> {
  try {
    const result = await db.delete(generusTable)
      .where(eq(generusTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Generus deletion failed:', error);
    throw error;
  }
}

export async function uploadGenerusData(fileBuffer: Buffer, fileName: string): Promise<{ success: boolean; count: number; errors: string[] }> {
  // This is a placeholder implementation
  // File parsing would require additional libraries like pdf-parse, xlsx, docx-parser, etc.
  return {
    success: false,
    count: 0,
    errors: ['File parsing not implemented yet']
  };
}
