
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generusTable } from '../db/schema';
import { type CreateGenerusInput, type UpdateGenerusInput } from '../schema';
import { 
  createGenerus, 
  getAllGenerus, 
  getGenerusById, 
  updateGenerus, 
  deleteGenerus,
  uploadGenerusData
} from '../handlers/generus';
import { eq } from 'drizzle-orm';

const testGenerusInput: CreateGenerusInput = {
  nama_lengkap: 'Ahmad Santoso',
  tempat_lahir: 'Jakarta',
  tanggal_lahir: '1995-05-15',
  kelompok_sambung: 'Kelompok A',
  jenis_kelamin: 'Laki-laki',
  jenjang: 'SMA',
  status: 'Aktif',
  profesi: 'Mahasiswa',
  keahlian: 'Programming',
  keterangan: 'Siswa berprestasi',
  foto_url: 'https://example.com/photo.jpg'
};

describe('createGenerus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a generus with all fields', async () => {
    const result = await createGenerus(testGenerusInput);

    expect(result.nama_lengkap).toEqual('Ahmad Santoso');
    expect(result.tempat_lahir).toEqual('Jakarta');
    expect(result.tanggal_lahir).toBeInstanceOf(Date);
    expect(result.tanggal_lahir.toISOString().substring(0, 10)).toEqual('1995-05-15');
    expect(result.kelompok_sambung).toEqual('Kelompok A');
    expect(result.jenis_kelamin).toEqual('Laki-laki');
    expect(result.jenjang).toEqual('SMA');
    expect(result.status).toEqual('Aktif');
    expect(result.profesi).toEqual('Mahasiswa');
    expect(result.keahlian).toEqual('Programming');
    expect(result.keterangan).toEqual('Siswa berprestasi');
    expect(result.foto_url).toEqual('https://example.com/photo.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a generus with minimal required fields', async () => {
    const minimalInput: CreateGenerusInput = {
      nama_lengkap: 'Siti Nurhaliza',
      tempat_lahir: 'Bandung',
      tanggal_lahir: '2000-01-01',
      kelompok_sambung: 'Kelompok B',
      jenis_kelamin: 'Perempuan',
      jenjang: 'SMP',
      status: 'Aktif'
    };

    const result = await createGenerus(minimalInput);

    expect(result.nama_lengkap).toEqual('Siti Nurhaliza');
    expect(result.tempat_lahir).toEqual('Bandung');
    expect(result.tanggal_lahir).toBeInstanceOf(Date);
    expect(result.profesi).toBeNull();
    expect(result.keahlian).toBeNull();
    expect(result.keterangan).toBeNull();
    expect(result.foto_url).toBeNull();
  });

  it('should save generus to database', async () => {
    const result = await createGenerus(testGenerusInput);

    const saved = await db.select()
      .from(generusTable)
      .where(eq(generusTable.id, result.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].nama_lengkap).toEqual('Ahmad Santoso');
    expect(saved[0].status).toEqual('Aktif');
    expect(saved[0].tanggal_lahir).toEqual('1995-05-15');
  });
});

describe('getAllGenerus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no generus exist', async () => {
    const results = await getAllGenerus();
    expect(results).toEqual([]);
  });

  it('should return all generus records', async () => {
    await createGenerus(testGenerusInput);
    await createGenerus({
      ...testGenerusInput,
      nama_lengkap: 'Budi Pratama',
      tempat_lahir: 'Surabaya'
    });

    const results = await getAllGenerus();

    expect(results).toHaveLength(2);
    expect(results[0].nama_lengkap).toEqual('Ahmad Santoso');
    expect(results[0].tanggal_lahir).toBeInstanceOf(Date);
    expect(results[1].nama_lengkap).toEqual('Budi Pratama');
    expect(results[1].tanggal_lahir).toBeInstanceOf(Date);
  });
});

describe('getGenerusById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return generus by ID', async () => {
    const created = await createGenerus(testGenerusInput);
    const result = await getGenerusById(created.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.nama_lengkap).toEqual('Ahmad Santoso');
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ID', async () => {
    const result = await getGenerusById(999);
    expect(result).toBeNull();
  });
});

describe('updateGenerus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update generus with provided fields', async () => {
    const created = await createGenerus(testGenerusInput);
    
    const updateInput: UpdateGenerusInput = {
      id: created.id,
      nama_lengkap: 'Ahmad Santoso Updated',
      status: 'Alumni',
      profesi: 'Software Engineer'
    };

    const result = await updateGenerus(updateInput);

    expect(result).not.toBeNull();
    expect(result!.nama_lengkap).toEqual('Ahmad Santoso Updated');
    expect(result!.status).toEqual('Alumni');
    expect(result!.profesi).toEqual('Software Engineer');
    expect(result!.tempat_lahir).toEqual('Jakarta'); // Unchanged field
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ID', async () => {
    const updateInput: UpdateGenerusInput = {
      id: 999,
      nama_lengkap: 'Non-existent'
    };

    const result = await updateGenerus(updateInput);
    expect(result).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    const created = await createGenerus(testGenerusInput);
    
    const updateInput: UpdateGenerusInput = {
      id: created.id,
      jenjang: 'Kuliah'
    };

    const result = await updateGenerus(updateInput);

    expect(result).not.toBeNull();
    expect(result!.jenjang).toEqual('Kuliah');
    expect(result!.nama_lengkap).toEqual('Ahmad Santoso'); // Unchanged
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
  });

  it('should update date field correctly', async () => {
    const created = await createGenerus(testGenerusInput);
    
    const updateInput: UpdateGenerusInput = {
      id: created.id,
      tanggal_lahir: '1996-06-20'
    };

    const result = await updateGenerus(updateInput);

    expect(result).not.toBeNull();
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.tanggal_lahir.toISOString().substring(0, 10)).toEqual('1996-06-20');
  });
});

describe('deleteGenerus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing generus', async () => {
    const created = await createGenerus(testGenerusInput);
    const result = await deleteGenerus(created.id);

    expect(result).toBe(true);

    const found = await getGenerusById(created.id);
    expect(found).toBeNull();
  });

  it('should return false for non-existent ID', async () => {
    const result = await deleteGenerus(999);
    expect(result).toBe(false);
  });
});

describe('uploadGenerusData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return not implemented error', async () => {
    const fileBuffer = Buffer.from('test file content');
    const result = await uploadGenerusData(fileBuffer, 'test.pdf');

    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(result.errors).toContain('File parsing not implemented yet');
  });
});
