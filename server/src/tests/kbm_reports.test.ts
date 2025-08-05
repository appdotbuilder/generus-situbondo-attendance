
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, generusTable, kbmReportsTable, attendanceTable } from '../db/schema';
import { type CreateKBMReportInput } from '../schema';
import { 
  createKBMReport, 
  getAllKBMReports, 
  getKBMReportsByUser, 
  getKBMReportById, 
  deleteKBMReport 
} from '../handlers/kbm_reports';
import { eq } from 'drizzle-orm';

describe('KBM Reports Handlers', () => {
  let testUserId: number;
  let testGenerusId1: number;
  let testGenerusId2: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testguru',
        password: 'hashedpassword',
        role: 'guru',
        full_name: 'Test Guru',
        is_active: true
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test generus
    const generusResult1 = await db.insert(generusTable)
      .values({
        nama_lengkap: 'Test Student 1',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2010-01-01',
        kelompok_sambung: 'Kelompok A',
        jenis_kelamin: 'Laki-laki',
        jenjang: 'SD',
        status: 'Aktif'
      })
      .returning()
      .execute();
    testGenerusId1 = generusResult1[0].id;

    const generusResult2 = await db.insert(generusTable)
      .values({
        nama_lengkap: 'Test Student 2',
        tempat_lahir: 'Bandung',
        tanggal_lahir: '2010-02-01',
        kelompok_sambung: 'Kelompok B',
        jenis_kelamin: 'Perempuan',
        jenjang: 'SD',
        status: 'Aktif'
      })
      .returning()
      .execute();
    testGenerusId2 = generusResult2[0].id;
  });

  afterEach(resetDB);

  describe('createKBMReport', () => {
    const testInput: CreateKBMReportInput = {
      tanggal: '2024-01-15',
      hari: 'Senin',
      nama_pengajar: 'Ustadz Ahmad',
      materi: 'Fiqih - Wudhu dan Sholat',
      keterangan: 'Pembelajaran berjalan lancar',
      attendances: [
        {
          generus_name: 'Test Student 1',
          status: 'Hadir'
        },
        {
          generus_name: 'Test Student 2',
          status: 'Sakit'
        }
      ]
    };

    it('should create KBM report with attendance data', async () => {
      const result = await createKBMReport(testInput, testUserId);

      expect(result.id).toBeDefined();
      expect(result.tanggal).toEqual(new Date('2024-01-15'));
      expect(result.hari).toEqual('Senin');
      expect(result.nama_pengajar).toEqual('Ustadz Ahmad');
      expect(result.user_id).toEqual(testUserId);
      expect(result.materi).toEqual('Fiqih - Wudhu dan Sholat');
      expect(result.keterangan).toEqual('Pembelajaran berjalan lancar');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create attendance records for each generus', async () => {
      const result = await createKBMReport(testInput, testUserId);

      const attendanceRecords = await db.select()
        .from(attendanceTable)
        .where(eq(attendanceTable.kbm_report_id, result.id))
        .execute();

      expect(attendanceRecords).toHaveLength(2);
      
      const hadir = attendanceRecords.find(a => a.generus_id === testGenerusId1);
      expect(hadir?.status).toEqual('Hadir');
      
      const sakit = attendanceRecords.find(a => a.generus_id === testGenerusId2);
      expect(sakit?.status).toEqual('Sakit');
    });

    it('should save KBM report to database', async () => {
      const result = await createKBMReport(testInput, testUserId);

      const reports = await db.select()
        .from(kbmReportsTable)
        .where(eq(kbmReportsTable.id, result.id))
        .execute();

      expect(reports).toHaveLength(1);
      expect(reports[0].tanggal).toEqual('2024-01-15'); // Database stores as string
      expect(reports[0].hari).toEqual('Senin');
      expect(reports[0].nama_pengajar).toEqual('Ustadz Ahmad');
      expect(reports[0].user_id).toEqual(testUserId);
    });

    it('should throw error when user does not exist', async () => {
      await expect(createKBMReport(testInput, 999)).rejects.toThrow(/user not found/i);
    });

    it('should throw error when generus does not exist', async () => {
      const invalidInput: CreateKBMReportInput = {
        ...testInput,
        attendances: [
          {
            generus_name: 'Non-existent Student',
            status: 'Hadir'
          }
        ]
      };

      await expect(createKBMReport(invalidInput, testUserId)).rejects.toThrow(/Generus 'Non-existent Student' not found/i);
    });
  });

  describe('getAllKBMReports', () => {
    it('should return all KBM reports', async () => {
      // Create test reports
      await db.insert(kbmReportsTable)
        .values([
          {
            tanggal: '2024-01-15',
            hari: 'Senin',
            nama_pengajar: 'Ustadz Ahmad',
            user_id: testUserId,
            materi: 'Fiqih',
            keterangan: 'Test 1'
          },
          {
            tanggal: '2024-01-16',
            hari: 'Selasa',
            nama_pengajar: 'Ustadz Budi',
            user_id: testUserId,
            materi: 'Quran',
            keterangan: 'Test 2'
          }
        ])
        .execute();

      const result = await getAllKBMReports();

      expect(result).toHaveLength(2);
      expect(result[0].hari).toEqual('Senin');
      expect(result[0].tanggal).toEqual(new Date('2024-01-15'));
      expect(result[1].hari).toEqual('Selasa');
      expect(result[1].tanggal).toEqual(new Date('2024-01-16'));
    });

    it('should return empty array when no reports exist', async () => {
      const result = await getAllKBMReports();
      expect(result).toHaveLength(0);
    });
  });

  describe('getKBMReportsByUser', () => {
    it('should return KBM reports for specific user', async () => {
      // Create another test user
      const anotherUserResult = await db.insert(usersTable)
        .values({
          username: 'anotherguru',
          password: 'hashedpassword',
          role: 'guru',
          full_name: 'Another Guru',
          is_active: true
        })
        .returning()
        .execute();
      const anotherUserId = anotherUserResult[0].id;

      // Create reports for both users
      await db.insert(kbmReportsTable)
        .values([
          {
            tanggal: '2024-01-15',
            hari: 'Senin',
            nama_pengajar: 'Ustadz Ahmad',
            user_id: testUserId,
            materi: 'Fiqih',
            keterangan: 'For test user'
          },
          {
            tanggal: '2024-01-16',
            hari: 'Selasa',
            nama_pengajar: 'Ustadz Budi',
            user_id: anotherUserId,
            materi: 'Quran',
            keterangan: 'For another user'
          }
        ])
        .execute();

      const result = await getKBMReportsByUser(testUserId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toEqual(testUserId);
      expect(result[0].keterangan).toEqual('For test user');
      expect(result[0].tanggal).toEqual(new Date('2024-01-15'));
    });

    it('should return empty array when user has no reports', async () => {
      const result = await getKBMReportsByUser(testUserId);
      expect(result).toHaveLength(0);
    });
  });

  describe('getKBMReportById', () => {
    it('should return KBM report by ID', async () => {
      const insertResult = await db.insert(kbmReportsTable)
        .values({
          tanggal: '2024-01-15',
          hari: 'Senin',
          nama_pengajar: 'Ustadz Ahmad',
          user_id: testUserId,
          materi: 'Fiqih',
          keterangan: 'Test report'
        })
        .returning()
        .execute();

      const reportId = insertResult[0].id;
      const result = await getKBMReportById(reportId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(reportId);
      expect(result!.hari).toEqual('Senin');
      expect(result!.tanggal).toEqual(new Date('2024-01-15'));
      expect(result!.keterangan).toEqual('Test report');
    });

    it('should return null when report does not exist', async () => {
      const result = await getKBMReportById(999);
      expect(result).toBeNull();
    });
  });

  describe('deleteKBMReport', () => {
    it('should delete KBM report and associated attendance records', async () => {
      // Create KBM report
      const kbmResult = await db.insert(kbmReportsTable)
        .values({
          tanggal: '2024-01-15',
          hari: 'Senin',
          nama_pengajar: 'Ustadz Ahmad',
          user_id: testUserId,
          materi: 'Fiqih',
          keterangan: 'Test report'
        })
        .returning()
        .execute();
      const reportId = kbmResult[0].id;

      // Create attendance records
      await db.insert(attendanceTable)
        .values([
          {
            generus_id: testGenerusId1,
            kbm_report_id: reportId,
            status: 'Hadir'
          },
          {
            generus_id: testGenerusId2,
            kbm_report_id: reportId,
            status: 'Sakit'
          }
        ])
        .execute();

      const result = await deleteKBMReport(reportId);

      expect(result).toBe(true);

      // Verify KBM report is deleted
      const reports = await db.select()
        .from(kbmReportsTable)
        .where(eq(kbmReportsTable.id, reportId))
        .execute();
      expect(reports).toHaveLength(0);

      // Verify attendance records are deleted
      const attendanceRecords = await db.select()
        .from(attendanceTable)
        .where(eq(attendanceTable.kbm_report_id, reportId))
        .execute();
      expect(attendanceRecords).toHaveLength(0);
    });

    it('should return false when report does not exist', async () => {
      const result = await deleteKBMReport(999);
      expect(result).toBe(false);
    });
  });
});
