
import { db } from '../db';
import { kbmReportsTable, attendanceTable, usersTable, generusTable } from '../db/schema';
import { type CreateKBMReportInput, type KBMReport } from '../schema';
import { eq } from 'drizzle-orm';

export async function createKBMReport(input: CreateKBMReportInput, userId: number): Promise<KBMReport> {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify all generus IDs exist
    for (const attendance of input.attendances) {
      const generus = await db.select()
        .from(generusTable)
        .where(eq(generusTable.id, attendance.generus_id))
        .execute();

      if (generus.length === 0) {
        throw new Error(`Generus with ID ${attendance.generus_id} not found`);
      }
    }

    // Create KBM report
    const kbmResult = await db.insert(kbmReportsTable)
      .values({
        tanggal: input.tanggal,
        hari: input.hari,
        nama_pengajar: input.nama_pengajar,
        user_id: userId,
        materi: input.materi,
        keterangan: input.keterangan || null
      })
      .returning()
      .execute();

    const kbmReport = kbmResult[0];

    // Create attendance records
    if (input.attendances.length > 0) {
      await db.insert(attendanceTable)
        .values(
          input.attendances.map(attendance => ({
            generus_id: attendance.generus_id,
            kbm_report_id: kbmReport.id,
            status: attendance.status
          }))
        )
        .execute();
    }

    // Convert date string to Date object for return
    return {
      ...kbmReport,
      tanggal: new Date(kbmReport.tanggal)
    };
  } catch (error) {
    console.error('KBM report creation failed:', error);
    throw error;
  }
}

export async function getAllKBMReports(): Promise<KBMReport[]> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .execute();

    // Convert date strings to Date objects
    return reports.map(report => ({
      ...report,
      tanggal: new Date(report.tanggal)
    }));
  } catch (error) {
    console.error('Failed to fetch KBM reports:', error);
    throw error;
  }
}

export async function getKBMReportsByUser(userId: number): Promise<KBMReport[]> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.user_id, userId))
      .execute();

    // Convert date strings to Date objects
    return reports.map(report => ({
      ...report,
      tanggal: new Date(report.tanggal)
    }));
  } catch (error) {
    console.error('Failed to fetch KBM reports by user:', error);
    throw error;
  }
}

export async function getKBMReportById(id: number): Promise<KBMReport | null> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.id, id))
      .execute();

    if (reports.length === 0) {
      return null;
    }

    // Convert date string to Date object
    return {
      ...reports[0],
      tanggal: new Date(reports[0].tanggal)
    };
  } catch (error) {
    console.error('Failed to fetch KBM report by ID:', error);
    throw error;
  }
}

export async function deleteKBMReport(id: number): Promise<boolean> {
  try {
    // Delete associated attendance records first
    await db.delete(attendanceTable)
      .where(eq(attendanceTable.kbm_report_id, id))
      .execute();

    // Delete the KBM report
    const result = await db.delete(kbmReportsTable)
      .where(eq(kbmReportsTable.id, id))
      .execute();

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Failed to delete KBM report:', error);
    throw error;
  }
}
