
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, generusTable, kbmReportsTable, attendanceTable } from '../db/schema';
import { 
  getAttendanceStats, 
  getMonthlyAttendanceStats, 
  getAttendanceByGenerus,
  getAttendanceByKBMReport 
} from '../handlers/attendance';

describe('Attendance Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  async function setupTestData() {
    // Create user
    const userResult = await db.insert(usersTable).values({
      username: 'teacher1',
      password: 'password123',
      role: 'guru',
      full_name: 'Teacher One',
      is_active: true
    }).returning().execute();
    const userId = userResult[0].id;

    // Create generus (students)
    const generusResults = await db.insert(generusTable).values([
      {
        nama_lengkap: 'Student One',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2000-01-01',
        kelompok_sambung: 'Group A',
        jenis_kelamin: 'Laki-laki',
        jenjang: 'SMA',
        status: 'Aktif'
      },
      {
        nama_lengkap: 'Student Two',
        tempat_lahir: 'Bandung',
        tanggal_lahir: '2000-02-01',
        kelompok_sambung: 'Group B',
        jenis_kelamin: 'Perempuan',
        jenjang: 'SMA',
        status: 'Aktif'
      }
    ]).returning().execute();

    // Create KBM reports
    const kbmResults = await db.insert(kbmReportsTable).values([
      {
        tanggal: '2024-01-15',
        hari: 'Monday',
        nama_pengajar: 'Teacher One',
        user_id: userId,
        materi: 'Math Lesson'
      },
      {
        tanggal: '2024-01-22',
        hari: 'Monday',
        nama_pengajar: 'Teacher One',
        user_id: userId,
        materi: 'Science Lesson'
      },
      {
        tanggal: '2024-02-05',
        hari: 'Monday',
        nama_pengajar: 'Teacher One',
        user_id: userId,
        materi: 'History Lesson'
      }
    ]).returning().execute();

    return {
      userId,
      generusIds: generusResults.map(g => g.id),
      kbmIds: kbmResults.map(k => k.id)
    };
  }

  describe('getAttendanceStats', () => {
    it('should return attendance statistics without date filter', async () => {
      const { generusIds, kbmIds } = await setupTestData();

      // Create attendance records
      await db.insert(attendanceTable).values([
        { generus_id: generusIds[0], kbm_report_id: kbmIds[0], status: 'Hadir' },
        { generus_id: generusIds[1], kbm_report_id: kbmIds[0], status: 'Sakit' },
        { generus_id: generusIds[0], kbm_report_id: kbmIds[1], status: 'Hadir' },
        { generus_id: generusIds[1], kbm_report_id: kbmIds[1], status: 'Izin' }
      ]).execute();

      const result = await getAttendanceStats();

      expect(result.total_generus).toBe(2);
      expect(typeof result.total_generus).toBe('number');
      expect(result.hadir).toBe(2);
      expect(result.sakit).toBe(1);
      expect(result.izin).toBe(1);
      expect(result.alfa).toBe(0);
      expect(result.periode).toBe('N/A - N/A');
    });

    it('should return attendance statistics with date filter', async () => {
      const { generusIds, kbmIds } = await setupTestData();

      // Create attendance records
      await db.insert(attendanceTable).values([
        { generus_id: generusIds[0], kbm_report_id: kbmIds[0], status: 'Hadir' }, // Jan 15
        { generus_id: generusIds[1], kbm_report_id: kbmIds[0], status: 'Sakit' }, // Jan 15
        { generus_id: generusIds[0], kbm_report_id: kbmIds[1], status: 'Hadir' }, // Jan 22
        { generus_id: generusIds[0], kbm_report_id: kbmIds[2], status: 'Tidak Hadir/Alfa' } // Feb 5 - should be excluded
      ]).execute();

      const result = await getAttendanceStats('2024-01-01', '2024-01-31');

      expect(result.total_generus).toBe(2);
      expect(typeof result.total_generus).toBe('number');
      expect(result.hadir).toBe(2);
      expect(result.sakit).toBe(1);
      expect(result.izin).toBe(0);
      expect(result.alfa).toBe(0);
      expect(result.periode).toBe('2024-01-01 - 2024-01-31');
    });

    it('should return zero stats when no data exists', async () => {
      const result = await getAttendanceStats();

      expect(result.total_generus).toBe(0);
      expect(typeof result.total_generus).toBe('number');
      expect(result.hadir).toBe(0);
      expect(result.sakit).toBe(0);
      expect(result.izin).toBe(0);
      expect(result.alfa).toBe(0);
    });
  });

  describe('getMonthlyAttendanceStats', () => {
    it('should return monthly stats for specific month', async () => {
      const { generusIds, kbmIds } = await setupTestData();

      // Create attendance records for January
      await db.insert(attendanceTable).values([
        { generus_id: generusIds[0], kbm_report_id: kbmIds[0], status: 'Hadir' },
        { generus_id: generusIds[1], kbm_report_id: kbmIds[0], status: 'Hadir' },
        { generus_id: generusIds[0], kbm_report_id: kbmIds[1], status: 'Hadir' }
      ]).execute();

      const results = await getMonthlyAttendanceStats(2024, 1);

      expect(results).toHaveLength(1);
      expect(results[0].month).toBe('January');
      expect(results[0].year).toBe(2024);
      expect(results[0].total_kbm).toBe(2);
      expect(typeof results[0].total_kbm).toBe('number');
      expect(results[0].avg_attendance).toBeGreaterThan(0);
      expect(results[0].weekly_data).toHaveLength(4);
      results[0].weekly_data.forEach(week => {
        expect(typeof week.attendance_count).toBe('number');
        expect(typeof week.total_generus).toBe('number');
      });
    });

    it('should return stats for all months when no specific month provided', async () => {
      await setupTestData();

      const results = await getMonthlyAttendanceStats(2024);

      expect(results).toHaveLength(12);
      expect(results[0].month).toBe('January');
      expect(results[11].month).toBe('December');
      results.forEach(result => {
        expect(result.year).toBe(2024);
        expect(result.weekly_data).toHaveLength(4);
        expect(typeof result.avg_attendance).toBe('number');
        expect(typeof result.total_kbm).toBe('number');
        result.weekly_data.forEach(week => {
          expect(typeof week.attendance_count).toBe('number');
          expect(typeof week.total_generus).toBe('number');
        });
      });
    });

    it('should return empty weekly data when no attendance exists', async () => {
      const results = await getMonthlyAttendanceStats(2024, 3);

      expect(results).toHaveLength(1);
      expect(results[0].month).toBe('March');
      expect(results[0].total_kbm).toBe(0);
      expect(typeof results[0].total_kbm).toBe('number');
      expect(results[0].avg_attendance).toBe(0);
      expect(results[0].weekly_data).toHaveLength(4);
      results[0].weekly_data.forEach(week => {
        expect(week.attendance_count).toBe(0);
        expect(typeof week.attendance_count).toBe('number');
        expect(week.total_generus).toBe(0);
        expect(typeof week.total_generus).toBe('number');
      });
    });
  });

  describe('getAttendanceByGenerus', () => {
    it('should return attendance records for specific generus', async () => {
      const { generusIds, kbmIds } = await setupTestData();

      await db.insert(attendanceTable).values([
        { generus_id: generusIds[0], kbm_report_id: kbmIds[0], status: 'Hadir' },
        { generus_id: generusIds[0], kbm_report_id: kbmIds[1], status: 'Sakit' },
        { generus_id: generusIds[1], kbm_report_id: kbmIds[0], status: 'Hadir' } // Different generus - should be excluded
      ]).execute();

      const results = await getAttendanceByGenerus(generusIds[0]);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.generus_id).toBe(generusIds[0]);
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeInstanceOf(Date);
        expect(['Hadir', 'Sakit', 'Izin', 'Tidak Hadir/Alfa']).toContain(result.status);
      });
    });

    it('should filter attendance by date range', async () => {
      const { generusIds, kbmIds } = await setupTestData();

      await db.insert(attendanceTable).values([
        { generus_id: generusIds[0], kbm_report_id: kbmIds[0], status: 'Hadir' }, // Jan 15
        { generus_id: generusIds[0], kbm_report_id: kbmIds[1], status: 'Sakit' }, // Jan 22
        { generus_id: generusIds[0], kbm_report_id: kbmIds[2], status: 'Izin' }   // Feb 5 - should be excluded
      ]).execute();

      const results = await getAttendanceByGenerus(generusIds[0], '2024-01-01', '2024-01-31');

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.generus_id).toBe(generusIds[0]);
        expect(['Hadir', 'Sakit']).toContain(result.status);
      });
    });

    it('should return empty array when no attendance exists for generus', async () => {
      const { generusIds } = await setupTestData();

      const results = await getAttendanceByGenerus(generusIds[0]);

      expect(results).toHaveLength(0);
    });
  });

  describe('getAttendanceByKBMReport', () => {
    it('should return all attendance records for specific KBM report', async () => {
      const { generusIds, kbmIds } = await setupTestData();

      await db.insert(attendanceTable).values([
        { generus_id: generusIds[0], kbm_report_id: kbmIds[0], status: 'Hadir' },
        { generus_id: generusIds[1], kbm_report_id: kbmIds[0], status: 'Sakit' },
        { generus_id: generusIds[0], kbm_report_id: kbmIds[1], status: 'Izin' } // Different KBM - should be excluded
      ]).execute();

      const results = await getAttendanceByKBMReport(kbmIds[0]);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.kbm_report_id).toBe(kbmIds[0]);
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeInstanceOf(Date);
        expect(['Hadir', 'Sakit', 'Izin', 'Tidak Hadir/Alfa']).toContain(result.status);
      });

      // Verify both students are included
      const generusIdsInResults = results.map(r => r.generus_id).sort();
      expect(generusIdsInResults).toEqual([generusIds[0], generusIds[1]].sort());
    });

    it('should return empty array when no attendance exists for KBM report', async () => {
      const { kbmIds } = await setupTestData();

      const results = await getAttendanceByKBMReport(kbmIds[0]);

      expect(results).toHaveLength(0);
    });

    it('should handle non-existent KBM report ID', async () => {
      const results = await getAttendanceByKBMReport(999);

      expect(results).toHaveLength(0);
    });
  });
});
